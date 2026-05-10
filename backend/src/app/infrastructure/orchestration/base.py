from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from infrastructure.orchestration.schemas import (
    AgentRequest,
    AgentResponse,
    AgentStreamChunk,
)


class BaseOrchestrator(ABC):
    @abstractmethod
    async def run(self, request: AgentRequest) -> AgentResponse:
        pass

    @abstractmethod
    async def stream(
        self, request: AgentRequest
    ) -> AsyncGenerator[AgentStreamChunk, None]:
        pass
