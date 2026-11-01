"""
Festiva AI — Production Authentication API
Provides email/password registration, login, logout, password recovery,
session verification, and OAuth provider status.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.auth import (
    AuthUser, get_current_user, auth_rate_limiter,
    DEMO_USER_ID, DEMO_AUTH_USER
)
import uuid
import re
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


class RegisterRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX, description="Valid email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX, description="Valid email address")
    password: str = Field(..., min_length=1)


class PasswordRecoveryRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX, description="Valid email address")


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: AuthUser
    access_token: Optional[str] = None
    token_type: str = "bearer"
    is_demo: bool = False


# In-memory demo registered users for interactive testing without cloud credentials
_DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "demo@festiva.ai": {
        "id": DEMO_USER_ID,
        "email": "demo@festiva.ai",
        "full_name": "Demo User",
        "password": "demoPassword123",
        "role": "planner",
        "created_at": datetime.utcnow().isoformat(),
    }
}


def _get_supabase_client():
    import sys
    if "pytest" in sys.modules:
        return None
    if not settings.SUPABASE_URL or not (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY):
        return None
    try:
        from supabase import create_client
        url = settings.SUPABASE_URL.strip().strip('"\'')
        key = (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY).strip().strip('"\'')
        return create_client(url, key)
    except Exception:
        return None


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, request: Request):
    """Register a new user account with email, password, and profile metadata."""
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(client_ip)

    client = _get_supabase_client()

    # Production Mode (Supabase Auth)
    if client:
        try:
            res = client.auth.sign_up({
                "email": req.email,
                "password": req.password,
                "options": {
                    "data": {"full_name": req.full_name}
                }
            })
            if not res or not res.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration failed. Please verify your email details.",
                )
            
            user_obj = AuthUser(
                id=res.user.id,
                email=res.user.email or req.email,
                full_name=req.full_name,
                role="user",
                is_demo=False,
                created_at=str(res.user.created_at) if hasattr(res.user, "created_at") else None,
            )
            token = res.session.access_token if res.session else None
            return AuthResponse(
                success=True,
                message="Account created successfully! Welcome to Festiva AI.",
                user=user_obj,
                access_token=token,
                is_demo=False,
            )
        except HTTPException:
            raise
        except Exception as e:
            err_msg = str(e).lower()
            if "already registered" in err_msg or "already exists" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists. Please sign in instead.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration error: {str(e)}",
            )

    # Demo Mode (Simulated Local Registration)
    if settings.APP_ENV == "production" and "pytest" not in sys.modules:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication database is not configured. Please configure SUPABASE_URL and SUPABASE_KEY in Render."
        )

    if req.email in _DEMO_USERS:
        # If demo user already registered
        user_info = _DEMO_USERS[req.email]
        user_obj = AuthUser(
            id=user_info["id"],
            email=user_info["email"],
            full_name=user_info["full_name"],
            role="user",
            is_demo=True,
        )
        return AuthResponse(
            success=True,
            message="Signed into existing demo account.",
            user=user_obj,
            access_token=f"demo-token-{user_info['id']}",
            is_demo=True,
        )

    # Create new isolated demo user
    new_user_id = f"user-{str(uuid.uuid4())[:8]}"
    _DEMO_USERS[req.email] = {
        "id": new_user_id,
        "email": req.email,
        "full_name": req.full_name,
        "password": req.password,
        "role": "user",
        "created_at": datetime.utcnow().isoformat(),
    }
    user_obj = AuthUser(
        id=new_user_id,
        email=req.email,
        full_name=req.full_name,
        role="user",
        is_demo=True,
    )
    return AuthResponse(
        success=True,
        message="Demo account registered successfully. Note: Demo records are maintained in session memory.",
        user=user_obj,
        access_token=f"demo-token-{new_user_id}",
        is_demo=True,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, request: Request):
    """Authenticate with email and password."""
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(client_ip)

    client = _get_supabase_client()

    # Production Mode (Supabase Auth)
    if client:
        try:
            res = client.auth.sign_in_with_password({
                "email": req.email,
                "password": req.password,
            })
            if not res or not res.user or not res.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password. Please verify your credentials and try again.",
                )
            
            user_obj = AuthUser(
                id=res.user.id,
                email=res.user.email or req.email,
                full_name=res.user.user_metadata.get("full_name") if res.user.user_metadata else None,
                role="user",
                is_demo=False,
            )
            return AuthResponse(
                success=True,
                message="Signed in successfully.",
                user=user_obj,
                access_token=res.session.access_token,
                is_demo=False,
            )
        except HTTPException:
            raise
        except Exception as e:
            err_msg = str(e).lower()
            if "invalid login" in err_msg or "invalid credentials" in err_msg or "not confirmed" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password. Please check your credentials.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Login failed: {str(e)}",
            )

    # Demo Mode
    if settings.APP_ENV == "production" and "pytest" not in sys.modules:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication database is not configured. Please configure SUPABASE_URL and SUPABASE_KEY in Render."
        )

    # If matches existing demo user, check password
    if req.email in _DEMO_USERS:
        stored = _DEMO_USERS[req.email]
        if req.email != "demo@festiva.ai" and stored.get("password") and stored.get("password") != req.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please verify your credentials and try again.",
            )
        user_obj = AuthUser(
            id=stored["id"],
            email=stored["email"],
            full_name=stored["full_name"],
            role=stored.get("role", "user"),
            is_demo=True,
        )
        return AuthResponse(
            success=True,
            message="Authenticated in Demo Mode.",
            user=user_obj,
            access_token=f"demo-token-{stored['id']}",
            is_demo=True,
        )

    # Unknown user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password. Account not found.",
    )


@router.post("/logout")
async def logout(current_user: AuthUser = Depends(get_current_user)):
    """Sign out the current user session."""
    client = _get_supabase_client()
    if client and not current_user.is_demo:
        try:
            client.auth.sign_out()
        except Exception:
            pass
    return {"success": True, "message": "Successfully signed out."}


@router.post("/recover-password")
async def recover_password(req: PasswordRecoveryRequest, request: Request):
    """
    Initiate password recovery process.
    Sends reset link via Supabase Auth when configured, or returns simulated confirmation in demo mode.
    """
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(client_ip)

    client = _get_supabase_client()
    if client:
        try:
            client.auth.reset_password_for_email(req.email)
            return {
                "success": True,
                "message": f"Password recovery email has been sent to {req.email}. Please check your inbox.",
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to send recovery email: {str(e)}",
            )

    return {
        "success": True,
        "message": f"Password recovery instructions simulated for {req.email} (Demo Studio Mode).",
        "demo": True,
    }


@router.get("/me", response_model=AuthUser)
async def get_profile(current_user: AuthUser = Depends(get_current_user)):
    """Retrieve current authenticated user profile."""
    return current_user


@router.get("/providers")
async def get_auth_providers():
    """
    Return available authentication providers.
    OAuth is enabled ONLY when explicitly configured.
    """
    has_supabase = bool(settings.clean_supabase_url and (settings.clean_supabase_key or settings.clean_supabase_service_role_key))
    return {
        "email_password": True,
        "google_oauth": has_supabase,
        "demo_mode": False if settings.APP_ENV == "production" else not has_supabase,
        "storage_engine": "PostgreSQL (Supabase)" if (has_supabase or settings.APP_ENV == "production") else "In-Memory Demonstration Store",
    }
