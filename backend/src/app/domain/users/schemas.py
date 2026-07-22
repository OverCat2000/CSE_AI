from typing import Literal
from pydantic import BaseModel, computed_field, EmailStr, model_validator, ConfigDict
from datetime import datetime, timezone, timedelta
from domain.shared.schemas import PaginationMeta


ONLINE_THRESHOLD_MINUTES = 5


class UserAdminView(BaseModel):
    id: int
    email: str
    user_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_seen: datetime | None
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def is_online(self) -> bool:
        if not self.last_seen:
            return False
        return datetime.now(timezone.utc) - self.last_seen < timedelta(
            minutes=ONLINE_THRESHOLD_MINUTES
        )


class PaginatedUsers(BaseModel):
    data: list[UserAdminView]
    meta: PaginationMeta


class UserRoleUpdate(BaseModel):
    role: Literal["user", "admin"]


class UserStats(BaseModel):
    total: int
    active: int
    admins: int
    online: int


class UserRegister(BaseModel):
    email: EmailStr
    user_name: str
    password: str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "UserRegister":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    user_name: str
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
