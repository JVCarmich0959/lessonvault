import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_or_create_default_workspace
from app.db.session import get_db
from app.schemas.materials import MaterialCreate, MaterialOut, AttachMaterialsIn
from app.services.lesson_service import get_lesson_plan
from app.services.materials_service import list_materials, create_material, list_attached, attach, detach

router = APIRouter()

@router.get("/materials", response_model=list[MaterialOut])
def get_materials(q: str | None = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    return list_materials(db, ws.id, q=q)

@router.post("/materials", response_model=MaterialOut)
def post_material(payload: MaterialCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    return create_material(db, ws.id, payload.name, payload.category)

@router.get("/lesson-plans/{lesson_id}/materials")
def get_lesson_materials(lesson_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")

    rows = list_attached(db, lesson.id)
    # rows are (LessonPlanMaterial, Material)
    out = []
    for lpm, m in rows:
        out.append({
            "material": {"id": str(m.id), "name": m.name, "category": m.category},
            "quantity_note": lpm.quantity_note,
            "prep_note": lpm.prep_note,
        })
    return out

@router.post("/lesson-plans/{lesson_id}/materials")
def attach_materials(lesson_id: uuid.UUID, payload: AttachMaterialsIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    attach(db, lesson, [it.model_dump() for it in payload.items])
    return {"ok": True, "attached_count": len(payload.items)}

@router.delete("/lesson-plans/{lesson_id}/materials/{material_id}")
def detach_material(lesson_id: uuid.UUID, material_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ws = get_or_create_default_workspace(db, user)
    lesson = get_lesson_plan(db, lesson_id, ws.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    ok = detach(db, lesson.id, material_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not attached")
    return {"ok": True}
