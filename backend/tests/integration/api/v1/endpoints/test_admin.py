"""
Integration tests for /api/v1/admin endpoints

Tests admin-only access control and user management
with a real in-memory database.
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.persistence.models.user import User
from core.security import hash_password


class TestGetAllUsers:
    async def test_admin_can_list_users(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.get("/api/v1/admin/users", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "meta" in data
        assert isinstance(data["data"], list)

    async def test_response_includes_pagination_meta(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.get("/api/v1/admin/users", headers=admin_headers)
        meta = response.json()["meta"]
        assert "total" in meta
        assert "page" in meta
        assert "page_size" in meta
        assert "total_pages" in meta

    async def test_regular_user_cannot_list_users(
        self, client: AsyncClient, regular_user: User, auth_headers: dict
    ):
        response = await client.get("/api/v1/admin/users", headers=auth_headers)
        assert response.status_code == 403

    async def test_unauthenticated_request_returns_401(self, client: AsyncClient):
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == 401

    async def test_pagination_page_param(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.get(
            "/api/v1/admin/users?page=1&page_size=5", headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["meta"]["page"] == 1
        assert response.json()["meta"]["page_size"] == 5

    async def test_user_response_includes_is_online_field(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.get("/api/v1/admin/users", headers=admin_headers)
        users = response.json()["data"]
        assert len(users) > 0
        assert "is_online" in users[0]

    async def test_password_not_exposed_in_list(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.get("/api/v1/admin/users", headers=admin_headers)
        for user in response.json()["data"]:
            assert "hashed_password" not in user
            assert "password" not in user


class TestGetUserDetail:
    async def test_admin_can_get_user_by_id(
        self, client: AsyncClient, admin_user: User, regular_user: User, admin_headers: dict
    ):
        response = await client.get(
            f"/api/v1/admin/users/{regular_user.id}", headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == regular_user.id
        assert data["email"] == regular_user.email

    async def test_nonexistent_user_returns_404(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.get(
            "/api/v1/admin/users/99999", headers=admin_headers
        )
        assert response.status_code == 404

    async def test_regular_user_cannot_get_user_detail(
        self, client: AsyncClient, regular_user: User, auth_headers: dict
    ):
        response = await client.get(
            f"/api/v1/admin/users/{regular_user.id}", headers=auth_headers
        )
        assert response.status_code == 403

    async def test_unauthenticated_returns_401(self, client: AsyncClient, regular_user: User):
        response = await client.get(f"/api/v1/admin/users/{regular_user.id}")
        assert response.status_code == 401


class TestDeactivateUser:
    async def test_admin_can_deactivate_user(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user: User,
        admin_headers: dict,
    ):
        # Create a fresh user to deactivate
        target = User(
            email="todeactivate@example.com",
            user_name="todeactivate",
            hashed_password=hash_password("password123"),
            role="user",
            is_active=True,
        )
        db_session.add(target)
        await db_session.commit()
        await db_session.refresh(target)

        response = await client.patch(
            f"/api/v1/admin/users/{target.id}/deactivate", headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    async def test_admin_cannot_deactivate_themselves(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{admin_user.id}/deactivate", headers=admin_headers
        )
        assert response.status_code == 400
        assert "Cannot deactivate yourself" in response.json()["detail"]

    async def test_deactivate_nonexistent_user_returns_404(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.patch(
            "/api/v1/admin/users/99999/deactivate", headers=admin_headers
        )
        assert response.status_code == 404

    async def test_regular_user_cannot_deactivate(
        self, client: AsyncClient, regular_user: User, auth_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{regular_user.id}/deactivate", headers=auth_headers
        )
        assert response.status_code == 403


class TestActivateUser:
    async def test_admin_can_activate_user(
        self, client: AsyncClient, admin_user: User, inactive_user: User, admin_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{inactive_user.id}/activate", headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is True

    async def test_activate_nonexistent_user_returns_404(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.patch(
            "/api/v1/admin/users/99999/activate", headers=admin_headers
        )
        assert response.status_code == 404

    async def test_regular_user_cannot_activate(
        self, client: AsyncClient, regular_user: User, auth_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{regular_user.id}/activate", headers=auth_headers
        )
        assert response.status_code == 403


class TestUpdateUserRole:
    async def test_admin_can_promote_user(
        self, client: AsyncClient, admin_user: User, regular_user: User, admin_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{regular_user.id}/role",
            json={"role": "admin"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"

    async def test_admin_cannot_change_own_role(
        self, client: AsyncClient, admin_user: User, admin_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{admin_user.id}/role",
            json={"role": "user"},
            headers=admin_headers,
        )
        assert response.status_code == 400

    async def test_invalid_role_returns_422(
        self, client: AsyncClient, admin_user: User, regular_user: User, admin_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{regular_user.id}/role",
            json={"role": "superuser"},
            headers=admin_headers,
        )
        assert response.status_code == 422

    async def test_regular_user_cannot_change_role(
        self, client: AsyncClient, regular_user: User, auth_headers: dict
    ):
        response = await client.patch(
            f"/api/v1/admin/users/{regular_user.id}/role",
            json={"role": "admin"},
            headers=auth_headers,
        )
        assert response.status_code == 403


class TestStats:
    async def test_admin_can_get_stats(
        self, client: AsyncClient, admin_user: User, regular_user: User, admin_headers: dict
    ):
        response = await client.get("/api/v1/admin/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert data["admins"] >= 1
        assert set(data) == {"total", "active", "admins", "online"}

    async def test_regular_user_cannot_get_stats(
        self, client: AsyncClient, regular_user: User, auth_headers: dict
    ):
        response = await client.get("/api/v1/admin/stats", headers=auth_headers)
        assert response.status_code == 403


class TestSearchAndFilter:
    async def test_filter_by_is_active(
        self, client: AsyncClient, admin_user: User, inactive_user: User, admin_headers: dict
    ):
        response = await client.get(
            "/api/v1/admin/users?is_active=false", headers=admin_headers
        )
        assert response.status_code == 200
        users = response.json()["data"]
        assert all(u["is_active"] is False for u in users)

    async def test_search_by_email(
        self, client: AsyncClient, admin_user: User, regular_user: User, admin_headers: dict
    ):
        response = await client.get(
            "/api/v1/admin/users?search=user@example.com", headers=admin_headers
        )
        assert response.status_code == 200
        emails = [u["email"] for u in response.json()["data"]]
        assert regular_user.email in emails
        assert admin_user.email not in emails
