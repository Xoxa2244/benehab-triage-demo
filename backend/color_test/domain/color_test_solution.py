
from pydantic import BaseModel, field_validator, Field
import uuid
from .color import Color
from .concept import Concept


class ColorTestSolution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    concept_color_matrix: list[list[Concept]]

    @field_validator('concept_color_matrix', mode='after')
    @staticmethod
    def validate_concept_color_matrix(v):
        if len(v) != len(Color):
            raise ValueError(
                f'concept_color_matrix must have the same number of columns'
                f' as colors, got {len(v)} columns but expected {len(Color)}')

        # Flatten all concepts from all columns
        all_concepts = []
        normalized_matrix = []
        for column in v:
            normalized_column = []
            for c in column:
                if isinstance(c, Concept):
                    normalized_column.append(c)
                else:
                    try:
                        normalized_column.append(Concept(c))
                    except ValueError as exc:
                        raise ValueError(f"Unknown concept: {c}") from exc
            normalized_matrix.append(normalized_column)
            all_concepts.extend(normalized_column)

        # Check that all concepts from Concept enum are present exactly once
        expected_concepts = set(Concept)
        actual_concepts = set(all_concepts)

        if expected_concepts != actual_concepts:
            missing = expected_concepts - actual_concepts
            extra = actual_concepts - expected_concepts
            error_msg = (
                'concept_color_matrix must contain each concept exactly once '
                'across all columns.'
            )
            if missing:
                error_msg += f' Missing concepts: {sorted(missing)}.'
            if extra:
                error_msg += f' Extra concepts: {sorted(extra)}.'
            raise ValueError(error_msg)

        return normalized_matrix
