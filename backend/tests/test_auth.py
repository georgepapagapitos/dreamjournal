import pytest


class TestRegistration:
    """Test user registration"""

    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "password123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["username"] == "newuser"
        assert "id" in data["user"]

    def test_register_duplicate_email(self, client, test_user):
        """Test registration with duplicate email fails"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": test_user["email"],
                "username": "different_user",
                "password": "password123",
            },
        )

        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_register_duplicate_username(self, client, test_user):
        """Test registration with duplicate username fails"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "different@example.com",
                "username": test_user["username"],
                "password": "password123",
            },
        )

        assert response.status_code == 400
        assert "Username already taken" in response.json()["detail"]

    def test_register_invalid_username_too_short(self, client):
        """Test registration with too short username fails"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "ab",
                "password": "password123",
            },
        )

        assert response.status_code == 400
        assert "3-20 characters" in response.json()["detail"]

    def test_register_invalid_username_too_long(self, client):
        """Test registration with too long username fails"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "a" * 21,
                "password": "password123",
            },
        )

        assert response.status_code == 400

    def test_register_invalid_username_special_chars(self, client):
        """Test registration with invalid characters fails"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "user@name",
                "password": "password123",
            },
        )

        assert response.status_code == 400

    def test_register_valid_username_with_underscore(self, client):
        """Test that usernames with underscores are valid"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "test_user",
                "password": "password123",
            },
        )

        assert response.status_code == 200

    def test_register_valid_username_with_dash(self, client):
        """Test that usernames with dashes are valid"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "test-user",
                "password": "password123",
            },
        )

        assert response.status_code == 200

    def test_register_short_password(self, client):
        """Test registration with short password fails"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "short",
            },
        )

        assert response.status_code == 400
        assert "at least 8 characters" in response.json()["detail"]


class TestLogin:
    """Test user login"""

    def test_login_success(self, client, test_user):
        """Test successful login"""
        response = client.post(
            "/api/auth/login",
            json={"email": test_user["email"], "password": test_user["password"]},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_user["email"]
        assert data["user"]["username"] == test_user["username"]

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password fails"""
        response = client.post(
            "/api/auth/login",
            json={"email": test_user["email"], "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent email fails"""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"},
        )

        assert response.status_code == 401


class TestCurrentUser:
    """Test getting current user information"""

    def test_get_current_user(self, client, test_user, auth_headers):
        """Test getting current user info"""
        response = client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user["id"]
        assert data["email"] == test_user["email"]
        assert data["username"] == test_user["username"]
        assert "created_at" in data

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without auth fails"""
        response = client.get("/api/auth/me")

        assert response.status_code == 403

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token fails"""
        response = client.get(
            "/api/auth/me", headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == 401


class TestPasswordChange:
    """Test password change functionality"""

    def test_change_password_success(self, client, test_user, auth_headers):
        """Test changing password"""
        response = client.put(
            "/api/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": test_user["password"],
                "new_password": "newpassword123",
            },
        )

        assert response.status_code == 200
        assert response.json()["success"] is True

        # Verify can login with new password
        login_response = client.post(
            "/api/auth/login",
            json={"email": test_user["email"], "password": "newpassword123"},
        )
        assert login_response.status_code == 200

        # Verify cannot login with old password
        old_login = client.post(
            "/api/auth/login",
            json={"email": test_user["email"], "password": test_user["password"]},
        )
        assert old_login.status_code == 401

    def test_change_password_wrong_current(self, client, auth_headers):
        """Test changing password with wrong current password fails"""
        response = client.put(
            "/api/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123",
            },
        )

        assert response.status_code == 401
        assert "Current password is incorrect" in response.json()["detail"]

    def test_change_password_too_short(self, client, test_user, auth_headers):
        """Test changing to short password fails"""
        response = client.put(
            "/api/auth/change-password",
            headers=auth_headers,
            json={"current_password": test_user["password"], "new_password": "short"},
        )

        assert response.status_code == 400
        assert "at least 8 characters" in response.json()["detail"]

    def test_change_password_unauthorized(self, client):
        """Test changing password without auth fails"""
        response = client.put(
            "/api/auth/change-password",
            json={"current_password": "oldpass", "new_password": "newpass123"},
        )

        assert response.status_code == 403


class TestUsernameChange:
    """Test username change functionality"""

    def test_change_username_success(self, client, test_user, auth_headers):
        """Test changing username"""
        response = client.put(
            "/api/auth/change-username",
            headers=auth_headers,
            json={"username": "newusername"},
        )

        assert response.status_code == 200
        assert response.json()["username"] == "newusername"

        # Verify new username works for login
        login_response = client.post(
            "/api/auth/login",
            json={"email": test_user["email"], "password": test_user["password"]},
        )
        assert login_response.json()["user"]["username"] == "newusername"

    def test_change_username_invalid_too_short(self, client, auth_headers):
        """Test changing to invalid username fails"""
        response = client.put(
            "/api/auth/change-username", headers=auth_headers, json={"username": "a"}
        )

        assert response.status_code == 400

    def test_change_username_invalid_too_long(self, client, auth_headers):
        """Test changing to too long username fails"""
        response = client.put(
            "/api/auth/change-username",
            headers=auth_headers,
            json={"username": "a" * 21},
        )

        assert response.status_code == 400

    def test_change_username_taken(self, client, auth_headers, second_user):
        """Test changing to taken username fails"""
        response = client.put(
            "/api/auth/change-username",
            headers=auth_headers,
            json={"username": second_user["username"]},
        )

        assert response.status_code == 400
        assert "already taken" in response.json()["detail"]

    def test_change_username_unauthorized(self, client):
        """Test changing username without auth fails"""
        response = client.put(
            "/api/auth/change-username", json={"username": "newusername"}
        )

        assert response.status_code == 403


class TestAccountDeletion:
    """Test account deletion"""

    def test_delete_account_success(self, client, test_user, auth_headers):
        """Test deleting account"""
        response = client.delete("/api/auth/delete-account", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["success"] is True

        # Verify cannot login after deletion
        login_response = client.post(
            "/api/auth/login",
            json={"email": test_user["email"], "password": test_user["password"]},
        )
        assert login_response.status_code == 401

    def test_delete_account_deletes_dreams(self, client, test_user, auth_headers):
        """Test deleting account also deletes user's dreams"""
        from backend.database import get_db

        # Create a dream
        client.post("/api/dreams", headers=auth_headers, json={"body": "Test dream"})

        # Delete account
        client.delete("/api/auth/delete-account", headers=auth_headers)

        # Verify dreams are deleted
        conn = get_db()
        dreams = conn.execute(
            "SELECT * FROM dreams WHERE user_id = ?", (test_user["id"],)
        ).fetchall()
        conn.close()

        assert len(dreams) == 0

    def test_delete_account_unauthorized(self, client):
        """Test deleting account without auth fails"""
        response = client.delete("/api/auth/delete-account")

        assert response.status_code == 403
