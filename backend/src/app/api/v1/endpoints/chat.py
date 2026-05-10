from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import StreamingResponse

from domain.chat.schemas import AgentInput
from domain.chat.mapping import (
    extract_session_user_ids,
    public_request_to_agent_request,
    agent_response_to_public,
    agent_stream_chunk_to_public,
)
from infrastructure.orchestration.factory import get_orchestrator
from infrastructure.orchestration.base import BaseOrchestrator

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/completions")
async def chat_completions(
    request: Request,
    payload: AgentInput,
    x_session_id: str | None = Header(None, alias="X-Session-ID"),
    x_user_id: str | None = Header(None, alias="X-User-ID"),
):
    session_id, user_id = extract_session_user_ids(payload, x_session_id, x_user_id)
    if not session_id:
        raise HTTPException(
            400,
            "Missing session identifier. Provide X-Session-ID header or metadata.session_id.",
        )

    agent_request = public_request_to_agent_request(payload, session_id, user_id)

    orchestrator: BaseOrchestrator = get_orchestrator()

    stream = payload.metadata.get("stream", False)

    if stream:

        async def event_generator():
            chunk_id = f"chatcmpl-{session_id[:8]}"
            stream_iter = await orchestrator.stream(agent_request)
            async for agent_chunk in stream_iter:
                public_chunk = agent_stream_chunk_to_public(
                    agent_chunk, payload.model, chunk_id
                )
                yield public_chunk.to_sse()
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
    else:
        agent_response = await orchestrator.run(agent_request)
        return agent_response_to_public(agent_response, payload.model)
