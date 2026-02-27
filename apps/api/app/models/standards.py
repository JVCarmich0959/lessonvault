import uuid
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class StandardsSet(Base):
    __tablename__ = "standards_sets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version_label: Mapped[str] = mapped_column(String(64), default="v1", nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Standard(Base):
    __tablename__ = "standards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    standards_set_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("standards_sets.id"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

class LessonPlanStandard(Base):
    __tablename__ = "lesson_plan_standards"

    lesson_plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lesson_plans.id"), primary_key=True)
    standard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("standards.id"), primary_key=True)
