import uuid
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import ORMBase

class MaterialCreate(BaseModel):
    name: str
    category: str = ""

class MaterialOut(ORMBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    category: str
    created_at: datetime

class LessonMaterialIn(BaseModel):
    material_id: uuid.UUID
    quantity_note: str = ""
    prep_note: str = ""

class AttachMaterialsIn(BaseModel):
    items: list[LessonMaterialIn]
