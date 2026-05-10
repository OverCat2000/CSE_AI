from langgraph.graph import StateGraph, END
from .state import State
from .nodes import (
    root_node,
    schema_architect_node,
    MetricRetrieverFactory,
    TableSelectorFactory,
)
from nodes.base import NodeDependencies
from llm import LLMFactory
from prompts import PromptStore
from tools import ToolStore

prompts_store = PromptStore()
tool_store = ToolStore()

llm = LLMFactory.get_model("aws", "anthropic.claude-3-5-sonnet-20241022-v2:0")
table_selector_dependencies = NodeDependencies(
    llm=llm, tools=[], prompt=prompts_store.get("table_selector_node")
)
metric_retriever_dependencies = NodeDependencies(
    llm=llm, tools=tool_store.all(), prompt=prompts_store.get("metric_retriever_node")
)

workflow = StateGraph(State)

workflow.add_node("root", root_node)
workflow.add_node(
    "table_selector", TableSelectorFactory().build(table_selector_dependencies)
)
workflow.add_node(
    "metric_retriever", MetricRetrieverFactory().build(metric_retriever_dependencies)
)
workflow.add_node("schema_architect", schema_architect_node)

workflow.set_entry_point("root")

workflow.add_conditional_edges(
    "root", lambda state: ["table_selector_node", "metric_retriver_node"]
)

workflow.add_edge("table_selector", "schema_architect")
workflow.add_edge("metric_retriever", "schema_architect")

workflow.add_edge("schema_architect", END)

app = workflow.compile()
