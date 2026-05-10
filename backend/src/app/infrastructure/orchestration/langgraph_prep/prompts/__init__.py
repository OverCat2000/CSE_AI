from __future__ import annotations
from domain.prompts import PromptEntry, PromptNotFound


class PromptStore:
    _instance: "PromptStore | None" = None
    _cache: dict[tuple[str, str], PromptEntry]

    def __new__(cls) -> "PromptStore":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._cache = {}
        return cls._instance

    def load(self, entries: list[PromptEntry]) -> None:
        self._cache = {(e.node, e.variant): e for e in entries}

    def get(self, node: str, variant: str = "default") -> PromptEntry:
        try:
            return self._cache[(node, variant)]
        except KeyError:
            raise PromptNotFound(node, variant)

    def set(self, entry: PromptEntry) -> None:
        self._cache[(entry.node, entry.variant)] = entry

    def remove(self, node: str, variant: str) -> None:
        self._cache.pop((node, variant), None)

    def all(self) -> list[PromptEntry]:
        return list(self._cache.values())

    def __repr__(self) -> str:
        return f"PromptStore(prompts={list(self._cache.keys())})"
