import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from sqlalchemy import text
from collections.abc import AsyncGenerator

from main import app
from core.database import Base, get_db
from infrastructure.persistence.models.user import User
from core.security import hash_password, create_access_token

# ---------------------------------------------------------------------------
# In-memory SQLite engine — fast, isolated, no real DB needed
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Create tables once for the entire session
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Wipe all tables after each test to prevent UNIQUE constraint collisions
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    yield
    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f"DELETE FROM {table.name}"))


# ---------------------------------------------------------------------------
# Provide a fresh DB session per test and override the app dependency
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Reusable user factories
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture()
async def regular_user(db_session: AsyncSession) -> User:
    user = User(
        email="user@example.com",
        user_name="testuser",
        hashed_password=hash_password("password123"),
        role="user",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
async def admin_user(db_session: AsyncSession) -> User:
    user = User(
        email="admin@example.com",
        user_name="adminuser",
        hashed_password=hash_password("adminpass123"),
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
async def inactive_user(db_session: AsyncSession) -> User:
    user = User(
        email="inactive@example.com",
        user_name="inactiveuser",
        hashed_password=hash_password("password123"),
        role="user",
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Auth token helpers
# ---------------------------------------------------------------------------
@pytest.fixture()
def user_token(regular_user: User) -> str:
    return create_access_token({"sub": str(regular_user.id)})


@pytest.fixture()
def admin_token(admin_user: User) -> str:
    return create_access_token({"sub": str(admin_user.id)})


@pytest.fixture()
def auth_headers(user_token: str) -> dict:
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture()
def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}
