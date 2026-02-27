import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember

bearer = HTTPBearer(auto_error=False)

def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(creds.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        sub = payload.get("sub")
        if not sub:
            raise ValueError("missing sub")
        user_id = uuid.UUID(sub)
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_or_create_default_workspace(db: Session, user: User) -> Workspace:
    member = db.execute(select(WorkspaceMember).where(WorkspaceMember.user_id == user.id)).scalar_one_or_none()
    if member:
        ws = db.execute(select(Workspace).where(Workspace.id == member.workspace_id)).scalar_one()
        return ws

    ws = Workspace(name=f"{user.name or 'My'} Workspace", owner_user_id=user.id)
    db.add(ws)
    db.commit()
    db.refresh(ws)

    wm = WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="owner")
    db.add(wm)
    db.commit()
    return ws
