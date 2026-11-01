from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_ENV: str = "production"
    CORS_ORIGINS: str = (
        "https://festiva-ai-phi.vercel.app,"
        "https://festiva-ai.vercel.app,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "http://localhost:8000"
    )

    # Gemini
    GEMINI_API_KEY: str = ""

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    JWT_SECRET: str = ""

    @property
    def clean_supabase_url(self) -> str:
        return self.SUPABASE_URL.strip().strip('"\'') if self.SUPABASE_URL else ""

    @property
    def clean_supabase_key(self) -> str:
        return self.SUPABASE_KEY.strip().strip('"\'') if self.SUPABASE_KEY else ""

    @property
    def clean_supabase_service_role_key(self) -> str:
        return self.SUPABASE_SERVICE_ROLE_KEY.strip().strip('"\'') if self.SUPABASE_SERVICE_ROLE_KEY else ""

    @property
    def clean_gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY.strip().strip('"\'') if self.GEMINI_API_KEY else ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_demo_mode(self) -> bool:
        return not bool(self.clean_gemini_api_key)


settings = Settings()
