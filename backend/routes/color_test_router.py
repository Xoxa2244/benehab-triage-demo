from fastapi import APIRouter, HTTPException, status

from backend.color_test.entities import (
    ColorTestResultDocument,
    MetricDocument,
    UserDocument,
)
from pydantic import BaseModel, Field

from backend.color_test.domain import ColorTestResult, Color
from backend.color_test.dto import ColorTestResultRequest, ColorTestInputsResponse
from backend.color_test.services.concepts import (
    get_concepts,
    set_concepts,
    validate_concept_matrix,
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

    concepts = await get_concepts()

    metrics = await MetricDocument.find_all().to_list()
    if not metrics:
        raise HTTPException(
            status_code=404, detail="No metrics configured in the database"
        )

    validate_concept_matrix(
        payload.color_test_solution.concept_color_matrix, concepts
    )

    calculated_metrics = {}
    for metric in metrics:
        try:
            calculated_metrics[metric.metric_name] = metric.calculate_metric(
                payload.color_test_solution,
                concepts=concepts,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    color_test_result_doc = ColorTestResultDocument(
        user_id=user.id,
        color_test_solution=payload.color_test_solution,
        calculated_metrics=calculated_metrics,
    )
    await color_test_result_doc.insert()

    # Persist values profile on user for downstream consumers (staff console, tags)
    user.values_profile = {
        "calculated_metrics": calculated_metrics,
        "concept_color_matrix": payload.color_test_solution.concept_color_matrix,
    }
    user.color_test_results.append(color_test_result_doc)
    await user.save()

    return color_test_result_doc


@router.get(
    "/inputs",
    response_model=ColorTestInputsResponse,
)
async def get_color_test_inputs():
    concepts = await get_concepts()
    return ColorTestInputsResponse(
        colors=[color.value for color in Color.__members__.values()],
        concepts=concepts,
    )


class ConceptListPayload(BaseModel):
    concepts: list[str] = Field(default_factory=list)


@router.get(
    "/concepts",
    response_model=ConceptListPayload,
)
async def get_concepts_list():
    return ConceptListPayload(concepts=await get_concepts())


@router.put(
    "/concepts",
    response_model=ConceptListPayload,
)
async def update_concepts(payload: ConceptListPayload):
    concepts = await set_concepts(payload.concepts)
    return ConceptListPayload(concepts=concepts)
