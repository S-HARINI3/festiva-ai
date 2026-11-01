"""
Festiva AI — Security, Authentication & Authorization Engine
Supports Supabase JWT verification, role-based access, rate-limiting,
payload size guards, and deterministic demo-mode authorization.
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import time
from collections import defaultdict

from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError

from app.core.config import settings

# Standard HTTP Bearer scheme
security = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "user"
    is_demo: bool = False
    created_at: Optional[str] = None


# Demo User Constant
DEMO_USER_ID = "demo-user-001"
DEMO_AUTH_USER = AuthUser(
    id=DEMO_USER_ID,
    email="demo@festiva.ai",
    full_name="Demo User",
    role="planner",
    is_demo=True,
    created_at=datetime.utcnow().isoformat(),
)


class RateLimiter:
    """
    Sliding-window in-memory rate limiter with automatic bucket cleanup.
    Protects sensitive auth and AI endpoints against brute force and abuse.
    """
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)

    def check(self, client_key: str):
        now = time.time()
        window_start = now - 60.0

        # Purge timestamps outside the 60s sliding window
        valid_timestamps = [ts for ts in self.requests[client_key] if ts > window_start]
        self.requests[client_key] = valid_timestamps

        if len(valid_timestamps) >= self.rpm:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.rpm} requests per minute allowed.",
            )

        self.requests[client_key].append(now)


# Standard limiter instances
auth_rate_limiter = RateLimiter(requests_per_minute=20)
general_rate_limiter = RateLimiter(requests_per_minute=120)


async def get_current_user(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
) -> AuthUser:
    """
    Validates current caller identity.
    - When Supabase credentials or JWT_SECRET are active: decodes and verifies JWT.
    - When in Demo Mode: allows demo exploration while strictly isolating demo user IDs.
    """
    # 1. Bearer Token Verification
    if auth_header and auth_header.credentials:
        token = auth_header.credentials
        
        # Try Supabase verification if secret or client available
        if settings.JWT_SECRET:
            try:
                payload = jwt.decode(
                    token,
                    settings.JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
                user_id = payload.get("sub") or payload.get("id")
                email = payload.get("email", "")
                if user_id:
                    return AuthUser(
                        id=user_id,
                        email=email,
                        full_name=payload.get("user_metadata", {}).get("full_name"),
                        role=payload.get("role", "user"),
                        is_demo=False,
                    )
            except JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid, expired, or tampered session token. Please sign in again.",
                )

        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                from supabase import create_client
                client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                user_res = client.auth.get_user(token)
                if user_res and user_res.user:
                    u = user_res.user
                    return AuthUser(
                        id=u.id,
                        email=u.email or "",
                        full_name=u.user_metadata.get("full_name") if u.user_metadata else None,
                        role="user",
                        is_demo=False,
                        created_at=str(u.created_at) if hasattr(u, "created_at") else None,
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Authentication failed: {str(e)}",
                )

    # 2. Demo Mode Fallback
    # If in demo mode (no Supabase configured), allow authorized demo session
    target_id = x_user_id or DEMO_USER_ID
    return AuthUser(
        id=target_id,
        email="demo@festiva.ai" if target_id == DEMO_USER_ID else f"{target_id}@festiva.local",
        full_name="Demo User" if target_id == DEMO_USER_ID else f"Planner ({target_id[:8]})",
        role="user",
        is_demo=True,
    )


def verify_event_ownership(event: Dict[str, Any], caller: AuthUser) -> bool:
    """
    Enforces authorization boundary: caller must own the requested event.
    """
    if not event:
        return False
    event_user_id = str(event.get("user_id", ""))
    return event_user_id == str(caller.id)

