from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from domain.users.schemas import PaginatedUsers, UserAdminView
from infrastructure.persistence.models.user import User
from core.database import get_db
from core.permissions import require_admin
from core.pagination import PaginationParam, paginate


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=PaginatedUsers)
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
    pagination: PaginationParam = Depends(paginate),
):
    count_results = await db.execute(select(func.count()).select_from(User))
    total = count_results.scalar() or 0

    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.page_size)
    )

    users = result.scalars().all()

    return PaginatedUsers(
        data=[UserAdminView.model_validate(u) for u in users],
        meta=pagination.meta(total),
    )


@router.get("/users/{user_id}", response_model=UserAdminView)
async def get_user_detail(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}/deactivate", response_model=UserAdminView)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    await db.commit()
    await db.refresh(user)
    return user
