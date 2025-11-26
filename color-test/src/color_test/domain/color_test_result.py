from .timestamps_model import TimestampsModel
from pydantic import Field
import uuid
from .color_test_solution import ColorTestSolution


class ColorTestResult(TimestampsModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    color_test_solution: ColorTestSolution
    calculated_metrics: dict[str, float]
