from typing import Any, Dict, List, Literal
from pydantic import BaseModel, Field

FinishReason = Literal["stop", "length", "tool_calls", "error"]


class AgentMessage(BaseModel):
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    name: str | None = None
    tool_calls: List[Dict[str, Any]] | None = None


class AgentRequest(BaseModel):
    session_id: str
    user_id: str
    messages: List[AgentMessage]
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentResponse(BaseModel):
    session_id: str
    messages: List[AgentMessage]
    final_answer: str | None = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentStreamChunk(BaseModel):
    session_id: str
    delta_content: str | None = None
    finish_reason: FinishReason | None = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
