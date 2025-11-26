from beanie import Document
from ..domain import Metric
from pydantic import Field


class MetricDocument(Document, Metric):
    id: str = Field(alias="_id")
    metric_name: str = Field(unique=True)

    class Settings:
        name = "metrics"
