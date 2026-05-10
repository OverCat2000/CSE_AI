# domain/chat/mapping.py
from domain.chat.schemas import (
    AgentInput,
    AgentOutput,
    chatMessage,
    Choice,
    UsageInfo,
    StreamChunk,
    DeltaMessage,
    StreamChoice,
)
from infrastructure.orchestration.schemas import (
    AgentRequest,
    AgentMessage,
    AgentResponse,
    AgentStreamChunk,
)


def extract_session_user_ids(
    payload: AgentInput,
    x_session_id: str | None = None,
    x_user_id: str | None = None,
) -> tuple[str, str]:
    session_id = (
        x_session_id
        or payload.metadata.get("session_id")
        or payload.metadata.get("thread_id")
    )
    user_id = x_user_id or payload.metadata.get("user_id") or "anonymous"
    return session_id, user_id


def public_messages_to_agent_messages(
    public_msgs: list[chatMessage],
) -> list[AgentMessage]:
    """Convert public chatMessage list to internal AgentMessage list."""
    return [
        AgentMessage(role=m.role, content=m.content, name=m.name) for m in public_msgs
    ]


def agent_response_to_public(
    agent_resp: AgentResponse,
    model: str,
) -> AgentOutput:
    assistant_msgs = [m for m in agent_resp.messages if m.role == "assistant"]
    if assistant_msgs:
        last = assistant_msgs[-1]
        final_msg = chatMessage(role="assistant", content=last.content, name=last.name)
    else:
        final_msg = chatMessage(role="assistant", content="")

    choice = Choice(index=0, message=final_msg, finish_reason="stop")

    usage = UsageInfo()
    if "tokens" in agent_resp.metadata:
        tokens = agent_resp.metadata["tokens"]
        usage.prompt_tokens = tokens.get("prompt", 0)
        usage.completion_tokens = tokens.get("completion", 0)
        usage.total_tokens = tokens.get("total", 0)

    return AgentOutput(model=model, choices=[choice], usage=usage)


def agent_stream_chunk_to_public(
    chunk: AgentStreamChunk,
    model: str,
    chunk_id: str,
) -> StreamChunk:
    delta = DeltaMessage(
        role="assistant" if chunk.delta_content else None,
        content=chunk.delta_content,
    )
    choice = StreamChoice(index=0, delta=delta, finish_reason=chunk.finish_reason)
    return StreamChunk(id=chunk_id, model=model, choices=[choice])


def public_request_to_agent_request(
    payload: AgentInput,
    session_id: str,
    user_id: str,
) -> AgentRequest:
    return AgentRequest(
        session_id=session_id,
        user_id=user_id,
        messages=public_messages_to_agent_messages(payload.message),
        model=payload.model,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        metadata=payload.metadata,
    )
