from __future__ import annotations

import csv
from io import StringIO
from datetime import datetime, timezone
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    ConceptsUpdateRequest,
    DataStoreSnapshot,
    Metric,
    MetricCreateRequest,
    MetricUpdateRequest,
    MetricsOrderUpdateRequest,
    OrderedColor,
    OrderedConcept,
    PaletteUpdateRequest,
    Project,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    SurveyRun,
    SurveyRunCreateRequest,
    SyntheticUser,
    SyntheticUserCreateRequest,
    UserResultsRow,
)
from .services import (
    active_concepts,
    active_palette,
    calculate_metric_value,
    default_concepts,
    default_metric,
    default_palette,
    ensure_metric,
    ensure_project,
    make_id,
    normalize_all_project_metrics,
    normalize_concepts,
    normalize_metric_shapes,
    normalize_palette,
    utc_now_iso,
)
from .store import JsonStore


BASE_DIR = Path(__file__).resolve().parents[1]
STORAGE_PATH = Path(
    os.environ.get("LITE_COLOR_TEST_STORAGE_PATH", str(BASE_DIR / "data" / "storage.json"))
).resolve()
store = JsonStore(STORAGE_PATH)


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    raw = value.strip()
    if not raw:
        return None
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid datetime: {value}") from exc


def _ordered_project_metrics(project: Project, metrics: list[Metric]) -> list[Metric]:
    project_metrics = [m for m in metrics if m.project_id == project.id]
    by_id = {metric.id: metric for metric in project_metrics}
    ordered: list[Metric] = []

    for metric_id in project.metric_ids:
        metric = by_id.get(metric_id)
        if metric is not None:
            ordered.append(metric)

    extras = [metric for metric in project_metrics if metric.id not in project.metric_ids]
    extras.sort(key=lambda item: item.position)
    ordered.extend(extras)

    for index, metric in enumerate(ordered):
        metric.position = index

    return ordered


def _seed_if_empty(snapshot: DataStoreSnapshot) -> DataStoreSnapshot:
    if snapshot.projects:
        return snapshot

    project_id = make_id("project")
    concepts = default_concepts()
    palette = default_palette()
    project = Project(
        id=project_id,
        name="Default Lite Project",
        description="Seed project for color-test lite",
        status="active",
        concepts=concepts,
        palette=palette,
    )
    metric = default_metric(project_id, concept_count=len(concepts), color_count=len(palette))
    project.metric_ids = [metric.id]

    snapshot.projects.append(project)
    snapshot.metrics.append(metric)
    store.save(snapshot)
    return snapshot


def _load() -> DataStoreSnapshot:
    return _seed_if_empty(store.load())


def _build_user_results_rows(snapshot: DataStoreSnapshot) -> list[UserResultsRow]:
    grouped: dict[tuple[str, str], list[SurveyRun]] = {}

    for run in snapshot.survey_runs:
        key = (run.user_id, run.project_id)
        grouped.setdefault(key, []).append(run)

    rows: list[UserResultsRow] = []
    for (user_id, project_id), runs in grouped.items():
        runs_sorted = sorted(runs, key=lambda item: item.completed_at, reverse=True)
        latest = runs_sorted[0]
        rows.append(
            UserResultsRow(
                user_id=user_id,
                user_name=latest.user_name_snapshot,
                project_id=project_id,
                project_name=latest.project_name_snapshot,
                runs_count=len(runs_sorted),
                last_completed_at=latest.completed_at,
                latest_metrics=latest.calculated_metrics,
            )
        )

    return sorted(rows, key=lambda item: item.last_completed_at, reverse=True)


def _build_user_results_csv(snapshot: DataStoreSnapshot) -> str:
    rows = _build_user_results_rows(snapshot)
    metric_names = sorted({name for row in rows for name in row.latest_metrics.keys()})

    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "user_id",
            "user_name",
            "project_id",
            "project_name",
            "runs_count",
            "last_completed_at",
            *[f"metric_{name}" for name in metric_names],
        ]
    )

    for row in rows:
        writer.writerow(
            [
                row.user_id,
                row.user_name,
                row.project_id,
                row.project_name,
                row.runs_count,
                row.last_completed_at,
                *[row.latest_metrics.get(name, "") for name in metric_names],
            ]
        )

    return buffer.getvalue()


app = FastAPI(title="Lite Color Test API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/projects", response_model=list[Project])
def list_projects() -> list[Project]:
    snapshot = _load()
    return sorted(snapshot.projects, key=lambda p: p.updated_at, reverse=True)


@app.post("/api/projects", response_model=Project)
def create_project(payload: ProjectCreateRequest) -> Project:
    snapshot = _load()
    project_id = make_id("project")
    concepts = default_concepts()
    palette = default_palette()
    project = Project(
        id=project_id,
        name=payload.name.strip() or "Untitled Project",
        description=payload.description.strip(),
        status=payload.status,
        concepts=concepts,
        palette=palette,
    )
    metric = default_metric(project_id, concept_count=len(concepts), color_count=len(palette))
    project.metric_ids = [metric.id]

    snapshot.projects.append(project)
    snapshot.metrics.append(metric)
    store.save(snapshot)
    return project


@app.post("/api/projects/{project_id}/duplicate", response_model=Project)
def duplicate_project(project_id: str) -> Project:
    snapshot = _load()
    source = ensure_project(snapshot.projects, project_id)

    new_project_id = make_id("project")

    copied_concepts = [
        OrderedConcept(
            id=make_id("concept"),
            label=item.label,
            position=index,
            is_active=item.is_active,
        )
        for index, item in enumerate(sorted(source.concepts, key=lambda concept: concept.position))
    ]
    copied_palette = [
        OrderedColor(
            id=make_id("color"),
            label=item.label,
            hex=item.hex,
            position=index,
            is_active=item.is_active,
        )
        for index, item in enumerate(sorted(source.palette, key=lambda color: color.position))
    ]

    duplicated = Project(
        id=new_project_id,
        name=f"{source.name} (copy)",
        description=source.description,
        status="draft",
        concepts=copied_concepts,
        palette=copied_palette,
    )

    source_metrics = _ordered_project_metrics(source, snapshot.metrics)
    concept_count = len(copied_concepts)
    color_count = len(copied_palette)
    new_metrics: list[Metric] = []
    for index, source_metric in enumerate(source_metrics):
        copied_metric = Metric(
            id=make_id("metric"),
            project_id=new_project_id,
            name=source_metric.name,
            position=index,
            is_active=source_metric.is_active,
            similarity_same_weights=source_metric.similarity_same_weights,
            similarity_diff_weights=source_metric.similarity_diff_weights,
            attractiveness_rank_weights=source_metric.attractiveness_rank_weights,
        )
        normalize_metric_shapes(copied_metric, concept_count=concept_count, color_count=color_count)
        new_metrics.append(copied_metric)

    if not new_metrics:
        new_metrics = [default_metric(new_project_id, concept_count=concept_count, color_count=color_count)]

    duplicated.metric_ids = [metric.id for metric in new_metrics]
    snapshot.projects.append(duplicated)
    snapshot.metrics.extend(new_metrics)
    store.save(snapshot)
    return duplicated


@app.get("/api/projects/{project_id}", response_model=Project)
def get_project(project_id: str) -> Project:
    snapshot = _load()
    return ensure_project(snapshot.projects, project_id)


@app.put("/api/projects/{project_id}", response_model=Project)
def update_project(project_id: str, payload: ProjectUpdateRequest) -> Project:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    project.name = payload.name.strip() or project.name
    project.description = payload.description.strip()
    project.status = payload.status
    project.updated_at = utc_now_iso()
    store.save(snapshot)
    return project


@app.delete("/api/projects/{project_id}", status_code=204)
def delete_project(project_id: str) -> Response:
    snapshot = _load()
    ensure_project(snapshot.projects, project_id)

    snapshot.projects = [project for project in snapshot.projects if project.id != project_id]
    snapshot.metrics = [metric for metric in snapshot.metrics if metric.project_id != project_id]
    snapshot.survey_runs = [run for run in snapshot.survey_runs if run.project_id != project_id]

    store.save(snapshot)
    return Response(status_code=204)


@app.get("/api/projects/{project_id}/concepts", response_model=list[OrderedConcept])
def get_project_concepts(project_id: str) -> list[OrderedConcept]:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    return sorted(project.concepts, key=lambda item: item.position)


@app.put("/api/projects/{project_id}/concepts", response_model=list[OrderedConcept])
def update_project_concepts(project_id: str, payload: ConceptsUpdateRequest) -> list[OrderedConcept]:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)

    ordered_input = sorted(payload.concepts, key=lambda item: item.position)
    normalized = normalize_concepts(ordered_input)
    if not normalized:
        raise HTTPException(status_code=400, detail="Concepts list cannot be empty")
    if not any(item.is_active for item in normalized):
        raise HTTPException(status_code=400, detail="At least one active concept is required")

    project.concepts = normalized
    project.updated_at = utc_now_iso()
    normalize_all_project_metrics(
        snapshot.metrics,
        project_id=project.id,
        concept_count=len(project.concepts),
        color_count=len(project.palette),
    )
    store.save(snapshot)
    return sorted(project.concepts, key=lambda item: item.position)


@app.get("/api/projects/{project_id}/palette", response_model=list[OrderedColor])
def get_project_palette(project_id: str) -> list[OrderedColor]:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    return sorted(project.palette, key=lambda item: item.position)


@app.put("/api/projects/{project_id}/palette", response_model=list[OrderedColor])
def update_project_palette(project_id: str, payload: PaletteUpdateRequest) -> list[OrderedColor]:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)

    ordered_input = sorted(payload.palette, key=lambda item: item.position)
    normalized = normalize_palette(ordered_input)
    if len(normalized) < 2:
        raise HTTPException(status_code=400, detail="Palette must include at least 2 colors")
    if not any(item.is_active for item in normalized):
        raise HTTPException(status_code=400, detail="At least one active color is required")

    project.palette = normalized
    project.updated_at = utc_now_iso()
    normalize_all_project_metrics(
        snapshot.metrics,
        project_id=project.id,
        concept_count=len(project.concepts),
        color_count=len(project.palette),
    )
    store.save(snapshot)
    return sorted(project.palette, key=lambda item: item.position)


@app.get("/api/projects/{project_id}/metrics-order", response_model=MetricsOrderUpdateRequest)
def get_metrics_order(project_id: str) -> MetricsOrderUpdateRequest:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    ordered = _ordered_project_metrics(project, snapshot.metrics)
    project.metric_ids = [metric.id for metric in ordered]
    store.save(snapshot)
    return MetricsOrderUpdateRequest(metric_ids=project.metric_ids)


@app.put("/api/projects/{project_id}/metrics-order", response_model=MetricsOrderUpdateRequest)
def update_metrics_order(project_id: str, payload: MetricsOrderUpdateRequest) -> MetricsOrderUpdateRequest:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    ordered = _ordered_project_metrics(project, snapshot.metrics)
    existing_ids = [metric.id for metric in ordered]

    if sorted(existing_ids) != sorted(payload.metric_ids):
        raise HTTPException(status_code=400, detail="metric_ids must contain all project metric ids")

    project.metric_ids = payload.metric_ids
    by_id = {metric.id: metric for metric in ordered}
    for index, metric_id in enumerate(project.metric_ids):
        by_id[metric_id].position = index
        by_id[metric_id].updated_at = utc_now_iso()

    project.updated_at = utc_now_iso()
    store.save(snapshot)
    return MetricsOrderUpdateRequest(metric_ids=project.metric_ids)


@app.get("/api/projects/{project_id}/metrics", response_model=list[Metric])
def list_project_metrics(project_id: str) -> list[Metric]:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    ordered = _ordered_project_metrics(project, snapshot.metrics)

    concept_count = len(project.concepts)
    color_count = len(project.palette)
    for metric in ordered:
        normalize_metric_shapes(metric, concept_count=concept_count, color_count=color_count)

    store.save(snapshot)
    return ordered


@app.post("/api/projects/{project_id}/metrics", response_model=Metric)
def create_project_metric(project_id: str, payload: MetricCreateRequest) -> Metric:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    ordered = _ordered_project_metrics(project, snapshot.metrics)

    metric = Metric(
        id=make_id("metric"),
        project_id=project.id,
        name=payload.name.strip() or f"metric_{len(ordered) + 1}",
        position=len(ordered),
        similarity_same_weights=[[0.0 for _ in range(len(project.concepts))] for _ in range(len(project.concepts))],
        similarity_diff_weights=[[0.0 for _ in range(len(project.concepts))] for _ in range(len(project.concepts))],
        attractiveness_rank_weights=[[0.0 for _ in range(len(project.palette))] for _ in range(len(project.concepts))],
    )
    snapshot.metrics.append(metric)
    project.metric_ids.append(metric.id)
    project.updated_at = utc_now_iso()
    store.save(snapshot)
    return metric


@app.put("/api/projects/{project_id}/metrics/{metric_id}", response_model=Metric)
def update_project_metric(project_id: str, metric_id: str, payload: MetricUpdateRequest) -> Metric:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    metric = ensure_metric(snapshot.metrics, project_id=project.id, metric_id=metric_id)

    metric.name = payload.name.strip() or metric.name
    metric.is_active = payload.is_active
    metric.similarity_same_weights = payload.similarity_same_weights
    metric.similarity_diff_weights = payload.similarity_diff_weights
    metric.attractiveness_rank_weights = payload.attractiveness_rank_weights
    normalize_metric_shapes(metric, concept_count=len(project.concepts), color_count=len(project.palette))
    metric.updated_at = utc_now_iso()

    project.updated_at = utc_now_iso()
    store.save(snapshot)
    return metric


@app.delete("/api/projects/{project_id}/metrics/{metric_id}", status_code=204)
def delete_project_metric(project_id: str, metric_id: str) -> Response:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)
    ensure_metric(snapshot.metrics, project_id=project.id, metric_id=metric_id)

    snapshot.metrics = [metric for metric in snapshot.metrics if metric.id != metric_id]
    project.metric_ids = [mid for mid in project.metric_ids if mid != metric_id]
    project.updated_at = utc_now_iso()
    store.save(snapshot)
    return Response(status_code=204)


@app.get("/api/synthetic-users", response_model=list[SyntheticUser])
def list_synthetic_users() -> list[SyntheticUser]:
    snapshot = _load()
    return sorted(snapshot.synthetic_users, key=lambda item: item.updated_at, reverse=True)


@app.post("/api/synthetic-users", response_model=SyntheticUser)
def create_synthetic_user(payload: SyntheticUserCreateRequest) -> SyntheticUser:
    snapshot = _load()
    display_name = payload.display_name.strip()
    if not display_name:
        raise HTTPException(status_code=400, detail="display_name is required")

    existing = next(
        (u for u in snapshot.synthetic_users if u.display_name.lower() == display_name.lower()),
        None,
    )
    if existing is not None:
        return existing

    user = SyntheticUser(
        id=make_id("syn"),
        display_name=display_name,
        note=payload.note.strip(),
    )
    snapshot.synthetic_users.append(user)
    store.save(snapshot)
    return user


@app.delete("/api/synthetic-users/{user_id}", status_code=204)
def delete_synthetic_user(user_id: str) -> Response:
    snapshot = _load()
    user = next((u for u in snapshot.synthetic_users if u.id == user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="Synthetic user not found")

    has_runs = any(run.user_id == user_id for run in snapshot.survey_runs)
    if has_runs:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete synthetic user with existing survey runs",
        )

    snapshot.synthetic_users = [u for u in snapshot.synthetic_users if u.id != user_id]
    store.save(snapshot)
    return Response(status_code=204)


@app.post("/api/projects/{project_id}/survey-runs", response_model=SurveyRun)
def create_survey_run(project_id: str, payload: SurveyRunCreateRequest) -> SurveyRun:
    snapshot = _load()
    project = ensure_project(snapshot.projects, project_id)

    concepts = active_concepts(project)
    palette = active_palette(project)

    if not concepts:
        raise HTTPException(status_code=400, detail="Project has no active concepts")
    if len(palette) < 2:
        raise HTTPException(status_code=400, detail="Project must have at least 2 active colors")

    allowed_concept_ids = {concept.id for concept in concepts}
    allowed_color_ids = {color.id for color in palette}

    incoming_concepts = set(payload.concept_color_choices.keys())
    if incoming_concepts != allowed_concept_ids:
        missing = sorted(allowed_concept_ids - incoming_concepts)
        extra = sorted(incoming_concepts - allowed_concept_ids)
        detail = {"missing_concepts": missing, "extra_concepts": extra}
        raise HTTPException(status_code=400, detail=detail)

    for concept_id, color_id in payload.concept_color_choices.items():
        if color_id not in allowed_color_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Concept {concept_id} references unknown color {color_id}",
            )

    rank_order = payload.color_rank_order
    if set(rank_order) != allowed_color_ids or len(rank_order) != len(allowed_color_ids):
        raise HTTPException(
            status_code=400,
            detail="color_rank_order must contain all active project colors exactly once",
        )

    user_id = payload.user_id
    user_name = payload.user_name_snapshot.strip() if payload.user_name_snapshot else ""

    if user_id:
        user = next((u for u in snapshot.synthetic_users if u.id == user_id), None)
        if user is None:
            raise HTTPException(status_code=404, detail="Synthetic user not found")
        user_name = user.display_name
    else:
        if not user_name:
            user_name = f"Synthetic {len(snapshot.synthetic_users) + 1}"
        new_user = SyntheticUser(id=make_id("syn"), display_name=user_name)
        snapshot.synthetic_users.append(new_user)
        user_id = new_user.id

    ordered_metrics = [m for m in _ordered_project_metrics(project, snapshot.metrics) if m.is_active]

    concept_ids = [concept.id for concept in concepts]
    calculated: dict[str, float] = {}
    for metric in ordered_metrics:
        value = calculate_metric_value(
            metric=metric,
            concept_ids_in_order=concept_ids,
            concept_to_color=payload.concept_color_choices,
            color_rank_order=rank_order,
        )
        calculated[metric.name] = value

    now = utc_now_iso()
    run = SurveyRun(
        id=make_id("run"),
        project_id=project.id,
        project_name_snapshot=project.name,
        user_id=user_id,
        user_name_snapshot=user_name,
        started_at=now,
        completed_at=now,
        concept_color_choices=payload.concept_color_choices,
        color_rank_order=rank_order,
        calculated_metrics=calculated,
    )

    snapshot.survey_runs.append(run)
    store.save(snapshot)
    return run


@app.get("/api/survey-runs", response_model=list[SurveyRun])
def list_survey_runs(
    project_id: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
) -> list[SurveyRun]:
    snapshot = _load()
    runs = snapshot.survey_runs

    if project_id:
        runs = [run for run in runs if run.project_id == project_id]
    if user_id:
        runs = [run for run in runs if run.user_id == user_id]

    dt_from = _parse_dt(date_from)
    dt_to = _parse_dt(date_to)

    if dt_from or dt_to:
        filtered: list[SurveyRun] = []
        for run in runs:
            completed = _parse_dt(run.completed_at)
            if completed is None:
                continue
            if dt_from and completed < dt_from:
                continue
            if dt_to and completed > dt_to:
                continue
            filtered.append(run)
        runs = filtered

    return sorted(runs, key=lambda item: item.completed_at, reverse=True)


@app.get("/api/results/users", response_model=list[UserResultsRow])
def user_results() -> list[UserResultsRow]:
    snapshot = _load()
    return _build_user_results_rows(snapshot)


@app.get("/api/results/users.csv")
def user_results_csv() -> Response:
    snapshot = _load()
    csv_content = _build_user_results_csv(snapshot)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="user-results.csv"'},
    )
