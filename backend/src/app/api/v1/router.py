from fastapi import APIRouter
from .endpoints.auth import router as auth_router
from .endpoints.admin import router as admin_router
from .endpoints.chat import router as chat_router
from .endpoints.prompts import router as prompts_router

router = APIRouter(prefix="/v1")
router.include_router(auth_router)
router.include_router(admin_router)
router.include_router(chat_router)
router.include_router(prompts_router)
