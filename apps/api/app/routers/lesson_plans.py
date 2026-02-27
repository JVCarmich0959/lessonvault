import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_or_create_default_workspace
from app.db.session import get_db
from app.schemas.lesson_plans import LessonPlanCreate, LessonPlanUpdate, LessonPlanOut
from app.services.lesson_service import list_lesson_plans, get_lesson_plan, create_lesson_plan, update_lesson_plan

router = APIRouter()

@router.get("/", response_model=list[LessonPlanOut])
def list_(q: str | None = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    return list_lesson_plans(db, ws.id, q=q)

@router.post("/", response_model=LessonPlanOut)
def create(payload: LessonPlanCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    return create_lesson_plan(db, workspace_id=ws.id, created_by_user_id=user.id, data=payload.model_dump())

@router.get("/{lesson_id}", response_model=LessonPlanOut)
def get_one(lesson_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return lesson

@router.patch("/{lesson_id}", response_model=LessonPlanOut)
def update(lesson_id: uuid.UUID, payload: LessonPlanUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    return update_lesson_plan(db, lesson=lesson, data=data)
