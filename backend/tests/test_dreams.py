import pytest


class TestCreateDream:
    """Test dream creation"""

    def test_create_dream_minimal(self, client, auth_headers):
        """Test creating dream with minimal data"""
        response = client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "I was flying over the ocean"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["body"] == "I was flying over the ocean"
        assert "id" in data
        assert "created_at" in data
        assert data["tags"] == []

    def test_create_dream_full(self, client, auth_headers, sample_dream):
        """Test creating dream with all fields"""
        response = client.post("/api/dreams", headers=auth_headers, json=sample_dream)

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == sample_dream["title"]
        assert data["body"] == sample_dream["body"]
        assert data["mood"] == sample_dream["mood"]
        assert data["lucidity"] == sample_dream["lucidity"]
        assert data["sleep_quality"] == sample_dream["sleep_quality"]
        assert data["tags"] == sample_dream["tags"]
        assert data["dream_date"] == sample_dream["dream_date"]

    def test_create_dream_default_date(self, client, auth_headers):
        """Test dream gets current date if not specified"""
        from datetime import datetime, timezone

        response = client.post(
            "/api/dreams", headers=auth_headers, json={"body": "Test dream"}
        )

        assert response.status_code == 201
        data = response.json()
        # Should have today's date
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        assert data["dream_date"] == today

    def test_create_dream_unauthorized(self, client):
        """Test creating dream without auth fails"""
        response = client.post("/api/dreams", json={"body": "Test dream"})

        assert response.status_code == 403


class TestGetDream:
    """Test getting individual dreams"""

    def test_get_dream_success(self, client, auth_headers):
        """Test getting a specific dream"""
        # Create dream
        create_response = client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Test dream", "title": "Test"},
        )
        dream_id = create_response.json()["id"]

        # Get dream
        response = client.get(f"/api/dreams/{dream_id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == dream_id
        assert data["body"] == "Test dream"
        assert data["title"] == "Test"

    def test_get_dream_not_found(self, client, auth_headers):
        """Test getting nonexistent dream fails"""
        response = client.get("/api/dreams/99999", headers=auth_headers)

        assert response.status_code == 404

    def test_get_dream_other_user(self, client, auth_headers, second_user):
        """Test cannot get another user's dream"""
        # Create dream as second user
        dream_response = client.post(
            "/api/dreams",
            headers=second_user["headers"],
            json={"body": "User 2's dream"},
        )
        dream_id = dream_response.json()["id"]

        # Try to get with first user's token
        response = client.get(f"/api/dreams/{dream_id}", headers=auth_headers)

        assert response.status_code == 404

    def test_get_dream_unauthorized(self, client):
        """Test getting dream without auth fails"""
        response = client.get("/api/dreams/1")

        assert response.status_code == 403


class TestListDreams:
    """Test listing and filtering dreams"""

    def test_list_dreams_empty(self, client, auth_headers):
        """Test listing dreams when user has none"""
        response = client.get("/api/dreams", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_list_dreams_multiple(self, client, auth_headers):
        """Test listing multiple dreams"""
        # Create multiple dreams
        for i in range(3):
            client.post(
                "/api/dreams", headers=auth_headers, json={"body": f"Dream {i}"}
            )

        response = client.get("/api/dreams", headers=auth_headers)

        assert response.status_code == 200
        dreams = response.json()
        assert len(dreams) == 3

    def test_list_dreams_ordered_by_date(self, client, auth_headers):
        """Test dreams are ordered by created_at DESC"""
        # Create dreams
        r1 = client.post("/api/dreams", headers=auth_headers, json={"body": "First"})
        r2 = client.post("/api/dreams", headers=auth_headers, json={"body": "Second"})
        r3 = client.post("/api/dreams", headers=auth_headers, json={"body": "Third"})

        response = client.get("/api/dreams", headers=auth_headers)
        dreams = response.json()

        # Should be in reverse order (newest first)
        assert dreams[0]["body"] == "Third"
        assert dreams[1]["body"] == "Second"
        assert dreams[2]["body"] == "First"

    def test_list_dreams_search_title(self, client, auth_headers):
        """Test searching dreams by title"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"title": "Flying Dream", "body": "I was flying"},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"title": "Ocean Dream", "body": "Swimming"},
        )

        response = client.get("/api/dreams?search=flying", headers=auth_headers)

        assert response.status_code == 200
        dreams = response.json()
        assert len(dreams) == 1
        assert "flying" in dreams[0]["title"].lower()

    def test_list_dreams_search_body(self, client, auth_headers):
        """Test searching dreams by body content"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "I was flying over mountains"},
        )
        client.post(
            "/api/dreams", headers=auth_headers, json={"body": "Swimming in ocean"}
        )

        response = client.get("/api/dreams?search=mountains", headers=auth_headers)

        dreams = response.json()
        assert len(dreams) == 1
        assert "mountains" in dreams[0]["body"]

    def test_list_dreams_filter_mood(self, client, auth_headers):
        """Test filtering dreams by mood"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Happy dream", "mood": "joyful"},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Scary dream", "mood": "fearful"},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Neutral dream", "mood": "neutral"},
        )

        response = client.get("/api/dreams?mood=joyful", headers=auth_headers)

        dreams = response.json()
        assert len(dreams) == 1
        assert dreams[0]["mood"] == "joyful"

    def test_list_dreams_filter_tag(self, client, auth_headers):
        """Test filtering dreams by tag"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 1", "tags": ["flying", "ocean"]},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 2", "tags": ["running", "forest"]},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 3", "tags": ["flying", "mountains"]},
        )

        response = client.get("/api/dreams?tag=flying", headers=auth_headers)

        dreams = response.json()
        assert len(dreams) == 2
        for dream in dreams:
            assert "flying" in dream["tags"]

    def test_list_dreams_pagination(self, client, auth_headers):
        """Test dream pagination"""
        # Create 10 dreams
        for i in range(10):
            client.post(
                "/api/dreams", headers=auth_headers, json={"body": f"Dream {i}"}
            )

        # Get first 5
        response = client.get("/api/dreams?limit=5&offset=0", headers=auth_headers)
        assert len(response.json()) == 5

        # Get next 5
        response = client.get("/api/dreams?limit=5&offset=5", headers=auth_headers)
        assert len(response.json()) == 5

        # Get with offset beyond total
        response = client.get("/api/dreams?limit=5&offset=20", headers=auth_headers)
        assert len(response.json()) == 0

    def test_list_dreams_combined_filters(self, client, auth_headers):
        """Test using multiple filters together"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={
                "title": "Flying Dream",
                "body": "I was flying",
                "mood": "joyful",
                "tags": ["flying"],
            },
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={
                "title": "Ocean Dream",
                "body": "Swimming",
                "mood": "peaceful",
                "tags": ["swimming"],
            },
        )

        response = client.get(
            "/api/dreams?search=flying&mood=joyful&tag=flying", headers=auth_headers
        )

        dreams = response.json()
        assert len(dreams) == 1
        assert dreams[0]["mood"] == "joyful"

    def test_list_dreams_user_isolation(self, client, auth_headers, second_user):
        """Test users only see their own dreams"""
        # User 1 creates dreams
        client.post("/api/dreams", headers=auth_headers, json={"body": "User 1 dream"})

        # User 2 creates dreams
        client.post(
            "/api/dreams", headers=second_user["headers"], json={"body": "User 2 dream"}
        )

        # Each user should only see their own
        user1_dreams = client.get("/api/dreams", headers=auth_headers).json()
        assert len(user1_dreams) == 1
        assert user1_dreams[0]["body"] == "User 1 dream"

        user2_dreams = client.get("/api/dreams", headers=second_user["headers"]).json()
        assert len(user2_dreams) == 1
        assert user2_dreams[0]["body"] == "User 2 dream"


class TestUpdateDream:
    """Test updating dreams"""

    def test_update_dream_full(self, client, auth_headers):
        """Test updating all dream fields"""
        # Create dream
        create_response = client.post(
            "/api/dreams", headers=auth_headers, json={"body": "Original body"}
        )
        dream_id = create_response.json()["id"]

        # Update dream
        response = client.put(
            f"/api/dreams/{dream_id}",
            headers=auth_headers,
            json={
                "title": "New Title",
                "body": "Updated body",
                "mood": "joyful",
                "lucidity": 8,
                "tags": ["new-tag"],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Title"
        assert data["body"] == "Updated body"
        assert data["mood"] == "joyful"
        assert data["lucidity"] == 8
        assert data["tags"] == ["new-tag"]

    def test_update_dream_partial(self, client, auth_headers):
        """Test partial update of dream"""
        create_response = client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Original", "mood": "neutral", "title": "Original Title"},
        )
        dream_id = create_response.json()["id"]

        # Update only mood
        response = client.put(
            f"/api/dreams/{dream_id}", headers=auth_headers, json={"mood": "joyful"}
        )

        data = response.json()
        assert data["body"] == "Original"
        assert data["title"] == "Original Title"
        assert data["mood"] == "joyful"

    def test_update_dream_empty_update(self, client, auth_headers):
        """Test updating dream with no changes returns original"""
        create_response = client.post(
            "/api/dreams", headers=auth_headers, json={"body": "Original"}
        )
        dream_id = create_response.json()["id"]

        response = client.put(f"/api/dreams/{dream_id}", headers=auth_headers, json={})

        assert response.status_code == 200
        assert response.json()["body"] == "Original"

    def test_update_dream_not_found(self, client, auth_headers):
        """Test updating nonexistent dream fails"""
        response = client.put(
            "/api/dreams/99999", headers=auth_headers, json={"body": "Updated"}
        )

        assert response.status_code == 404

    def test_update_dream_other_user(self, client, auth_headers, second_user):
        """Test cannot update another user's dream"""
        # Create dream as user 2
        dream_response = client.post(
            "/api/dreams",
            headers=second_user["headers"],
            json={"body": "User 2's dream"},
        )
        dream_id = dream_response.json()["id"]

        # Try to update as user 1
        response = client.put(
            f"/api/dreams/{dream_id}", headers=auth_headers, json={"body": "Hacked"}
        )

        assert response.status_code == 404

    def test_update_dream_unauthorized(self, client):
        """Test updating dream without auth fails"""
        response = client.put("/api/dreams/1", json={"body": "Updated"})

        assert response.status_code == 403


class TestDeleteDream:
    """Test deleting dreams"""

    def test_delete_dream_success(self, client, auth_headers):
        """Test deleting a dream"""
        # Create dream
        create_response = client.post(
            "/api/dreams", headers=auth_headers, json={"body": "To be deleted"}
        )
        dream_id = create_response.json()["id"]

        # Delete dream
        response = client.delete(f"/api/dreams/{dream_id}", headers=auth_headers)

        assert response.status_code == 204

        # Verify deleted
        get_response = client.get(f"/api/dreams/{dream_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_dream_not_found(self, client, auth_headers):
        """Test deleting nonexistent dream fails"""
        response = client.delete("/api/dreams/99999", headers=auth_headers)

        assert response.status_code == 404

    def test_delete_dream_other_user(self, client, auth_headers, second_user):
        """Test cannot delete another user's dream"""
        # Create dream as user 2
        dream_response = client.post(
            "/api/dreams",
            headers=second_user["headers"],
            json={"body": "User 2's dream"},
        )
        dream_id = dream_response.json()["id"]

        # Try to delete as user 1
        response = client.delete(f"/api/dreams/{dream_id}", headers=auth_headers)

        assert response.status_code == 404

    def test_delete_dream_unauthorized(self, client):
        """Test deleting dream without auth fails"""
        response = client.delete("/api/dreams/1")

        assert response.status_code == 403
