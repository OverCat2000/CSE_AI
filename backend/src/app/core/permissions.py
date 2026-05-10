from fastapi import Depends, HTTPException
from infrastructure.persistence.models.user import User
from core.dependencies import get_current_user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
