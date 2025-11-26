from .timestamps_model import TimestampsModel
from pydantic import Field
import uuid


class User(TimestampsModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password: str
