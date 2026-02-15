import os
import tempfile

import pytest
from fastapi.testclient import TestClient


# Set test database to a temporary location before importing the app
@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Set up test environment variables"""
    # Create a temporary directory for test database
    temp_dir = tempfile.mkdtemp()
    test_db_path = os.path.join(temp_dir, "test_dreams.db")
    os.environ["DB_PATH"] = test_db_path
    os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
    yield
    # Cleanup after all tests
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    os.rmdir(temp_dir)


@pytest.fixture(scope="function")
def client():
    """
    Create a test client with a fresh database for each test.

    This fixture:
    1. Creates a clean database for each test
    2. Provides a TestClient for making API requests
    3. Cleans up after the test completes

    Usage:
        def test_something(client):
            response = client.get("/api/endpoint")
            assert response.status_code == 200
    """
    # Import here to ensure env vars are set first
    from backend.database import init_db
    from backend.main import app

    # Get the database path from environment
    db_path = os.environ.get("DB_PATH")

    # Remove existing database if it exists to ensure fresh state
    if db_path and os.path.exists(db_path):
        os.remove(db_path)

    # Initialize fresh database
    init_db()

    # Create test client
    with TestClient(app) as test_client:
        yield test_client

    # Database cleanup happens in setup_test_env


@pytest.fixture
def test_user(client):
    """
    Create a test user and return their credentials and token.

    Returns:
        dict: {
            "id": user_id,
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123",
            "token": "jwt_token_here"
        }

    Usage:
        def test_protected_endpoint(client, test_user):
            headers = {"Authorization": f"Bearer {test_user['token']}"}
            response = client.get("/api/auth/me", headers=headers)
    """
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123",
    }

    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 200, f"Failed to create test user: {response.text}"

    data = response.json()
    return {
        "id": data["user"]["id"],
        "email": user_data["email"],
        "username": user_data["username"],
        "password": user_data["password"],
        "token": data["access_token"],
    }


@pytest.fixture
def auth_headers(test_user):
    """
    Return authorization headers for authenticated requests.

    This is a convenience fixture that automatically includes
    the Bearer token in the Authorization header.

    Usage:
        def test_create_dream(client, auth_headers):
            response = client.post("/api/dreams",
                headers=auth_headers,
                json={"body": "My dream"}
            )
    """
    return {"Authorization": f"Bearer {test_user['token']}"}


@pytest.fixture
def sample_dream():
    """
    Return sample dream data for testing.

    Usage:
        def test_create_dream(client, auth_headers, sample_dream):
            response = client.post("/api/dreams",
                headers=auth_headers,
                json=sample_dream
            )
    """
    return {
        "title": "Flying Dream",
        "body": "I was flying over the ocean, feeling completely free",
        "mood": "joyful",
        "lucidity": 7,
        "sleep_quality": 8,
        "tags": ["flying", "ocean", "lucid"],
        "dream_date": "2024-01-15",
    }


@pytest.fixture
def second_user(client):
    """
    Create a second test user for testing multi-user scenarios.

    Useful for testing data isolation between users.
    """
    user_data = {
        "email": "user2@example.com",
        "username": "user2",
        "password": "password123",
    }

    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 200

    data = response.json()
    return {
        "id": data["user"]["id"],
        "email": user_data["email"],
        "username": user_data["username"],
        "password": user_data["password"],
        "token": data["access_token"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


# Configure pytest
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
