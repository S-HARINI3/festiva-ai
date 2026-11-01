from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "service": "Festiva AI Backend",
        "version": "1.0.0",
        "demo_mode": settings.is_demo_mode,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
    }
