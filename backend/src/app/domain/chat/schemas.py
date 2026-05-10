from typing import Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from uuid import uuid4


class chatMessage(BaseModel):
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    name: str | None = None


class AgentInput(BaseModel):
    model: str
    message: list[chatMessage]
    temperature: float | None = None
    max_tokens: int | None = None
    metadata: dict[str, Any] = {}


class UsageInfo(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class Choice(BaseModel):
    index: int = 0
    message: chatMessage
    finish_reason: Literal["stop", "length", "tool_calls", "error"] = "stop"


class AgentOutput(BaseModel):
    id: str = Field(default_factory=lambda: f"chatcmpl-{uuid4().hex[:8]}")
    object: str = "chat.completion"
    created: int = Field(
        default_factory=lambda: int(datetime.now(timezone.utc).timestamp())
    )
    model: str
    choices: list[Choice]
    usage: UsageInfo = Field(default_factory=UsageInfo)


class DeltaMessage(BaseModel):
    role: Literal["assistant"] | None = None
    content: str | None = None


class StreamChoice(BaseModel):
    index: int = 0
    delta: DeltaMessage
    finish_reason: Literal["stop", "length", "tool_calls", "error"] | None = None


class StreamChunk(BaseModel):
    id: str
    object: str = "chat.completion.chunk"
    created: int = Field(
        default_factory=lambda: int(datetime.now(timezone.utc).timestamp())
    )
    model: str
    choices: list[StreamChoice]

    def to_sse(self) -> str:
        return f"data: {self.model_dump_json()}\n\n"
