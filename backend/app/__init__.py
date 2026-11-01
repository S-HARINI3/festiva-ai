"""
Festiva AI — FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import api_router

MAX_PAYLOAD_BYTES = 10 * 1024 * 1024  # 10 MB payload ceiling

app = FastAPI(
    title="Festiva AI API",
    description="AI-powered event planning backend for Festiva AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Request Size Limit & Security Headers Middleware
@app.middleware("http")
async def security_and_size_middleware(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_PAYLOAD_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request payload too large. Maximum payload size is 10MB."}
        )
    
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# CORS Configuration — Supports explicit production domains and regex for Vercel previews
cors_origins = settings.cors_origins_list
is_wildcard = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else cors_origins,
    allow_origin_regex=None if is_wildcard else r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Festiva AI API",
        "tagline": "Big moments. Beautifully planned.",
        "docs": "/docs",
        "health": "/api/health",
        "demo_mode": settings.is_demo_mode,
        "environment": settings.APP_ENV,
    }


@app.get("/healthz")
@app.get("/health")
async def healthz():
    """Standard cloud orchestrator health probe."""
    return {
        "status": "healthy",
        "service": "Festiva AI Backend",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "demo_mode": settings.is_demo_mode,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
    }
