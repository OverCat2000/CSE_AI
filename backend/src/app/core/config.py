import os
from typing import Final

from dotenv import load_dotenv

_ = load_dotenv()


def _get_env(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise RuntimeError(f"{name} environment variable is not set")
    return value


DATABASE_URL: Final[str] = _get_env("DATABASE_URL")
SYNC_DATABASE_URL = os.getenv("SYNC_DATABASE_URL")
SECRET_KEY: Final[str] = _get_env("SECRET_KEY")
ALGORITHM: Final[str] = _get_env("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES: Final[int] = int(_get_env("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS: Final[int] = int(_get_env("REFRESH_TOKEN_EXPIRE_DAYS"))

# Orchestrator
ORCHESTRATOR_TYPE: Final[str] = os.getenv("ORCHESTRATOR_TYPE", "langgraph")
# LangGraph
BEDROCK_MODEL_ID: Final[str] = os.getenv(
    "BEDROCK_MODEL_ID", "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
)
BEDROCK_TEMPERATURE: Final[float] = float(os.getenv("BEDROCK_TEMPERATURE", "0.0"))
BEDROCK_MAX_TOKENS: Final[int] = int(os.getenv("BEDROCK_MAX_TOKENS", "4096"))
BEDROCK_ENABLE_TRACING: Final[bool] = (
    os.getenv("BEDROCK_ENABLE_TRACING", "false").lower() == "true"
)
