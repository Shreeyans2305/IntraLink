from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB: str = "intralink"
    USE_MOCK_DB: bool = False
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    ALGORITHM: str = "HS256"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://localhost:5174"
    PUBLIC_URL: str = ""           # e.g. https://intralink-f9yc.onrender.com — enables self-ping
    SELF_PING_INTERVAL_SECONDS: int = 300  # 5 minutes

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
