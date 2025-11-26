from beanie import Document, Link
from pydantic import Field

from backend.documents.ChatDocument import ChatDocument
from ..domain import User, Demographics
from .color_test_result_document import ColorTestResultDocument


class UserDocument(Document, User):
    id: str = Field(alias="_id")
    chat_id: str | None = Field(
        default=None, description="Идентификатор чата, связанного с пользователем"
    )
    demographics: Demographics | None = Field(
        default=None, description="Анкетные данные пользователя"
    )
    attitude_profile: dict | None = Field(
        default=None, description="Результат опроса по attitude"
    )
    typology_profile: dict | None = Field(
        default=None, description="Результат теста accentuation/typology"
    )
    values_profile: dict | None = Field(
        default=None, description="Результат теста values"
    )
    color_test_results: list[Link[ColorTestResultDocument]] = Field(
        default_factory=list
    )
    chat: Link[ChatDocument] | None = Field(
        default=None, description="Связанный чат пользователя"
    )

    class Settings:
        name = "users"
