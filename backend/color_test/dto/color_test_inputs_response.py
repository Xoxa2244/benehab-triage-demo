from pydantic import BaseModel, Field
from ..domain import Color
from ..domain import Concept


class ColorTestInputsResponse(BaseModel):
    colors: list[str] = Field(
        default_factory=lambda: Color.__members__.values())
    concepts: list[str] = Field(
        default_factory=lambda: Concept.__members__.values())
