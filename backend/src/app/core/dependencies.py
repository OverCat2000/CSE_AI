from typing import cast
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import ALGORITHM, SECRET_KEY
from infrastructure.persistence.models.user import User
from core.database import get_db
from services.prompts.service import PromptService
from services.users.service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not cast(bool, user.is_active):
        raise HTTPException(status_code=403, detail="Account disabled")

    now = datetime.now(timezone.utc)

    last_seen = user.last_seen
    if last_seen and last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    if not last_seen or (now - last_seen) > timedelta(minutes=1):
        user.last_seen = now
        await db.commit()

    return user


async def get_prompt_service(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> PromptService:
    return PromptService(db, user_id=current_user.id)


async def get_user_service(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
) -> UserService:
    return UserService(db, admin_id=current_user.id)
