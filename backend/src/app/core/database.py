from typing import cast

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from core.config import DATABASE_URL

engine = create_async_engine(cast(str, DATABASE_URL))

async_session_local = async_sessionmaker(bind=engine, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with async_session_local() as session:
        yield session
