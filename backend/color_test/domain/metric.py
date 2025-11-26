from .timestamps_model import TimestampsModel
from pydantic import Field, ConfigDict, field_validator
from typing import Any
from .concept import Concept
from .color import Color
from .color_test_solution import ColorTestSolution
import numpy as np
import pandas as pd


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
            [0.0] * len(Concept) for _ in range(len(Concept))]
    )
    similarity_diff_weights: list[list[float]] = Field(
        default_factory=lambda: [
            [0.0] * len(Concept) for _ in range(len(Concept))]
    )

    # alias для обратной совместимости с твоим названием
    attractiveness_rank_weights: list[list[float]] = Field(
        default_factory=lambda: [
            [0.0] * len(Color) for _ in range(len(Concept))],
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
        color_test_solution: ColorTestSolution
    ) -> float:
        n = len(Concept)

        S_same = np.asarray(self.similarity_same_weights,
                            dtype=float).reshape((n, n))
        S_diff = np.asarray(self.similarity_diff_weights,
                            dtype=float).reshape((n, n))
        A = np.asarray(self.attractiveness_rank_weights, dtype=float)

        idx = {c: i for i, c in enumerate(Concept)}

        ranks = np.full(n, -1, dtype=int)
        for col_idx, concepts_in_this_rank in enumerate(color_test_solution.concept_color_matrix):
            for c in concepts_in_this_rank:
                i = idx[c if isinstance(c, Concept) else Concept(c)]
                ranks[i] = col_idx + 1

        if (ranks < 1).any():
            raise ValueError("Some concepts have no assigned rank.")

        same_mask = (ranks[:, None] == ranks[None, :])
        W = np.where(same_mask, S_same, S_diff).astype(float, copy=False)
        np.fill_diagonal(W, 0.0)
        total_similarity = float(np.triu(W, k=1).sum())

        R = A.shape[1]
        if R != len(color_test_solution.concept_color_matrix):
            raise ValueError(
                f"attractiveness_rank_weights has {R} columns, "
                f"but solution defines {len(color_test_solution.concept_color_matrix)} ranks."
            )
        rows = np.arange(n)
        total_attractiveness = float(A[rows, ranks - 1].sum())

        return total_similarity + total_attractiveness
