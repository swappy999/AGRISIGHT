import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Compute paths to .env in backend directory or workspace root
_base_dir = Path(__file__).resolve().parent.parent.parent
_env_paths = [
    _base_dir / ".env",
    _base_dir.parent / ".env",
    Path(".env"),
    Path("backend/.env"),
]

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriSight API"
    VERSION: str = "1.0.0"

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    GEMINI_API_KEY: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(
        env_file=[str(p) for p in _env_paths if p.exists()] or [".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

