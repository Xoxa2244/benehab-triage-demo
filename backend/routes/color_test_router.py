from fastapi import APIRouter, HTTPException, status

from backend.color_test.entities import (
    ColorTestResultDocument,
    MetricDocument,
    UserDocument,
)
from backend.color_test.domain import ColorTestResult, Color, Concept
from backend.color_test.dto import (
    ColorTestResultRequest,
    ColorTestInputsResponse,
)

router = APIRouter(prefix="/color-tests", tags=["color-tests"])


@router.post(
    "/",
    response_model=ColorTestResult,
    status_code=status.HTTP_201_CREATED,
)
async def create_color_test_result(payload: ColorTestResultRequest):
    user = await UserDocument.get(payload.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if user.color_test_results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Color test already completed for this user",
        )

    metrics = await MetricDocument.find_all().to_list()
    if not metrics:
        raise HTTPException(
            status_code=404, detail="No metrics configured in the database"
        )

    calculated_metrics = {}
    for metric in metrics:
        try:
            calculated_metrics[metric.metric_name] = metric.calculate_metric(
                payload.color_test_solution
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    color_test_result_doc = ColorTestResultDocument(
        user_id=user.id,
        color_test_solution=payload.color_test_solution,
        calculated_metrics=calculated_metrics,
    )
    await color_test_result_doc.insert()

    user.color_test_results.append(color_test_result_doc)
    await user.save()

    return color_test_result_doc


@router.get(
    "/inputs",
    response_model=ColorTestInputsResponse,
)
async def get_color_test_inputs():
    return ColorTestInputsResponse(
        colors=[color.value for color in Color.__members__.values()],
        concepts=[concept.value for concept in Concept.__members__.values()]
    )
