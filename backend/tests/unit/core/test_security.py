"""
Unit tests for core/security.py

Tests password hashing and JWT token creation/verification
in complete isolation — no DB, no HTTP.
"""
import jwt
import pytest
from datetime import datetime, timezone

from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from core.config import SECRET_KEY, ALGORITHM


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        result = hash_password("mypassword")
        assert isinstance(result, str)

    def test_hash_is_not_plain_text(self):
        result = hash_password("mypassword")
        assert result != "mypassword"

    def test_same_password_produces_different_hashes(self):
        # bcrypt uses random salts so two hashes should never be equal
        hash1 = hash_password("mypassword")
        hash2 = hash_password("mypassword")
        assert hash1 != hash2

    def test_verify_correct_password_returns_true(self):
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_verify_wrong_password_returns_false(self):
        hashed = hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_verify_empty_password_returns_false(self):
        hashed = hash_password("mypassword")
        assert verify_password("", hashed) is False


class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token({"sub": "1"})
        assert isinstance(token, str)

    def test_token_contains_subject(self):
        token = create_access_token({"sub": "42"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "42"

    def test_token_contains_expiry(self):
        token = create_access_token({"sub": "1"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in decoded

    def test_token_expiry_is_in_future(self):
        token = create_access_token({"sub": "1"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = decoded["exp"]
        assert exp > datetime.now(timezone.utc).timestamp()

    def test_extra_payload_fields_are_preserved(self):
        token = create_access_token({"sub": "1", "role": "admin"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["role"] == "admin"


class TestCreateRefreshToken:
    def test_returns_string(self):
        token = create_refresh_token({"sub": "1"})
        assert isinstance(token, str)

    def test_token_contains_subject(self):
        token = create_refresh_token({"sub": "99"})
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "99"

    def test_refresh_token_expiry_longer_than_access_token(self):
        access = create_access_token({"sub": "1"})
        refresh = create_refresh_token({"sub": "1"})

        access_exp = jwt.decode(access, SECRET_KEY, algorithms=[ALGORITHM])["exp"]
        refresh_exp = jwt.decode(refresh, SECRET_KEY, algorithms=[ALGORITHM])["exp"]

        assert refresh_exp > access_exp
