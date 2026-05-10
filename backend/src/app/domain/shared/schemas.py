from pydantic import BaseModel
from datetime import datetime


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedResponse(BaseModel):
    data: list
    meta: PaginationMeta
