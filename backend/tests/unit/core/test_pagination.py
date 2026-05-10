"""
Unit tests for core/pagination.py

Tests offset calculation and meta generation
in complete isolation — no DB, no HTTP.
"""
import pytest
from core.pagination import PaginationParam
from domain.shared.schemas import PaginationMeta


class TestPaginationParamOffset:
    def test_first_page_offset_is_zero(self):
        p = PaginationParam(page=1, page_size=20)
        assert p.offset == 0

    def test_second_page_offset(self):
        p = PaginationParam(page=2, page_size=20)
        assert p.offset == 20

    def test_third_page_offset(self):
        p = PaginationParam(page=3, page_size=10)
        assert p.offset == 20

    def test_custom_page_size_offset(self):
        p = PaginationParam(page=4, page_size=5)
        assert p.offset == 15


class TestPaginationParamMeta:
    def test_meta_returns_pagination_meta_instance(self):
        p = PaginationParam(page=1, page_size=20)
        result = p.meta(total=100)
        assert isinstance(result, PaginationMeta)

    def test_meta_total_is_correct(self):
        p = PaginationParam(page=1, page_size=20)
        result = p.meta(total=55)
        assert result.total == 55

    def test_meta_page_is_correct(self):
        p = PaginationParam(page=3, page_size=20)
        result = p.meta(total=100)
        assert result.page == 3

    def test_meta_page_size_is_correct(self):
        p = PaginationParam(page=1, page_size=15)
        result = p.meta(total=100)
        assert result.page_size == 15

    def test_meta_total_pages_rounds_up(self):
        p = PaginationParam(page=1, page_size=20)
        result = p.meta(total=21)  # 21 items / 20 per page = 2 pages
        assert result.total_pages == 2

    def test_meta_total_pages_exact_division(self):
        p = PaginationParam(page=1, page_size=20)
        result = p.meta(total=40)
        assert result.total_pages == 2

    def test_meta_total_pages_zero_when_no_items(self):
        p = PaginationParam(page=1, page_size=20)
        result = p.meta(total=0)
        assert result.total_pages == 0

    def test_meta_single_item(self):
        p = PaginationParam(page=1, page_size=20)
        result = p.meta(total=1)
        assert result.total_pages == 1
