from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class ToolEntry:
    name: str
    fn: Callable[..., Any]
    description: str
    tags: list[str] = field(default_factory=list)

    def __repr__(self):
        return f"ToolEntry(name={self.name!r}, tags={self.tags})"


class ToolStore:
    _instance: "ToolStore | None" = None
    _registry: dict[str, ToolEntry]

    def __new__(cls) -> "ToolStore":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._registry = {}

        return cls._instance

    def register(self, entry: ToolEntry) -> None:
        if entry.name in self._registry:
            raise ValueError(f"{entry.name} is already registered.")
        self._registry[entry.name] = entry

    def get(self, name: str) -> ToolEntry:
        try:
            return self._registry[name]
        except KeyError:
            raise KeyError(f"Tool {name} not found.")

    def list(self) -> list[str]:
        return list(self._registry.keys())

    def all(self) -> list[ToolEntry]:
        return list(self._registry.values())

    def __repr__(self) -> str:
        return f"ToolStore(tools={self.list()})"
