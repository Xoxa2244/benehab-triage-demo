from beanie import Document
from pydantic import Field
import uuid
from ..domain import ColorTestResult


class ColorTestResultDocument(Document, ColorTestResult):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str = Field(description="Идентификатор пользователя, прошедшего тест")

    class Settings:
        name = "color_test_results"
