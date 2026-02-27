import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.materials import Material, LessonPlanMaterial
from app.models.lessons import LessonPlan

def list_materials(db: Session, workspace_id: uuid.UUID, q: str | None = None):
    stmt = select(Material).where(Material.workspace_id == workspace_id).order_by(Material.name.asc())
    if q:
        stmt = stmt.where(Material.name.ilike(f"%{q}%"))
    return db.execute(stmt).scalars().all()

def create_material(db: Session, workspace_id: uuid.UUID, name: str, category: str = ""):
    m = Material(workspace_id=workspace_id, name=name, category=category)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

def list_attached(db: Session, lesson_id: uuid.UUID):
    stmt = (
        select(LessonPlanMaterial, Material)
        .join(Material, Material.id == LessonPlanMaterial.material_id)
        .where(LessonPlanMaterial.lesson_plan_id == lesson_id)
        .order_by(Material.name.asc())
    )
    return db.execute(stmt).all()

def attach(db: Session, lesson: LessonPlan, items: list[dict]):
    # Upsert-ish: if row exists, update notes; else create.
    for it in items:
        material_id = it["material_id"]
        row = db.execute(
            select(LessonPlanMaterial).where(
                LessonPlanMaterial.lesson_plan_id == lesson.id,
                LessonPlanMaterial.material_id == material_id,
            )
        ).scalar_one_or_none()
        if row:
            row.quantity_note = it.get("quantity_note", row.quantity_note)
            row.prep_note = it.get("prep_note", row.prep_note)
        else:
            db.add(
                LessonPlanMaterial(
                    lesson_plan_id=lesson.id,
                    material_id=material_id,
                    quantity_note=it.get("quantity_note", ""),
                    prep_note=it.get("prep_note", ""),
                )
            )
    db.commit()

def detach(db: Session, lesson_id: uuid.UUID, material_id: uuid.UUID):
    row = db.execute(
        select(LessonPlanMaterial).where(
            LessonPlanMaterial.lesson_plan_id == lesson_id,
            LessonPlanMaterial.material_id == material_id,
        )
    ).scalar_one_or_none()
    if row:
        db.delete(row)
        db.commit()
        return True
    return False
