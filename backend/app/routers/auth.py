from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    token = create_access_token(subject=user.email)
    return TokenResponse(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, full_name=user.full_name),
    )
