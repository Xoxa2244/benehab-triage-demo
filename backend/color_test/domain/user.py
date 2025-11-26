from .timestamps_model import TimestampsModel
from pydantic import Field
import uuid
from typing import Any
from .demographics import Demographics


class User(TimestampsModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str | None = None
    password: str | None = None
    chat_id: str | None = Field(
        default=None, description="Идентификатор чата, связанного с пользователем"
    )
    demographics: Demographics | None = Field(
        default=None, description="Анкетные данные пользователя"
    )
    attitude_profile: dict[str, Any] | None = Field(
        default=None, description="Результат опроса по attitude (41 ответ -> профиль)"
    )
    typology_profile: dict[str, Any] | None = Field(
        default=None, description="Результат теста accentuation/typology"
    )
    values_profile: dict[str, Any] | None = Field(
        default=None, description="Результат теста values (цветовые ассоциации/ранги)"
    )
