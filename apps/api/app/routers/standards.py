import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser, get_current_user, get_or_create_default_workspace, require_workspace_roles
from app.db.session import get_db
from app.schemas.standards import (
    StandardsSetCreate, StandardsSetOut,
    StandardCreate, StandardOut,
    AttachStandardsIn,
)
from app.services.lesson_service import get_lesson_plan
from app.services.standards_service import (
    list_sets, create_set,
    list_standards, create_standard,
    list_attached, attach, detach,
)

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/standards-sets", response_model=list[StandardsSetOut])
def get_sets(user: CurrentUser, db: Session = Depends(get_db)):
    ws = get_or_create_default_workspace(db, user)
    return list_sets(db, ws.id)

@router.post("/standards-sets", response_model=StandardsSetOut, dependencies=[Depends(require_workspace_roles("owner"))])
def post_set(payload: StandardsSetCreate, user: CurrentUser, db: Session = Depends(get_db)):
    ws = get_or_create_default_workspace(db, user)
    return create_set(db, ws.id, payload.name, payload.version_label)

@router.get("/standards", response_model=list[StandardOut])
def get_standards(user: CurrentUser, set_id: uuid.UUID | None = None, q: str | None = None, db: Session = Depends(get_db)):
    ws = get_or_create_default_workspace(db, user)
    return list_standards(db, ws.id, set_id=set_id, q=q)

@router.post("/standards", response_model=StandardOut, dependencies=[Depends(require_workspace_roles("owner"))])
def post_standard(payload: StandardCreate, user: CurrentUser, db: Session = Depends(get_db)):
    ws = get_or_create_default_workspace(db, user)
    st = create_standard(db, ws.id, payload.standards_set_id, payload.code, payload.description)
    if not st:
        raise HTTPException(status_code=404, detail="Standards set not found")
    return st

@router.get("/lesson-plans/{lesson_id}/standards", response_model=list[StandardOut])
def get_lesson_standards(lesson_id: uuid.UUID, user: CurrentUser, db: Session = Depends(get_db)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return list_attached(db, lesson.id)

@router.post("/lesson-plans/{lesson_id}/standards", dependencies=[Depends(require_workspace_roles("owner"))])
def attach_standards(lesson_id: uuid.UUID, payload: AttachStandardsIn, user: CurrentUser, db: Session = Depends(get_db)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    attach(db, lesson, payload.standard_ids)
    return {"ok": True, "attached_count": len(payload.standard_ids)}

@router.delete("/lesson-plans/{lesson_id}/standards/{standard_id}", dependencies=[Depends(require_workspace_roles("owner"))])
def detach_standard(lesson_id: uuid.UUID, standard_id: uuid.UUID, user: CurrentUser, db: Session = Depends(get_db)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    ok = detach(db, lesson.id, standard_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not attached")
    return {"ok": True}
