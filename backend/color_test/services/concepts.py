from typing import Iterable

from fastapi import HTTPException, status

from backend.color_test.domain.concept import DEFAULT_CONCEPTS
from backend.color_test.entities.concept_document import ConceptDocument


def _sanitize(concepts: Iterable[str]) -> list[str]:
    cleaned = []
    seen = set()
    for raw in concepts:
        if not raw:
            continue
        normalized = raw.strip()
        if not normalized:
            continue
        if normalized.lower() in seen:
            # Keep first occurrence, skip duplicates (case-insensitive)
            continue
        seen.add(normalized.lower())
        cleaned.append(normalized)
    return cleaned


async def get_concepts() -> list[str]:
    doc = await ConceptDocument.get("color_test_concepts")
    if doc and doc.concepts:
        return doc.concepts

    # Seed with defaults on first access
    defaults = list(DEFAULT_CONCEPTS)
    if doc:
        doc.concepts = defaults
        await doc.save()
    else:
        doc = ConceptDocument(concepts=defaults)
        await doc.insert()
    return defaults


async def set_concepts(concepts: Iterable[str]) -> list[str]:
    sanitized = _sanitize(concepts)
    if not sanitized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список понятий пуст. Добавьте хотя бы одно значение.",
        )

    doc = await ConceptDocument.get("color_test_concepts")
    if not doc:
        doc = ConceptDocument(concepts=sanitized)
        await doc.insert()
    else:
        doc.concepts = sanitized
        await doc.save()
    return doc.concepts


def validate_concept_matrix(matrix: list[list[str]], allowed_concepts: list[str]) -> None:
    """
    Ensure every allowed concept appears exactly once across the matrix,
    and no unknown concepts are present.
    """
    flat = [c.strip() for column in matrix for c in column]
    normalized = [c for c in flat if c]

    allowed_set = {c.lower(): c for c in allowed_concepts}
    seen = set()
    extra = []
    for concept in normalized:
        key = concept.lower()
        if key not in allowed_set:
            extra.append(concept)
            continue
        if key in seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Понятие "{concept}" указано более одного раза.',
            )
        seen.add(key)

    missing = [c for c in allowed_concepts if c.lower() not in seen]
    if missing or extra:
        message = "Список понятий в решении не совпадает с актуальным набором."
        if missing:
            message += f" Отсутствуют: {', '.join(missing)}."
        if extra:
            message += f" Неизвестные: {', '.join(extra)}."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
