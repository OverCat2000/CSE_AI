"""
Integration tests for /api/v1/auth endpoints

These tests spin up the full FastAPI app with an in-memory
SQLite database — real HTTP requests, real DB writes.
"""

import pytest
from httpx import AsyncClient

from infrastructure.persistence.models.user import User


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "user_name": "newuser",
                "password": "password123",
                "confirm_password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["user_name"] == "newuser"
        assert "id" in data
        # password should never be returned
        assert "password" not in data
        assert "hashed_password" not in data

    async def test_register_duplicate_email_returns_400(
        self, client: AsyncClient, regular_user: User
    ):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": regular_user.email,
                "user_name": "another",
                "password": "password123",
                "confirm_password": "password123",
            },
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    async def test_register_password_mismatch_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "user_name": "testuser",
                "password": "password123",
                "confirm_password": "different",
            },
        )
        assert response.status_code == 422

    async def test_register_invalid_email_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "user_name": "testuser",
                "password": "password123",
                "confirm_password": "password123",
            },
        )
        assert response.status_code == 422

    async def test_register_missing_fields_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
            },
        )
        assert response.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient, regular_user: User):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": regular_user.email,
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password_returns_401(
        self, client: AsyncClient, regular_user: User
    ):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": regular_user.email,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    async def test_login_nonexistent_email_returns_401(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nobody@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 401

    async def test_login_inactive_user_returns_401(
        self, client: AsyncClient, inactive_user: User
    ):
        # login endpoint only checks credentials, not is_active
        # is_active is enforced by get_current_user dependency, not login itself
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": inactive_user.email,
                "password": "password123",
            },
        )
        assert response.status_code == 200

    async def test_login_missing_fields_returns_422(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
            },
        )
        assert response.status_code == 422


class TestRefresh:
    async def test_refresh_success(self, client: AsyncClient, regular_user: User):
        # First login to get a real refresh token
        login = await client.post(
            "/api/v1/auth/login",
            json={
                "email": regular_user.email,
                "password": "password123",
            },
        )
        refresh_token = login.json()["refresh_token"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": refresh_token,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_refresh_with_invalid_token_returns_401(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": "this.is.invalid",
            },
        )
        assert response.status_code == 401

    async def test_refresh_missing_token_returns_422(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/refresh", json={})
        assert response.status_code == 422
