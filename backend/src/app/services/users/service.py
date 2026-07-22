from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.persistence.models.user import User
from domain.users.schemas import UserStats, ONLINE_THRESHOLD_MINUTES
from domain.users.exceptions import UserNotFound, SelfModificationError


class UserService:
    def __init__(self, db: AsyncSession, admin_id: int):
        self.db = db
        self.admin_id = admin_id

    async def list_users(
        self,
        offset: int,
        limit: int,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[User], int]:
        stmt = select(User)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(User.email.ilike(like), User.user_name.ilike(like)))
        if is_active is not None:
            stmt = stmt.where(User.is_active.is_(is_active))

        total = await self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        result = await self.db.execute(
            stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars()), total or 0

    async def get_user(self, user_id: int) -> User:
        user = await self.db.get(User, user_id)
        if not user:
            raise UserNotFound(user_id)
        return user

    async def set_active(self, user_id: int, is_active: bool) -> User:
        if user_id == self.admin_id and not is_active:
            raise SelfModificationError("Cannot deactivate yourself")
        user = await self.get_user(user_id)
        user.is_active = is_active
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def set_role(self, user_id: int, role: str) -> User:
        if user_id == self.admin_id:
            raise SelfModificationError("Cannot change your own role")
        user = await self.get_user(user_id)
        user.role = role
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def stats(self) -> UserStats:
        threshold = datetime.now(timezone.utc) - timedelta(
            minutes=ONLINE_THRESHOLD_MINUTES
        )
        total = await self.db.scalar(select(func.count()).select_from(User))
        active = await self.db.scalar(
            select(func.count()).select_from(User).where(User.is_active.is_(True))
        )
        admins = await self.db.scalar(
            select(func.count()).select_from(User).where(User.role == "admin")
        )
        online = await self.db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.last_seen >= threshold)
        )
        return UserStats(
            total=total or 0,
            active=active or 0,
            admins=admins or 0,
            online=online or 0,
        )
