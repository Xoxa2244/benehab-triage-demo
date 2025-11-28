from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Any
from backend.color_test.domain import Demographics
import uuid

from backend.color_test.entities import UserDocument


router = APIRouter(prefix="/api/users", tags=["users"])


class CreateUserRequest(BaseModel):
    name: str
    email: str | None = None
    password: str | None = None
    chat_id: str | None = None
    demographics: dict[str, Any] | None = Field(
        default=None, description="Анкетные данные пользователя"
    )


class UserResponse(BaseModel):
    id: str
    name: str
    email: str | None
    chat_id: str | None
    demographics: Demographics | None
    attitude_profile: dict[str, Any] | None = None
    typology_profile: dict[str, Any] | None = None
    values_profile: dict[str, Any] | None = None


class UpdateProfilesRequest(BaseModel):
    attitude_profile: dict[str, Any] | None = None
    typology_profile: dict[str, Any] | None = None
    values_profile: dict[str, Any] | None = None
    demographics: dict[str, Any] | None = None
    color_test_solution: dict[str, Any] | None = None


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUserRequest):
    # Если передан chat_id, пробуем обновить существующего пользователя
    user_doc = None
    if payload.chat_id:
        user_doc = await UserDocument.find_one(UserDocument.chat_id == payload.chat_id)

    if user_doc is None:
        user_doc = UserDocument(
            id=str(uuid.uuid4()),
            name=payload.name,
            email=payload.email,
            password=payload.password,
            chat_id=payload.chat_id,
            demographics=payload.demographics,
        )
    else:
        user_doc.name = payload.name or user_doc.name
        user_doc.email = payload.email or user_doc.email
        user_doc.password = payload.password or user_doc.password
        user_doc.demographics = payload.demographics or user_doc.demographics

    await user_doc.save()

    return UserResponse(
        id=user_doc.id,
        name=user_doc.name,
        email=user_doc.email,
        chat_id=user_doc.chat_id,
        demographics=user_doc.demographics,
        attitude_profile=user_doc.attitude_profile,
        typology_profile=user_doc.typology_profile,
        values_profile=user_doc.values_profile,
    )


@router.patch(
    "/{user_id}/profiles",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def update_profiles(user_id: str, payload: UpdateProfilesRequest):
    user_doc = await UserDocument.get(user_id)
    if user_doc is None:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)

    if "attitude_profile" in updates:
        user_doc.attitude_profile = updates["attitude_profile"]
    if "typology_profile" in updates:
        user_doc.typology_profile = updates["typology_profile"]
    if "values_profile" in updates:
        user_doc.values_profile = updates["values_profile"]
    if "demographics" in updates:
        user_doc.demographics = updates["demographics"]
    if "color_test_solution" in updates and updates["color_test_solution"]:
        # Lightweight persistence of last color-test state alongside values_profile
        user_doc.values_profile = user_doc.values_profile or {}
        user_doc.values_profile["concept_color_matrix"] = updates["color_test_solution"]

    await user_doc.save()

    return UserResponse(
        id=user_doc.id,
        name=user_doc.name,
        email=user_doc.email,
        chat_id=user_doc.chat_id,
        demographics=user_doc.demographics,
        attitude_profile=user_doc.attitude_profile,
        typology_profile=user_doc.typology_profile,
        values_profile=user_doc.values_profile,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_user(user_id: str):
    user_doc = await UserDocument.get(user_id)
    if user_doc is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Backfill values_profile from latest color test result if missing
    if user_doc.values_profile is None:
        await user_doc.fetch_link(UserDocument.color_test_results)
        if user_doc.color_test_results:
            latest = user_doc.color_test_results[-1]
            user_doc.values_profile = {
                "calculated_metrics": latest.calculated_metrics,
                "concept_color_matrix": latest.color_test_solution.concept_color_matrix,
            }
            await user_doc.save()

    return UserResponse(
        id=user_doc.id,
        name=user_doc.name,
        email=user_doc.email,
        chat_id=user_doc.chat_id,
        demographics=user_doc.demographics,
        attitude_profile=user_doc.attitude_profile,
        typology_profile=user_doc.typology_profile,
        values_profile=user_doc.values_profile,
    )
