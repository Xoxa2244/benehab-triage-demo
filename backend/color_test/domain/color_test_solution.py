
from pydantic import BaseModel, field_validator, Field
import uuid
from .color import Color


class ColorTestSolution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    concept_color_matrix: list[list[str]]

    @field_validator('concept_color_matrix', mode='after')
    @staticmethod
    def validate_concept_color_matrix(v):
        if len(v) != len(Color):
            raise ValueError(
                f'concept_color_matrix must have the same number of columns'
                f' as colors, got {len(v)} columns but expected {len(Color)}')

        # Flatten to ensure we don't keep falsy values
        normalized_matrix = []
        for column in v:
            normalized_column = []
            for c in column:
                normalized_column.append(str(c).strip())
            normalized_matrix.append(normalized_column)

        return normalized_matrix
