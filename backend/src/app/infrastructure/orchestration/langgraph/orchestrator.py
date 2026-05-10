from collections.abc import AsyncIterator
from langgraph.graph import CompiledGraph
from infrastructure.orchestration.base import BaseOrchestrator
from infrastructure.orchestration.schemas import (
    AgentRequest,
    AgentResponse,
    AgentMessage,
    AgentStreamChunk,
)
from .config import LangGraphConfig
from .graph import LangGraphBuilder
from .state import GraphState
from langchain_core.messages import HumanMessage, AIMessage
import json


class LangGraphOrchestrator(BaseOrchestrator):
    def __init__(self, config: LangGraphConfig):
        super().__init__()
        self.config = config
        builder = LangGraphBuilder(
            model_id=config.model_id,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
        )
        self.graph: CompiledGraph = builder.compile()

    async def run(self, request: AgentRequest) -> AgentResponse:
        lc_messages = self._agent_messages_to_langchain(request.messages)

        initial_state: GraphState = {"messages": lc_messages}

        final_state = await self.graph.ainvoke(initial_state)

        updated_messages = self._langchain_to_agent_messages(final_state["messages"])

        final_answer = updated_messages[-1].content if updated_messages else ""

        return AgentResponse(
            session_id=request.session_id,
            messages=updated_messages,
            final_answer=final_answer,
            metadata={},
        )

    async def stream(self, request: AgentRequest) -> AsyncIterator[AgentStreamChunk]:
        lc_messages = self._agent_messages_to_langchain(request.messages)
        initial_state: GraphState = {"messages": lc_messages}

        async for chunk in self.graph.astream(initial_state, stream_mode="messages"):
            if isinstance(chunk, tuple):
                message_chunk, _ = chunk
                yield AgentStreamChunk(
                    session_id=request.session_id,
                    delta_content=message_chunk.content,
                )
            else:
                pass

        yield AgentStreamChunk(
            session_id=request.session_id,
            delta_content="",
            finish_reason="stop",
        )

    def _agent_messages_to_langchain(self, messages: list[AgentMessage]) -> list:
        lc_messages = []
        for m in messages:
            if m.role == "user":
                lc_messages.append(HumanMessage(content=m.content))
            elif m.role == "assistant":
                lc_messages.append(AIMessage(content=m.content))
        return lc_messages

    def _langchain_to_agent_messages(self, lc_messages: list) -> list[AgentMessage]:
        agent_msgs = []
        for m in lc_messages:
            if isinstance(m, HumanMessage):
                role = "user"
            elif isinstance(m, AIMessage):
                role = "assistant"
            else:
                continue
            agent_msgs.append(AgentMessage(role=role, content=m.content))
        return agent_msgs
