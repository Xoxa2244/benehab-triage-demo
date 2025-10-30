from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


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
    
    # CORS
    cors_origins: list[str] = ["*"]
    
    # Режим разработки
    debug: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Создаем глобальный экземпляр настроек
settings = Settings()