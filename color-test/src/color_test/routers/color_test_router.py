
from fastapi import APIRouter, HTTPException, status

from ..entities import ColorTestResultDocument, MetricDocument, UserDocument
from ..domain import ColorTestResult
from ..dto import ColorTestResultRequest
from ..dto import ColorTestInputsResponse
from ..domain import Color, Concept

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
