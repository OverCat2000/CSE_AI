from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime


class _PartialFormat(dict):
    def __missing__(self, key: str) -> str:
        return f"{{{key}}}"


class PromptEntry(BaseModel):
    node: str
    variant: str
    template: str

    def render(self, **kwargs) -> str:
        return self.template.format_map(_PartialFormat(**kwargs))


class PromptUpdateRequest(BaseModel):
    template: str
    change_note: str | None = None


class PromptResponse(BaseModel):
    id: str
    node: str
    variant: str
    template: str
    change_note: str | None
    updated_by: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
