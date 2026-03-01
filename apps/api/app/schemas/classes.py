import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class ClassCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    grade_label: str = Field(default="", max_length=32)


class ClassOut(ORMBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    grade_label: str
    created_at: datetime


class StudentSummaryOut(BaseModel):
    student_id: uuid.UUID
    display_name: str
    email: str | None = None


class ExternalStudentSummaryOut(BaseModel):
    external_student_id: uuid.UUID
    display_name: str
    external_key: str


class LinkStatusOut(BaseModel):
    class_id: uuid.UUID
    source: str
    roster_count: int
    external_count: int
    linked_count: int
    coverage_rate: float
    unlinked_roster: list[StudentSummaryOut]
    unlinked_external: list[ExternalStudentSummaryOut]


class LinkAlternativeOut(BaseModel):
    external_student_id: uuid.UUID
    display_name: str
    external_key: str


class LinkSuggestionOut(BaseModel):
    student: StudentSummaryOut
    suggestion: ExternalStudentSummaryOut | None = None
    confidence: str
    method: str
    alternatives: list[LinkAlternativeOut] = Field(default_factory=list)
    reason: str


class StudentLinkCreateIn(BaseModel):
    source: str
    student_id: uuid.UUID
    external_student_id: uuid.UUID
    verified_by_user: bool = True
    notes: str | None = None


class StudentLinkBulkIn(BaseModel):
    links: list[StudentLinkCreateIn]


class StudentLinkOut(ORMBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    student_id: uuid.UUID
    source: str
    external_student_id: uuid.UUID
    confidence: str
    method: str
    verified_by_user: bool
    verified_at: datetime | None
    notes: str | None
    created_at: datetime


class RosterStudentKPIOut(BaseModel):
    student_id: uuid.UUID
    display_name: str
    email: str | None = None
    linked: bool
    external_student_id: uuid.UUID | None = None
    progress_pct_avg: float | None = None
    score_pct_avg: float | None = None
    attempts_count: int = 0
    status: str


class ClassKPIOut(BaseModel):
    class_id: uuid.UUID
    source: str
    roster_count: int
    linked_count: int
    coverage_rate: float
    average_progress_pct: float | None = None
    average_score_pct: float | None = None
    roster: list[RosterStudentKPIOut]


class RosterImportRowIn(BaseModel):
    email: str
    display_name: str


class RosterImportIn(BaseModel):
    rows: list[RosterImportRowIn] = Field(default_factory=list)
    csv_text: str | None = None


class LearningComImportRowIn(BaseModel):
    external_key: str = Field(description="SIS Student ID")
    display_name: str = Field(description="Student name in export")
    activity_name: str = ""
    score_pct: float | None = None
    progress_pct: float | None = None
    attempts_count: int | None = None
    attempted_at: datetime | None = None


class LearningComImportIn(BaseModel):
    rows: list[LearningComImportRowIn] = Field(default_factory=list)
    csv_text: str | None = None


class ImportResultOut(BaseModel):
    class_id: uuid.UUID
    source: str
    rows_received: int
    rows_processed: int
