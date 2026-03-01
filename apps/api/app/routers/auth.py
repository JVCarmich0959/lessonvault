from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.schemas.auth import RegisterIn, LoginIn, TokenOut, UserOut
from app.services.auth_service import create_user, authenticate, get_user_by_email
from app.core.security import create_access_token

router = APIRouter()

@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    # bcrypt only considers first 72 bytes; passlib may throw if longer
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password must be 72 bytes or fewer.")

    user = create_user(db, email=payload.email, password=payload.password, name=payload.name)
    token = create_access_token(str(user.id), extra={"email": user.email})
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = authenticate(db, email=payload.email, password=payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id), extra={"email": user.email})
    return TokenOut(access_token=token)

@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return UserOut(id=str(user.id), email=user.email, name=user.name)
