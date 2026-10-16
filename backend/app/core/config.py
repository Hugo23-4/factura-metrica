from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "FacturaMétrica API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "factura-metrica-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días
    
    DATABASE_URL: str = "sqlite:///./factura_metrica.db"
    
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
