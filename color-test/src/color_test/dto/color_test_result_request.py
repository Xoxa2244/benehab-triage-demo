from pydantic import BaseModel, Field
from ..domain import ColorTestSolution


class ColorTestResultRequest(BaseModel):
    user_id: str = Field(...,
                         description="Identifier of the user taking the test")
    color_test_solution: ColorTestSolution
