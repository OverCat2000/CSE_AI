"""
Unit tests for domain/users/schemas.py

Tests Pydantic schema validation logic — no DB, no HTTP.
"""
import pytest
from datetime import datetime, timezone, timedelta
from pydantic import ValidationError

from domain.users.schemas import (
    UserRegister,
    UserLogin,
    UserAdminView,
    UserResponse,
    TokenResponse,
    RefreshRequest,
)


class TestUserRegister:
    def test_valid_registration(self):
        user = UserRegister(
            email="test@example.com",
            user_name="testuser",
            password="password123",
            confirm_password="password123",
        )
        assert user.email == "test@example.com"
        assert user.user_name == "testuser"

    def test_passwords_mismatch_raises_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            UserRegister(
                email="test@example.com",
                user_name="testuser",
                password="password123",
                confirm_password="different",
            )
        assert "Passwords do not match" in str(exc_info.value)

    def test_invalid_email_raises_validation_error(self):
        with pytest.raises(ValidationError):
            UserRegister(
                email="not-an-email",
                user_name="testuser",
                password="password123",
                confirm_password="password123",
            )

    def test_missing_required_fields_raises_validation_error(self):
        with pytest.raises(ValidationError):
            UserRegister(email="test@example.com")  # type: ignore


class TestUserLogin:
    def test_valid_login(self):
        login = UserLogin(email="test@example.com", password="password123")
        assert login.email == "test@example.com"
        assert login.password == "password123"

    def test_invalid_email_raises_error(self):
        with pytest.raises(ValidationError):
            UserLogin(email="bademail", password="password123")


class TestUserAdminView:
    def _base_data(self, **kwargs):
        data = {
            "id": 1,
            "email": "user@example.com",
            "user_name": "testuser",
            "role": "user",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "last_seen": None,
        }
        data.update(kwargs)
        return data

    def test_valid_admin_view(self):
        view = UserAdminView(**self._base_data())
        assert view.id == 1
        assert view.email == "user@example.com"

    def test_is_online_false_when_last_seen_is_none(self):
        view = UserAdminView(**self._base_data(last_seen=None))
        assert view.is_online is False

    def test_is_online_true_when_recently_seen(self):
        recent = datetime.now(timezone.utc) - timedelta(minutes=1)
        view = UserAdminView(**self._base_data(last_seen=recent))
        assert view.is_online is True

    def test_is_online_false_when_seen_long_ago(self):
        old = datetime.now(timezone.utc) - timedelta(minutes=10)
        view = UserAdminView(**self._base_data(last_seen=old))
        assert view.is_online is False

    def test_is_online_exactly_at_threshold_is_false(self):
        # Exactly 5 minutes ago is NOT online (threshold is < 5 minutes)
        threshold = datetime.now(timezone.utc) - timedelta(minutes=5)
        view = UserAdminView(**self._base_data(last_seen=threshold))
        assert view.is_online is False


class TestTokenResponse:
    def test_default_token_type_is_bearer(self):
        token = TokenResponse(access_token="abc123")
        assert token.token_type == "bearer"

    def test_refresh_token_is_optional(self):
        token = TokenResponse(access_token="abc123")
        assert token.refresh_token is None

    def test_with_refresh_token(self):
        token = TokenResponse(access_token="abc123", refresh_token="refresh456")
        assert token.refresh_token == "refresh456"


class TestRefreshRequest:
    def test_valid_refresh_request(self):
        req = RefreshRequest(refresh_token="sometoken")
        assert req.refresh_token == "sometoken"

    def test_missing_token_raises_error(self):
        with pytest.raises(ValidationError):
            RefreshRequest()  # type: ignore
