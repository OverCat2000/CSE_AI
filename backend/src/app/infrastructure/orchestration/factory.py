from infrastructure.orchestration.base import BaseOrchestrator
from core import config


def get_orchestrator() -> BaseOrchestrator:
    match config.ORCHESTRATOR_TYPE:
        case "langgraph":
            from infrastructure.orchestration.langgraph.orchestrator import (
                LangGraphOrchestrator,
            )
            from infrastructure.orchestration.langgraph.config import LangGraphConfig

            lg_config = LangGraphConfig(
                model_id=config.BEDROCK_MODEL_ID,
                temperature=config.BEDROCK_TEMPERATURE,
                max_tokens=config.BEDROCK_MAX_TOKENS,
                enable_tracing=config.BEDROCK_ENABLE_TRACING,
            )
            return LangGraphOrchestrator(config=lg_config)
        case "adk":
            from infrastructure.orchestration.adk.orchestrator import ADKOrchestrator

            return ADKOrchestrator()
        case _:
            raise ValueError(f"Unknown orchestrator type: {config.ORCHESTRATOR_TYPE}")
