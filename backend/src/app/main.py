from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.router import router
from core.database import async_session_local
from services.prompts.service import PromptService


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session_local() as db:
        service = PromptService(db)
        await service.load_into_store()
    yield


app = FastAPI(lifespan=lifespan)


origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)
