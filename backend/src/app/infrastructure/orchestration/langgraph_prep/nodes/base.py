from abc import abstractmethod, ABC
from dataclasses import dataclass
from typing import Callable
from langchain_core.language_models.chat_models import BaseChatModel
from infrastructure.orchestration.langgraph_prep.prompts import PromptEntry

from ..tools.store import ToolEntry
from ..state import State


@dataclass()
class NodeDependencies:
    llm: BaseChatModel
    tools: list[ToolEntry]
    prompt: PromptEntry


# NodeCallable = Callable[[State], dict]


class BaseNodeFactory(ABC):
    @abstractmethod
    def build(self, deps: NodeDependencies) -> NodeCallable:
        """Return something"""
        ...
