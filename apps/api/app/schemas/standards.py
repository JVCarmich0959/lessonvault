import uuid
from datetime import datetime
from pydantic import BaseModel
from app.schemas.common import ORMBase

class StandardsSetCreate(BaseModel):
    name: str
    version_label: str = "v1"

class StandardsSetOut(ORMBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    version_label: str
    created_at: datetime

class StandardCreate(BaseModel):
    standards_set_id: uuid.UUID
    code: str
    description: str

class StandardOut(ORMBase):
    id: uuid.UUID
    standards_set_id: uuid.UUID
    code: str
    description: str

class AttachStandardsIn(BaseModel):
    standard_ids: list[uuid.UUID]
