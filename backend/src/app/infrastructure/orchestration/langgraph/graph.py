from langgraph.graph import StateGraph, START, END
from .state import GraphState
from langchain_aws import ChatBedrockConverse
from typing import Dict, Any
from langchain_core.messages import BaseMessage


class LangGraphBuilder:
    def __init__(self, model_id: str, temperature: float, max_tokens: int):
        self.model_id = model_id
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.llm = ChatBedrockConverse(
            model=self.model_id,
            config={
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
            },
        )
        self.graph = StateGraph(GraphState)
        self._build()

    def _build(self) -> None:
        self.graph.add_node("chat", self._chat_node)
        self.graph.add_edge(START, "chat")
        self.graph.add_edge("chat", END)

    def _chat_node(self, state: GraphState) -> Dict[str, Any]:
        response: BaseMessage = self.llm.invoke(state["messages"])
        return {"messages": [response]}

    def compile(self):
        return self.graph.compile()
