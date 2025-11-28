from .timestamps_model import TimestampsModel
from pydantic import Field, ConfigDict, field_validator
from typing import Any
from .concept import DEFAULT_CONCEPTS
from .color import Color
from .color_test_solution import ColorTestSolution
import numpy as np
import pandas as pd


def _resize_square(mat: Any, size: int) -> np.ndarray:
    """Best-effort resize to size x size, padding with zeros if needed."""
    arr = np.asarray(mat, dtype=float)
    out = np.zeros((size, size), dtype=float)
    rows = min(arr.shape[0], size)
    cols = min(arr.shape[1], size) if arr.ndim > 1 else 0
    if cols:
        out[:rows, :cols] = arr[:rows, :cols]
    return out


def _resize_rect(mat: Any, rows: int, cols: int) -> np.ndarray:
    """Best-effort resize to rows x cols, padding with zeros if needed."""
    arr = np.asarray(mat, dtype=float)
    out = np.zeros((rows, cols), dtype=float)
    r = min(arr.shape[0], rows)
    c = min(arr.shape[1], cols) if arr.ndim > 1 else 0
    if c:
        out[:r, :c] = arr[:r, :c]
    return out


class Metric(TimestampsModel):
    """
    - similarity_same_weights[i,j] добавляется,
    если (i,j) у тестируемого в ОДИНАКОВЫХ образцах (similarity=1)
    - similarity_diff_weights[i,j] добавляется,
    если (i,j) у тестируемого в РАЗНЫХ образцах (similarity=0)
    - attractiveness_rank_weights[i, r-1] добавляется для концепта i,
    если его выбранный образец имеет ранг r
      (столбцы хранятся по убыванию привлекательности: 1-й столбец — ранг 1, …)
    """
    model_config = ConfigDict(use_enum_values=True, populate_by_name=True)

    metric_name: str

    similarity_same_weights: list[list[float]] = Field(
        default_factory=lambda: [
            [0.0] * len(DEFAULT_CONCEPTS) for _ in range(len(DEFAULT_CONCEPTS))]
    )
    similarity_diff_weights: list[list[float]] = Field(
        default_factory=lambda: [
            [0.0] * len(DEFAULT_CONCEPTS) for _ in range(len(DEFAULT_CONCEPTS))]
    )

    # alias для обратной совместимости с твоим названием
    attractiveness_rank_weights: list[list[float]] = Field(
        default_factory=lambda: [
            [0.0] * len(Color) for _ in range(len(DEFAULT_CONCEPTS))],
        alias="attractiveness_rank_matrix"
    )

    @field_validator('similarity_same_weights', 'similarity_diff_weights',
                     'attractiveness_rank_weights', mode='before')
    @classmethod
    def _coerce(cls, v: Any):
        if isinstance(v, pd.DataFrame):
            arr = v.to_numpy(dtype=float)
        elif isinstance(v, np.ndarray):
            arr = v.astype(float, copy=False)
        elif isinstance(v, list):
            arr = np.asarray(v, dtype=float)
        else:
            raise TypeError(
                "Matrix must be list[list], numpy.ndarray or pandas.DataFrame")
        return arr.tolist()

    def calculate_metric(
        self,
        color_test_solution: ColorTestSolution,
        concepts: list[str] | None = None,
    ) -> float:
        concept_list = concepts or list(DEFAULT_CONCEPTS)
        n = len(concept_list)

        ranks_count = len(color_test_solution.concept_color_matrix)

        # Resize matrices to the current concept/count to avoid shape mismatch when concepts change
        S_same = _resize_square(self.similarity_same_weights, n)
        S_diff = _resize_square(self.similarity_diff_weights, n)
        A = _resize_rect(self.attractiveness_rank_weights, n, ranks_count)

        idx = {c: i for i, c in enumerate(concept_list)}

        ranks = np.full(n, -1, dtype=int)
        for col_idx, concepts_in_this_rank in enumerate(color_test_solution.concept_color_matrix):
            for c in concepts_in_this_rank:
                name = str(c)
                if name not in idx:
                    raise ValueError(f"Unknown concept in solution: {name}")
                i = idx[name]
                ranks[i] = col_idx + 1

        if (ranks < 1).any():
            raise ValueError("Some concepts have no assigned rank.")

        same_mask = (ranks[:, None] == ranks[None, :])
        W = np.where(same_mask, S_same, S_diff).astype(float, copy=False)
        np.fill_diagonal(W, 0.0)
        total_similarity = float(np.triu(W, k=1).sum())

        R = A.shape[1]
        rows = np.arange(n)
        total_attractiveness = float(A[rows, ranks - 1].sum())

        return total_similarity + total_attractiveness
