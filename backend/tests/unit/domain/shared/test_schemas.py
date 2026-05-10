"""
Unit tests for domain/shared/schemas.py
"""
import pytest
from pydantic import ValidationError
from domain.shared.schemas import PaginationMeta, PaginatedResponse


class TestPaginationMeta:
    def test_valid_pagination_meta(self):
        meta = PaginationMeta(total=100, page=1, page_size=20, total_pages=5)
        assert meta.total == 100
        assert meta.page == 1
        assert meta.page_size == 20
        assert meta.total_pages == 5

    def test_missing_field_raises_error(self):
        with pytest.raises(ValidationError):
            PaginationMeta(total=100, page=1, page_size=20)  # type: ignore

    def test_zero_values_are_valid(self):
        meta = PaginationMeta(total=0, page=1, page_size=20, total_pages=0)
        assert meta.total == 0
        assert meta.total_pages == 0


class TestPaginatedResponse:
    def test_valid_paginated_response(self):
        meta = PaginationMeta(total=1, page=1, page_size=20, total_pages=1)
        response = PaginatedResponse(data=[{"id": 1}], meta=meta)
        assert len(response.data) == 1

    def test_empty_data_list_is_valid(self):
        meta = PaginationMeta(total=0, page=1, page_size=20, total_pages=0)
        response = PaginatedResponse(data=[], meta=meta)
        assert response.data == []
