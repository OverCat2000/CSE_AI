from fastapi import APIRouter, Depends, HTTPException

from domain.prompts.schemas import PromptResponse, PromptUpdateRequest
from domain.prompts.exceptions import PromptNotFound
from infrastructure.persistence.models.user import User
from services.prompts.service import PromptService
from core.permissions import require_admin
from core.dependencies import get_prompt_service

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=list[PromptResponse])
async def list_prompts(
    service: PromptService = Depends(get_prompt_service),
    _: User = Depends(require_admin),
):
    return await service.list_all()


@router.get("/{node}/{variant}", response_model=PromptResponse)
async def get_prompt(
    node: str,
    variant: str,
    service: PromptService = Depends(get_prompt_service),
    _: User = Depends(require_admin),
):
    try:
        return await service.get(node, variant)
    except PromptNotFound:
        raise HTTPException(
            status_code=404, detail=f"Prompt '{node}/{variant}' not found"
        )


@router.put("/{node}/{variant}", response_model=PromptResponse)
async def update_prompt(
    node: str,
    variant: str,
    body: PromptUpdateRequest,
    service: PromptService = Depends(get_prompt_service),
    _: User = Depends(require_admin),
):
    try:
        return await service.update(node=node, variant=variant, data=body)
    except PromptNotFound:
        raise HTTPException(
            status_code=404, detail=f"Prompt '{node}/{variant}' not found"
        )


@router.post("/store/refresh", status_code=200)
async def refresh_prompt_store(
    service: PromptService = Depends(get_prompt_service),
    _: User = Depends(require_admin),
):
    await service.load_into_store()
    return {"message": "Prompt store refreshed successfully"}
