from .base import BaseNodeFactory, NodeDependencies, NodeCallable
from ..state import State


class MetricRetrieverFactory(BaseNodeFactory):
    def build(self, deps: NodeDependencies) -> NodeCallable:
        llm_with_tools = deps.llm.bind_tools([entry.fn for entry in deps.tools])
        prompt = deps.prompt

        def node(state: State) -> dict:
            filled = prompt.render(query=state["restructured_user_query"])
            response = llm_with_tools.invoke(filled)
            return {"metrics": [response]}

        return node
