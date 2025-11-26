
from beanie import Document, Link
from ..domain import User
from pydantic import Field
from .color_test_result_document import ColorTestResultDocument


class UserDocument(Document, User):
    id: str = Field(alias="_id")
    color_test_results: list[Link[ColorTestResultDocument]] = Field(
        default_factory=list
    )

    class Settings:
        name = "users"
