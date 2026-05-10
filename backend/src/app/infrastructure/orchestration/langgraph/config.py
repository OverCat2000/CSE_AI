from dataclasses import dataclass


@dataclass(frozen=True)
class LangGraphConfig:
    model_id: str
    temperature: float = 0.0
    max_tokens: int = 4096
    enable_tracing: bool = False
