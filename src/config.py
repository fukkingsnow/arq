from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables
    """
    
    # FastAPI settings
    APP_NAME: str = "ARQ - AI Assistant"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./arq_memory.db"
    )
    DATABASE_ECHO: bool = DEBUG
    
    # Redis (optional)
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    
    # OpenAI / LLM settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4")
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "2000"))
    
    # Memory settings
    MEMORY_BATCH_SIZE: int = int(os.getenv("MEMORY_BATCH_SIZE", "10"))
    MEMORY_TTL_SECONDS: int = int(os.getenv("MEMORY_TTL_SECONDS", "86400"))
    MAX_CONTEXT_MESSAGES: int = int(os.getenv("MAX_CONTEXT_MESSAGES", "20"))
    
    # Telegram settings (optional)
    TELEGRAM_TOKEN: Optional[str] = os.getenv("TELEGRAM_TOKEN")
    TELEGRAM_BOT_ID: Optional[str] = os.getenv("TELEGRAM_BOT_ID")
    
    # Beget API settings
    BEGET_API_URL: str = os.getenv("BEGET_API_URL", "https://cp.beget.com/api")
    BEGET_API_KEY: Optional[str] = os.getenv("BEGET_API_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
