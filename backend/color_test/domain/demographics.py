from pydantic import BaseModel, Field


class Demographics(BaseModel):
    name: str = Field(..., min_length=2, description="Имя пользователя")
    gender: str = Field(..., description="Пол пользователя: male/female")
    weight: int = Field(..., ge=30, le=300, description="Вес, кг")
    height: int = Field(..., ge=100, le=250, description="Рост, см")
    age: int = Field(..., ge=12, le=120, description="Возраст, лет")
