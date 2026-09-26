"""
BehaviorIQ Configuration
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "BehaviorIQ"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./data/behavioriq.db"

    # File uploads
    UPLOAD_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # ML Configuration
    DEFAULT_CLUSTERS: int = 5
    MIN_CLUSTERS: int = 2
    MAX_CLUSTERS: int = 10
    BOOTSTRAP_ITERATIONS: int = 5
    RANDOM_STATE: int = 42

    # Synthetic data
    SYNTHETIC_CUSTOMERS: int = 10000

    # AI / LLM
    GEMINI_API_KEY: str = ""

    # Auth
    SECRET_KEY: str = "behavioriq-dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
