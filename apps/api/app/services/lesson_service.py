import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.lessons import LessonPlan

def list_lesson_plans(db: Session, workspace_id: uuid.UUID, q: str | None = None):
    stmt = select(LessonPlan).where(LessonPlan.workspace_id == workspace_id).order_by(LessonPlan.updated_at.desc())
    if q:
        stmt = stmt.where(LessonPlan.title.ilike(f"%{q}%"))
    return db.execute(stmt).scalars().all()

def get_lesson_plan(db: Session, lesson_id: uuid.UUID, workspace_id: uuid.UUID) -> LessonPlan | None:
    stmt = select(LessonPlan).where(LessonPlan.id == lesson_id, LessonPlan.workspace_id == workspace_id)
    return db.execute(stmt).scalar_one_or_none()

def create_lesson_plan(db: Session, *, workspace_id: uuid.UUID, created_by_user_id: uuid.UUID, data: dict) -> LessonPlan:
    lesson = LessonPlan(workspace_id=workspace_id, created_by_user_id=created_by_user_id, **data)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

def update_lesson_plan(db: Session, *, lesson: LessonPlan, data: dict) -> LessonPlan:
    for k, v in data.items():
        setattr(lesson, k, v)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson
