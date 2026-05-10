from typing_extensions import TypedDict
from typing import Annotated
from pydantic import BaseModel
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


class Metric(BaseModel):
    name: str
    sql_template: str
    related_tables: list[str]


class State(TypedDict):
    user_query: str
    restructured_user_query: str
    tables: list[str]
    metrics: list[Metric]
    messages: Annotated[list[AnyMessage], add_messages]
