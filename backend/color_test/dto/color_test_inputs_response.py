from pydantic import BaseModel
from ..domain import Color


class ColorTestInputsResponse(BaseModel):
    colors: list[str]
    concepts: list[str]
