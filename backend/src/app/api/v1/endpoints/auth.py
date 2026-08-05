from typing import cast

from fastapi import APIRouter, Depends, HTTPException
import jwt
from core.config import ALGORITHM, SECRET_KEY
from infrastructure.persistence.models.user import User
from domain.users.schemas import (
    RefreshRequest,
    UserLogin,
    UserRegister,
    UserResponse,
    UserProfile,
    TokenResponse,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from core.dependencies import get_current_user
from core.security import (
    create_refresh_token,
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))

    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email,
        user_name=payload.user_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email, "user_name": new_user.user_name}


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(
        payload.password, cast(str, user.hashed_password)
    ):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "access_token": create_access_token(({"sub": str(user.id)})),
        "refresh_token": create_refresh_token({"sub": str(user.id)}),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserProfile)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest):
    try:
        decoded = jwt.decode(payload.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = decoded.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401, detail="Refresh toke expired, please login again"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {
        "access_token": create_access_token({"sub": user_id}),
        "token_type": "bearer",
    }
