from beanie import Document
from ..domain import Metric
from pydantic import Field
import uuid


class MetricDocument(Document, Metric):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    metric_name: str = Field(unique=True)

    class Settings:
        name = "metrics"
