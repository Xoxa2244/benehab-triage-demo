from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional, Any


class Settings(BaseSettings):
    """
    Настройки приложения с использованием Pydantic Settings.
    Значения автоматически загружаются из переменных окружения или .env файла.
    """
    
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "benehab_chat_db"
    
    # OpenAI
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    
    # API
    api_host: str = "localhost"
    api_port: int = 8000
    
    # CORS - stored as string, converted to list
    cors_origins: str = "*"
    
    # Режим разработки
    debug: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    def get_cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list"""
        if not self.cors_origins or self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]


# Создаем глобальный экземпляр настроек
settings = Settings()