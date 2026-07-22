from fastapi import APIRouter, Depends, HTTPException, Query

from domain.users.schemas import (
    PaginatedUsers,
    UserAdminView,
    UserRoleUpdate,
    UserStats,
)
from domain.users.exceptions import UserNotFound, SelfModificationError
from infrastructure.persistence.models.user import User
from services.users.service import UserService
from core.permissions import require_admin
from core.dependencies import get_user_service
from core.pagination import PaginationParam, paginate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=PaginatedUsers)
async def list_users(
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
    pagination: PaginationParam = Depends(paginate),
    search: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
):
    users, total = await service.list_users(
        pagination.offset, pagination.page_size, search, is_active
    )
    return PaginatedUsers(
        data=[UserAdminView.model_validate(u) for u in users],
        meta=pagination.meta(total),
    )


@router.get("/stats", response_model=UserStats)
async def get_stats(
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
):
    return await service.stats()


@router.get("/users/{user_id}", response_model=UserAdminView)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
):
    try:
        return await service.get_user(user_id)
    except UserNotFound:
        raise HTTPException(status_code=404, detail="User not found")


@router.patch("/users/{user_id}/deactivate", response_model=UserAdminView)
async def deactivate_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
):
    try:
        return await service.set_active(user_id, False)
    except UserNotFound:
        raise HTTPException(status_code=404, detail="User not found")
    except SelfModificationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/users/{user_id}/activate", response_model=UserAdminView)
async def activate_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
):
    try:
        return await service.set_active(user_id, True)
    except UserNotFound:
        raise HTTPException(status_code=404, detail="User not found")


@router.patch("/users/{user_id}/role", response_model=UserAdminView)
async def update_user_role(
    user_id: int,
    body: UserRoleUpdate,
    service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
):
    try:
        return await service.set_role(user_id, body.role)
    except UserNotFound:
        raise HTTPException(status_code=404, detail="User not found")
    except SelfModificationError as e:
        raise HTTPException(status_code=400, detail=str(e))
