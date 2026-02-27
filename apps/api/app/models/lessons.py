import uuid
from sqlalchemy import String, Text, Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    overview: Mapped[str] = mapped_column(Text, default="", nullable=False)
    primary_grade: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    subject: Mapped[str] = mapped_column(String(64), default="", nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45, nullable=False)

    content: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    created_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class LessonRun(Base):
    __tablename__ = "lesson_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lesson_plans.id"), nullable=False, index=True)

    taught_on: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    grade: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    class_period: Mapped[str] = mapped_column(String(32), default="", nullable=False)

    duration_actual_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes_quick: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class LessonReflection(Base):
    __tablename__ = "lesson_reflections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lesson_runs.id"), nullable=False, unique=True)

    effectiveness_rating: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    worked_well: Mapped[str] = mapped_column(Text, default="", nullable=False)
    did_not_work: Mapped[str] = mapped_column(Text, default="", nullable=False)
    misconceptions: Mapped[str] = mapped_column(Text, default="", nullable=False)
    changes_next_time: Mapped[str] = mapped_column(Text, default="", nullable=False)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
