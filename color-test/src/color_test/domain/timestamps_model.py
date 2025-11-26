from abc import ABC
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from beanie import before_event, Insert, Replace, Update, SaveChanges


class TimestampsModel(ABC, BaseModel):
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = Field(default=None)

    @before_event(Insert)
    async def _set_timestamps_on_insert(self):
        now = datetime.now()
        self.created_at = now
        self.updated_at = now

    @before_event(Replace)
    @before_event(Update)
    @before_event(SaveChanges)
    async def _touch_updated_at(self):
        self.updated_at = datetime.now()
