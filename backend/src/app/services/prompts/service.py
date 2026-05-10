from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.orchestration.langgraph_prep.prompts import PromptStore
from infrastructure.persistence.models.prompt import Prompt
from domain.prompts import PromptEntry, PromptNotFound, PromptUpdateRequest


class PromptService:
    def __init__(self, db: AsyncSession, user_id: int | None = None):
        self.db = db
        self.store = PromptStore()
        self.user_id = user_id

    async def load_into_store(self) -> None:
        result = await self.db.execute(select(Prompt))
        entries = [
            PromptEntry(node=r.node, variant=r.variant, template=r.template)
            for r in list(result.scalars())
        ]
        self.store.load(entries)

    async def list_all(self) -> list[Prompt]:
        result = await self.db.execute(select(Prompt))
        return list(result.scalars())

    async def get(self, node: str, variant: str = "default") -> Prompt:
        result = await self.db.execute(
            select(Prompt).where(Prompt.node == node, Prompt.variant == variant)
        )
        record = result.scalar_one_or_none()
        if not record:
            raise PromptNotFound(node, variant)
        return record

    async def update(
        self,
        node: str,
        data: PromptUpdateRequest,
        variant: str = "default",
    ) -> Prompt:
        record = await self.get(node, variant)

        record.template = data.template
        record.change_note = data.change_note
        record.updated_by = self.user_id
        record.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(record)

        self.store.set(PromptEntry(node=node, variant=variant, template=data.template))

        return record
