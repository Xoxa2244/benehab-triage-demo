from __future__ import annotations

import math
import re
import uuid
from datetime import datetime

from fastapi import HTTPException

from .models import Metric, OrderedColor, OrderedConcept, Project

HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def ensure_project(projects: list[Project], project_id: str) -> Project:
    project = next((p for p in projects if p.id == project_id), None)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def ensure_metric(metrics: list[Metric], project_id: str, metric_id: str) -> Metric:
    metric = next((m for m in metrics if m.id == metric_id and m.project_id == project_id), None)
    if metric is None:
        raise HTTPException(status_code=404, detail="Metric not found")
    return metric


def ensure_hex_color(value: str) -> str:
    if not HEX_COLOR_RE.match(value):
        raise HTTPException(status_code=400, detail=f"Invalid HEX color: {value}")
    return value.lower()


def normalize_concepts(concepts: list[OrderedConcept]) -> list[OrderedConcept]:
    cleaned: list[OrderedConcept] = []
    seen = set()
    for index, concept in enumerate(concepts):
        label = concept.label.strip()
        if not label:
            continue
        key = label.lower()
        if key in seen:
            continue
        seen.add(key)
        concept_id = concept.id.strip() if concept.id.strip() else make_id("concept")
        cleaned.append(
            OrderedConcept(
                id=concept_id,
                label=label,
                position=index,
                is_active=concept.is_active,
            )
        )
    return cleaned


def normalize_palette(palette: list[OrderedColor]) -> list[OrderedColor]:
    cleaned: list[OrderedColor] = []
    seen_label = set()
    seen_hex = set()
    for index, color in enumerate(palette):
        label = color.label.strip()
        if not label:
            continue
        hex_value = ensure_hex_color(color.hex.strip())
        if label.lower() in seen_label:
            continue
        if hex_value in seen_hex:
            continue
        seen_label.add(label.lower())
        seen_hex.add(hex_value)
        color_id = color.id.strip() if color.id.strip() else make_id("color")
        cleaned.append(
            OrderedColor(
                id=color_id,
                label=label,
                hex=hex_value,
                position=index,
                is_active=color.is_active,
            )
        )
    return cleaned


def _resize_square(matrix: list[list[float]], size: int) -> list[list[float]]:
    out = [[0.0 for _ in range(size)] for _ in range(size)]
    for i in range(min(size, len(matrix))):
        row = matrix[i] if i < len(matrix) else []
        for j in range(min(size, len(row))):
            out[i][j] = float(row[j])
    return out


def _resize_rect(matrix: list[list[float]], rows: int, cols: int) -> list[list[float]]:
    out = [[0.0 for _ in range(cols)] for _ in range(rows)]
    for i in range(min(rows, len(matrix))):
        row = matrix[i] if i < len(matrix) else []
        for j in range(min(cols, len(row))):
            out[i][j] = float(row[j])
    return out


def _quantize_cell(value: float) -> float:
    numeric = float(value)
    if numeric < 0.0 or numeric > 1.0:
        raise HTTPException(status_code=400, detail="Metric matrix values must be in [0.0, 1.0]")
    steps = numeric * 10
    if not math.isclose(steps, round(steps), abs_tol=1e-6):
        raise HTTPException(status_code=400, detail="Metric matrix values must use 0.1 step")
    return round(round(steps) / 10, 1)


def quantize_matrix(matrix: list[list[float]]) -> list[list[float]]:
    return [[_quantize_cell(cell) for cell in row] for row in matrix]


def normalize_metric_shapes(metric: Metric, concept_count: int, color_count: int) -> Metric:
    same = quantize_matrix(_resize_square(metric.similarity_same_weights, concept_count))
    diff = quantize_matrix(_resize_square(metric.similarity_diff_weights, concept_count))
    rank = quantize_matrix(_resize_rect(metric.attractiveness_rank_weights, concept_count, color_count))

    metric.similarity_same_weights = same
    metric.similarity_diff_weights = diff
    metric.attractiveness_rank_weights = rank
    return metric


def normalize_all_project_metrics(
    metrics: list[Metric], project_id: str, concept_count: int, color_count: int
) -> None:
    for metric in metrics:
        if metric.project_id != project_id:
            continue
        normalize_metric_shapes(metric, concept_count, color_count)


def active_concepts(project: Project) -> list[OrderedConcept]:
    return sorted([c for c in project.concepts if c.is_active], key=lambda c: c.position)


def active_palette(project: Project) -> list[OrderedColor]:
    return sorted([c for c in project.palette if c.is_active], key=lambda c: c.position)


def utc_now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def calculate_metric_value(
    metric: Metric,
    concept_ids_in_order: list[str],
    concept_to_color: dict[str, str],
    color_rank_order: list[str],
) -> float:
    n = len(concept_ids_in_order)
    color_count = len(color_rank_order)

    same = _resize_square(metric.similarity_same_weights, n)
    diff = _resize_square(metric.similarity_diff_weights, n)
    rank_weights = _resize_rect(metric.attractiveness_rank_weights, n, color_count)

    color_rank_index = {color_id: idx for idx, color_id in enumerate(color_rank_order)}

    total_similarity = 0.0
    for i in range(n):
        ci = concept_ids_in_order[i]
        ci_color = concept_to_color[ci]
        for j in range(i + 1, n):
            cj = concept_ids_in_order[j]
            cj_color = concept_to_color[cj]
            total_similarity += same[i][j] if ci_color == cj_color else diff[i][j]

    total_attr = 0.0
    for i, concept_id in enumerate(concept_ids_in_order):
        color_id = concept_to_color[concept_id]
        rank_idx = color_rank_index[color_id]
        total_attr += rank_weights[i][rank_idx]

    return round(total_similarity + total_attr, 4)


def default_concepts() -> list[OrderedConcept]:
    labels = [
        "Health",
        "Family",
        "Work",
        "Rest",
        "Future",
        "Treatment",
    ]
    return [
        OrderedConcept(id=make_id("concept"), label=label, position=index, is_active=True)
        for index, label in enumerate(labels)
    ]


def default_palette() -> list[OrderedColor]:
    raw = [
        ("Red", "#ef4444"),
        ("Blue", "#3b82f6"),
        ("Green", "#22c55e"),
        ("Yellow", "#eab308"),
        ("Purple", "#a855f7"),
        ("Orange", "#f97316"),
    ]
    return [
        OrderedColor(
            id=make_id("color"),
            label=label,
            hex=hex_code,
            position=index,
            is_active=True,
        )
        for index, (label, hex_code) in enumerate(raw)
    ]


def default_metric(project_id: str, concept_count: int, color_count: int) -> Metric:
    return Metric(
        id=make_id("metric"),
        project_id=project_id,
        name="base_metric",
        position=0,
        similarity_same_weights=[[0.0 for _ in range(concept_count)] for _ in range(concept_count)],
        similarity_diff_weights=[[0.0 for _ in range(concept_count)] for _ in range(concept_count)],
        attractiveness_rank_weights=[[0.0 for _ in range(color_count)] for _ in range(concept_count)],
    )
