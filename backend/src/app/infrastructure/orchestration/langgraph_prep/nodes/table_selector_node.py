from ..state import State
from .base import BaseNodeFactory, NodeDependencies
from typing import Callable


class TableSelectorFactory(BaseNodeFactory):
    def build(self, deps: NodeDependencies) -> Callable:
        llm = deps.llm
        prompt = deps.prompt

        def node(state: State) -> dict:
            filled = prompt.render(query=state["restructured_user_query"])
            respose = llm.invoke(filled)
            return {"tables": respose}

        return node
