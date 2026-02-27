import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_or_create_default_workspace
from app.db.session import get_db
from app.schemas.runs import LessonRunCreate, LessonRunUpdate, LessonRunOut, ReflectionCreate, ReflectionUpdate, ReflectionOut
from app.services.lesson_service import get_lesson_plan
from app.services.runs_service import list_runs, create_run, get_run, update_run, get_reflection, create_reflection, update_reflection

router = APIRouter()

@router.get("/lesson-plans/{lesson_id}/runs", response_model=list[LessonRunOut])
def get_runs(lesson_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return list_runs(db, lesson.id)

@router.post("/lesson-plans/{lesson_id}/runs", response_model=LessonRunOut)
def post_run(lesson_id: uuid.UUID, payload: LessonRunCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return create_run(db, lesson, payload.model_dump())

@router.get("/runs/{run_id}", response_model=LessonRunOut)
def get_one_run(run_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Confirm run belongs to user's workspace by traversing lesson plan
    ws = get_or_create_default_workspace(db, user)
    run = get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    lesson = get_lesson_plan(db, run.lesson_plan_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Run not accessible")
    return run

@router.patch("/runs/{run_id}", response_model=LessonRunOut)
def patch_run(run_id: uuid.UUID, payload: LessonRunUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    run = get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    lesson = get_lesson_plan(db, run.lesson_plan_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Run not accessible")
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    return update_run(db, run, data)

@router.get("/runs/{run_id}/reflection", response_model=ReflectionOut)
def get_run_reflection(run_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    run = get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    lesson = get_lesson_plan(db, run.lesson_plan_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Run not accessible")

    ref = get_reflection(db, run.id)
    if not ref:
        raise HTTPException(status_code=404, detail="Reflection not found")
    return ref

@router.post("/runs/{run_id}/reflection", response_model=ReflectionOut)
def post_run_reflection(run_id: uuid.UUID, payload: ReflectionCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    run = get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    lesson = get_lesson_plan(db, run.lesson_plan_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Run not accessible")

    existing = get_reflection(db, run.id)
    if existing:
        raise HTTPException(status_code=400, detail="Reflection already exists")
    return create_reflection(db, run, payload.model_dump())

@router.patch("/runs/{run_id}/reflection", response_model=ReflectionOut)
def patch_run_reflection(run_id: uuid.UUID, payload: ReflectionUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    run = get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    lesson = get_lesson_plan(db, run.lesson_plan_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Run not accessible")

    ref = get_reflection(db, run.id)
    if not ref:
        raise HTTPException(status_code=404, detail="Reflection not found")
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    return update_reflection(db, ref, data)
