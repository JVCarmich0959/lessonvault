import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.standards import StandardsSet, Standard, LessonPlanStandard
from app.models.lessons import LessonPlan

def list_sets(db: Session, workspace_id: uuid.UUID):
    return db.execute(select(StandardsSet).where(StandardsSet.workspace_id == workspace_id).order_by(StandardsSet.created_at.desc())).scalars().all()

def create_set(db: Session, workspace_id: uuid.UUID, name: str, version_label: str = "v1"):
    ss = StandardsSet(workspace_id=workspace_id, name=name, version_label=version_label)
    db.add(ss)
    db.commit()
    db.refresh(ss)
    return ss

def list_standards(db: Session, workspace_id: uuid.UUID, set_id: uuid.UUID | None = None, q: str | None = None):
    # Ensure set belongs to workspace if set_id provided
    if set_id:
        ss = db.execute(select(StandardsSet).where(StandardsSet.id == set_id, StandardsSet.workspace_id == workspace_id)).scalar_one_or_none()
        if not ss:
            return []

    stmt = select(Standard)
    if set_id:
        stmt = stmt.where(Standard.standards_set_id == set_id)
    if q:
        stmt = stmt.where((Standard.code.ilike(f"%{q}%")) | (Standard.description.ilike(f"%{q}%")))
    stmt = stmt.order_by(Standard.code.asc())
    return db.execute(stmt).scalars().all()

def create_standard(db: Session, workspace_id: uuid.UUID, standards_set_id: uuid.UUID, code: str, description: str):
    ss = db.execute(select(StandardsSet).where(StandardsSet.id == standards_set_id, StandardsSet.workspace_id == workspace_id)).scalar_one_or_none()
    if not ss:
        return None
    st = Standard(standards_set_id=standards_set_id, code=code, description=description)
    db.add(st)
    db.commit()
    db.refresh(st)
    return st

def list_attached(db: Session, lesson_id: uuid.UUID):
    # returns list[Standard]
    stmt = (
        select(Standard)
        .join(LessonPlanStandard, LessonPlanStandard.standard_id == Standard.id)
        .where(LessonPlanStandard.lesson_plan_id == lesson_id)
        .order_by(Standard.code.asc())
    )
    return db.execute(stmt).scalars().all()

def attach(db: Session, lesson: LessonPlan, standard_ids: list[uuid.UUID]):
    # Attach without duplicates
    existing = set(
        db.execute(select(LessonPlanStandard.standard_id).where(LessonPlanStandard.lesson_plan_id == lesson.id)).scalars().all()
    )
    to_add = [sid for sid in standard_ids if sid not in existing]
    for sid in to_add:
        db.add(LessonPlanStandard(lesson_plan_id=lesson.id, standard_id=sid))
    db.commit()

def detach(db: Session, lesson_id: uuid.UUID, standard_id: uuid.UUID):
    row = db.execute(
        select(LessonPlanStandard).where(
            LessonPlanStandard.lesson_plan_id == lesson_id,
            LessonPlanStandard.standard_id == standard_id,
        )
    ).scalar_one_or_none()
    if row:
        db.delete(row)
        db.commit()
        return True
    return False
