from datetime import datetime
from typing import List, Dict
from beanie import Document
from pydantic import Field


class ChatDocument(Document):
    """
    MongoDB документ для хранения чата с пациентом.
    Содержит медицинские данные, инструкции для LLM и историю сообщений.
    """
    # Идентификация
    chat_id: str = Field(..., description="Уникальный идентификатор чата")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Время создания чата")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Время последнего обновления")
    
    # Медицинские данные
    diagnosis: str = Field(..., description="Диагноз пациента")
    prescriptions: str = Field(..., description="Назначения врача")
    patient_tags: List[str] = Field(default_factory=list, description="Теги пациента (PatientType + IssueType)")
    
    # Инструкции для LLM
    specific_instructions: str = Field(default="", description="Сгенерированные инструкции для общения с пациентом")
    
    # История чата
    messages: List[Dict[str, str]] = Field(
        default_factory=list,
        description="История сообщений в формате [{'role': 'patient|nurse', 'content': '...', 'timestamp': '...'}]"
    )
    
    # Метаданные
    is_active: bool = Field(default=True, description="Активен ли чат")
    
    class Settings:
        name = "chats"
        indexes = [
            "chat_id",
            "created_at",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "chat_id": "chat_123456",
                "diagnosis": "Грипп",
                "prescriptions": "Пить много жидкости, принимать парацетамол по 500 мг каждые 6 часов",
                "patient_tags": ["CLOSED", "ANXIETY", "HEAVY_STATE"],
                "specific_instructions": "Используйте короткие и ясные сообщения...",
                "messages": [
                    {"role": "patient", "content": "Как дела?", "timestamp": "2024-01-01T12:00:00"},
                    {"role": "nurse", "content": "Здравствуйте! Как вы себя чувствуете?", "timestamp": "2024-01-01T12:00:05"}
                ],
                "is_active": True
            }
        }