import uuid
from datetime import date, datetime
from pydantic import BaseModel
from app.schemas.common import ORMBase

class LessonRunCreate(BaseModel):
    taught_on: date
    grade: str = ""
    class_period: str = ""
    duration_actual_minutes: int = 0
    notes_quick: str = ""

class LessonRunUpdate(BaseModel):
    taught_on: date | None = None
    grade: str | None = None
    class_period: str | None = None
    duration_actual_minutes: int | None = None
    notes_quick: str | None = None

class LessonRunOut(ORMBase):
    id: uuid.UUID
    lesson_plan_id: uuid.UUID
    taught_on: date
    grade: str
    class_period: str
    duration_actual_minutes: int
    notes_quick: str
    created_at: datetime

class ReflectionCreate(BaseModel):
    effectiveness_rating: int = 3
    worked_well: str = ""
    did_not_work: str = ""
    misconceptions: str = ""
    changes_next_time: str = ""

class ReflectionUpdate(BaseModel):
    effectiveness_rating: int | None = None
    worked_well: str | None = None
    did_not_work: str | None = None
    misconceptions: str | None = None
    changes_next_time: str | None = None

class ReflectionOut(ORMBase):
    id: uuid.UUID
    lesson_run_id: uuid.UUID
    effectiveness_rating: int
    worked_well: str
    did_not_work: str
    misconceptions: str
    changes_next_time: str
    created_at: datetime
