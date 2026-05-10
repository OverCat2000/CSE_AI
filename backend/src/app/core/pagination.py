from fastapi import Query
from dataclasses import dataclass
from math import ceil
from domain.shared.schemas import PaginationMeta


@dataclass
class PaginationParam:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    def meta(self, total: int) -> PaginationMeta:
        return PaginationMeta(
            total=total,
            page=self.page,
            page_size=self.page_size,
            total_pages=ceil(total / self.page_size) if total > 0 else 0,
        )


def paginate(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
) -> PaginationParam:
    return PaginationParam(page=page, page_size=page_size)
