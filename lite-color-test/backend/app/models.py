from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


ProjectStatus = Literal["draft", "active", "archived"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class OrderedConcept(BaseModel):
    id: str
    label: str
    position: int
    is_active: bool = True


class OrderedColor(BaseModel):
    id: str
    label: str
    hex: str
    position: int
    is_active: bool = True


class Project(BaseModel):
    id: str
    name: str
    description: str = ""
    status: ProjectStatus = "draft"
    concepts: list[OrderedConcept] = Field(default_factory=list)
    palette: list[OrderedColor] = Field(default_factory=list)
    metric_ids: list[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class Metric(BaseModel):
    id: str
    project_id: str
    name: str
    position: int
    is_active: bool = True
    similarity_same_weights: list[list[float]] = Field(default_factory=list)
    similarity_diff_weights: list[list[float]] = Field(default_factory=list)
    attractiveness_rank_weights: list[list[float]] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class SyntheticUser(BaseModel):
    id: str
    display_name: str
    kind: Literal["synthetic"] = "synthetic"
    note: str = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class SurveyRun(BaseModel):
    id: str
    project_id: str
    project_name_snapshot: str
    user_id: str
    user_name_snapshot: str
    started_at: str
    completed_at: str
    concept_color_choices: dict[str, str]
    color_rank_order: list[str]
    calculated_metrics: dict[str, float]


class DataStoreSnapshot(BaseModel):
    projects: list[Project] = Field(default_factory=list)
    metrics: list[Metric] = Field(default_factory=list)
    synthetic_users: list[SyntheticUser] = Field(default_factory=list)
    survey_runs: list[SurveyRun] = Field(default_factory=list)


class ProjectCreateRequest(BaseModel):
    name: str
    description: str = ""
    status: ProjectStatus = "draft"


class ProjectUpdateRequest(BaseModel):
    name: str
    description: str = ""
    status: ProjectStatus


class ConceptsUpdateRequest(BaseModel):
    concepts: list[OrderedConcept]


class PaletteUpdateRequest(BaseModel):
    palette: list[OrderedColor]


class MetricCreateRequest(BaseModel):
    name: str


class MetricUpdateRequest(BaseModel):
    name: str
    is_active: bool
    similarity_same_weights: list[list[float]]
    similarity_diff_weights: list[list[float]]
    attractiveness_rank_weights: list[list[float]]


class MetricsOrderUpdateRequest(BaseModel):
    metric_ids: list[str]


class SyntheticUserCreateRequest(BaseModel):
    display_name: str
    note: str = ""


class SurveyRunCreateRequest(BaseModel):
    user_id: str | None = None
    user_name_snapshot: str | None = None
    concept_color_choices: dict[str, str]
    color_rank_order: list[str]


class UserResultsRow(BaseModel):
    user_id: str
    user_name: str
    project_id: str
    project_name: str
    runs_count: int
    last_completed_at: str
    latest_metrics: dict[str, float]
