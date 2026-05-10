"""
Unit tests for infrastructure/persistence/models

Tests that models have the correct columns and types
without needing a real database connection.
"""
import pytest
from sqlalchemy import inspect as sa_inspect

from infrastructure.persistence.models.user import User
from infrastructure.persistence.models.sessions import Session


class TestUserModel:
    def test_user_has_correct_tablename(self):
        assert User.__tablename__ == "users"

    def test_user_has_expected_columns(self):
        mapper = sa_inspect(User)
        column_names = {col.key for col in mapper.columns}
        expected = {"id", "email", "user_name", "hashed_password", "role", "is_active", "last_seen", "created_at"}
        assert expected == column_names

    def test_user_id_is_primary_key(self):
        mapper = sa_inspect(User)
        pk_cols = {col.key for col in mapper.primary_key}
        assert "id" in pk_cols

    def test_user_email_is_unique(self):
        mapper = sa_inspect(User)
        email_col = mapper.columns["email"]
        assert email_col.unique is True

    def test_user_last_seen_is_nullable(self):
        mapper = sa_inspect(User)
        last_seen_col = mapper.columns["last_seen"]
        assert last_seen_col.nullable is True

    def test_user_role_has_default(self):
        mapper = sa_inspect(User)
        role_col = mapper.columns["role"]
        assert role_col.server_default is not None

    def test_user_is_active_has_default(self):
        mapper = sa_inspect(User)
        is_active_col = mapper.columns["is_active"]
        assert is_active_col.server_default is not None


class TestSessionModel:
    def test_session_has_correct_tablename(self):
        assert Session.__tablename__ == "sessions"

    def test_session_has_expected_columns(self):
        mapper = sa_inspect(Session)
        column_names = {col.key for col in mapper.columns}
        expected = {"id", "user_id", "refresh_token", "ip_address", "user_agent", "created_at", "expires_at"}
        assert expected == column_names

    def test_session_id_is_primary_key(self):
        mapper = sa_inspect(Session)
        pk_cols = {col.key for col in mapper.primary_key}
        assert "id" in pk_cols

    def test_session_ip_address_is_nullable(self):
        mapper = sa_inspect(Session)
        col = mapper.columns["ip_address"]
        assert col.nullable is True

    def test_session_user_agent_is_nullable(self):
        mapper = sa_inspect(Session)
        col = mapper.columns["user_agent"]
        assert col.nullable is True

    def test_session_expires_at_is_not_nullable(self):
        mapper = sa_inspect(Session)
        col = mapper.columns["expires_at"]
        assert col.nullable is False
