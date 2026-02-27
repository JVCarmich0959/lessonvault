import uuid
from datetime import datetime
from pydantic import Field
from app.schemas.common import ORMBase

class LessonPlanCreate(ORMBase):
    title: str
    overview: str = ""
    primary_grade: str = ""
    subject: str = ""
    duration_minutes: int = 45
    content: dict = Field(default_factory=dict)

class LessonPlanUpdate(ORMBase):
    title: str | None = None
    overview: str | None = None
    primary_grade: str | None = None
    subject: str | None = None
    duration_minutes: int | None = None
    content: dict | None = None

class LessonPlanOut(ORMBase):
    id: uuid.UUID
    title: str
    overview: str
    primary_grade: str
    subject: str
    duration_minutes: int
    content: dict
    created_at: datetime
    updated_at: datetime
