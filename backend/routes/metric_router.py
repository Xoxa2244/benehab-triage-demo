from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any, List

from backend.color_test.entities import MetricDocument
from backend.color_test.domain import Metric

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


class MetricPayload(BaseModel):
    metric_name: str
    similarity_same_weights: List[List[float]] | None = None
    similarity_diff_weights: List[List[float]] | None = None
    attractiveness_rank_weights: List[List[float]] | None = None


@router.get("/", response_model=List[Metric])
async def list_metrics():
    return await MetricDocument.find_all().to_list()


@router.post("/", response_model=Metric, status_code=status.HTTP_201_CREATED)
async def create_metric(payload: MetricPayload):
    existing = await MetricDocument.find_one(MetricDocument.metric_name == payload.metric_name)
    if existing:
        raise HTTPException(status_code=400, detail="Metric with this name already exists")

    metric = MetricDocument(
        metric_name=payload.metric_name,
        similarity_same_weights=payload.similarity_same_weights,
        similarity_diff_weights=payload.similarity_diff_weights,
        attractiveness_rank_weights=payload.attractiveness_rank_weights,
    )
    await metric.insert()
    return metric


@router.put("/{metric_name}", response_model=Metric)
async def update_metric(metric_name: str, payload: MetricPayload):
    metric = await MetricDocument.find_one(MetricDocument.metric_name == metric_name)
    if metric is None:
        raise HTTPException(status_code=404, detail="Metric not found")

    metric.metric_name = payload.metric_name
    if payload.similarity_same_weights is not None:
        metric.similarity_same_weights = payload.similarity_same_weights
    if payload.similarity_diff_weights is not None:
        metric.similarity_diff_weights = payload.similarity_diff_weights
    if payload.attractiveness_rank_weights is not None:
        metric.attractiveness_rank_weights = payload.attractiveness_rank_weights

    await metric.save()
    return metric


@router.delete("/{metric_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_metric(metric_name: str):
    metric = await MetricDocument.find_one(MetricDocument.metric_name == metric_name)
    if metric is None:
        raise HTTPException(status_code=404, detail="Metric not found")

    await metric.delete()
    return None
