import bcrypt
import jwt
from datetime import datetime, timedelta

from core.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now() + timedelta(
        minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
