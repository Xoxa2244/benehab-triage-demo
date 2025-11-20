from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class MessageDict(BaseModel):
    """Модель для одного сообщения в чате"""
    role: str = Field(..., description="Роль отправителя: 'patient' или 'nurse'")
    content: str = Field(..., description="Содержимое сообщения")
    timestamp: str = Field(..., description="Временная метка сообщения в ISO формате")


class CreateChatRequest(BaseModel):
    """Запрос на создание нового чата"""
    diagnosis: str = Field(..., description="Диагноз пациента", min_length=1)
    prescriptions: str = Field(..., description="Назначения врача", min_length=1)
    patient_tags: List[str] = Field(..., description="Список тегов пациента (PatientType + IssueType)", min_items=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "diagnosis": "Грипп",
                "prescriptions": "Пить много жидкости, принимать парацетамол по 500 мг каждые 6 часов",
                "patient_tags": ["CLOSED", "ANXIETY", "HEAVY_STATE"]
            }
        }


class SendMessageRequest(BaseModel):
    """Запрос на отправку сообщения от пациента"""
    message: str = Field(..., description="Текст сообщения от пациента", min_length=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Здравствуйте, у меня болит голова"
            }
        }


class ChatResponse(BaseModel):
    """Ответ с полной информацией о чате"""
    chat_id: str = Field(..., description="Уникальный идентификатор чата")
    diagnosis: str = Field(..., description="Диагноз пациента")
    prescriptions: str = Field(..., description="Назначения врача")
    patient_tags: List[str] = Field(..., description="Список тегов пациента")
    specific_instructions: str = Field(..., description="Сгенерированные инструкции для общения")
    messages: List[Dict[str, str]] = Field(..., description="История сообщений")
    is_active: bool = Field(..., description="Активен ли чат")
    created_at: datetime = Field(..., description="Время создания чата")
    updated_at: datetime = Field(..., description="Время последнего обновления")
    
    class Config:
        json_schema_extra = {
            "example": {
                "chat_id": "chat_123456",
                "diagnosis": "Грипп",
                "prescriptions": "Пить много жидкости, принимать парацетамол по 500 мг каждые 6 часов",
                "patient_tags": ["CLOSED", "ANXIETY", "HEAVY_STATE"],
                "specific_instructions": "Используйте короткие и ясные сообщения. Избегайте напористости...",
                "messages": [
                    {"role": "patient", "content": "Здравствуйте", "timestamp": "2024-01-01T12:00:00"},
                    {"role": "nurse", "content": "Здравствуйте! Как вы себя чувствуете?", "timestamp": "2024-01-01T12:00:05"}
                ],
                "is_active": True,
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:05"
            }
        }


class MessageResponse(BaseModel):
    """Ответ после добавления сообщения"""
    chat_id: str = Field(..., description="Идентификатор чата")
    message: Dict[str, str] = Field(..., description="Добавленное сообщение")
    
    class Config:
        json_schema_extra = {
            "example": {
                "chat_id": "chat_123456",
                "message": {
                    "role": "patient",
                    "content": "Здравствуйте",
                    "timestamp": "2024-01-01T12:00:00"
                },
                "total_messages": 5
            }
        }


class ChatListResponse(BaseModel):
    """Ответ со списком чатов"""
    chats: List[ChatResponse] = Field(..., description="Список чатов")
    total: int = Field(..., description="Общее количество чатов")


class SuccessResponse(BaseModel):
    """Общий ответ об успешной операции"""
    success: bool = Field(default=True, description="Статус операции")
    message: str = Field(..., description="Сообщение о результате")
    chat_id: Optional[str] = Field(None, description="ID чата (если применимо)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "История чата успешно очищена",
                "chat_id": "chat_123456"
            }
        }


class ErrorResponse(BaseModel):
    """Ответ с ошибкой"""
    success: bool = Field(default=False, description="Статус операции")
    error: str = Field(..., description="Описание ошибки")
    detail: Optional[str] = Field(None, description="Детали ошибки")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Chat not found",
                "detail": "Чат с ID 'chat_123456' не найден"
            }
        }


class UpdateInstructionsRequest(BaseModel):
    """Запрос на обновление инструкций чата на основе новых тегов"""
    patient_tags: Optional[List[str]] = Field(None, description="Новые теги пациента (если не переданы, используются теги чата)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_tags": ["CLOSED", "ANXIETY", "HEAVY_STATE"]
            }
        }


class InstructionsPreviewResponse(BaseModel):
    """Ответ с сырыми и финальными инструкциями по чату"""
    patient_tags: List[str]
    dos: List[str]
    donts: List[str]
    specific_instructions: str
