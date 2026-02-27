import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.lessons import LessonPlan, LessonRun, LessonReflection

def list_runs(db: Session, lesson_id: uuid.UUID):
    stmt = select(LessonRun).where(LessonRun.lesson_plan_id == lesson_id).order_by(LessonRun.taught_on.desc())
    return db.execute(stmt).scalars().all()

def create_run(db: Session, lesson: LessonPlan, data: dict):
    run = LessonRun(lesson_plan_id=lesson.id, **data)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run

def get_run(db: Session, run_id: uuid.UUID):
    return db.execute(select(LessonRun).where(LessonRun.id == run_id)).scalar_one_or_none()

def update_run(db: Session, run: LessonRun, data: dict):
    for k, v in data.items():
        setattr(run, k, v)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run

def get_reflection(db: Session, run_id: uuid.UUID):
    return db.execute(select(LessonReflection).where(LessonReflection.lesson_run_id == run_id)).scalar_one_or_none()

def create_reflection(db: Session, run: LessonRun, data: dict):
    ref = LessonReflection(lesson_run_id=run.id, **data)
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref

def update_reflection(db: Session, ref: LessonReflection, data: dict):
    for k, v in data.items():
        setattr(ref, k, v)
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref
