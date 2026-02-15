import io
import json
from datetime import datetime, timezone

import pytest


class TestBasicStats:
    """Test basic statistics endpoint"""

    def test_stats_no_dreams(self, client, auth_headers):
        """Test stats when user has no dreams"""
        response = client.get("/api/stats", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["moods"] == {}
        assert data["avg_lucidity"] is None

    def test_stats_with_dreams(self, client, auth_headers):
        """Test stats with dreams"""
        # Create dreams with different moods and lucidity
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 1", "mood": "joyful", "lucidity": 8},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 2", "mood": "joyful", "lucidity": 6},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 3", "mood": "fearful", "lucidity": 4},
        )

        response = client.get("/api/stats", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["moods"]["joyful"] == 2
        assert data["moods"]["fearful"] == 1
        assert data["avg_lucidity"] == 6.0

    def test_stats_ignores_null_moods(self, client, auth_headers):
        """Test stats correctly handles dreams without mood"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 1", "mood": "joyful"},
        )
        client.post(
            "/api/dreams", headers=auth_headers, json={"body": "Dream 2"}  # No mood
        )

        response = client.get("/api/stats", headers=auth_headers)
        data = response.json()

        assert data["total"] == 2
        assert data["moods"]["joyful"] == 1
        assert len(data["moods"]) == 1

    def test_stats_ignores_null_lucidity(self, client, auth_headers):
        """Test stats correctly handles dreams without lucidity"""
        client.post(
            "/api/dreams", headers=auth_headers, json={"body": "Dream 1", "lucidity": 8}
        )
        client.post(
            "/api/dreams", headers=auth_headers, json={"body": "Dream 2"}  # No lucidity
        )

        response = client.get("/api/stats", headers=auth_headers)
        data = response.json()

        assert data["avg_lucidity"] == 8.0

    def test_stats_unauthorized(self, client):
        """Test stats without auth fails"""
        response = client.get("/api/stats")

        assert response.status_code == 403


class TestDetailedStats:
    """Test detailed statistics endpoint"""

    def test_detailed_stats_structure(self, client, auth_headers):
        """Test detailed stats returns correct structure"""
        response = client.get("/api/stats/detailed", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify all required fields are present
        assert "total_dreams" in data
        assert "dreams_by_month" in data
        assert "dreams_by_day" in data
        assert "mood_distribution" in data
        assert "top_tags" in data
        assert "lucidity_trend" in data
        assert "current_streak" in data

    def test_detailed_stats_with_data(self, client, auth_headers):
        """Test detailed stats with dream data"""
        # Create some dreams
        for i in range(5):
            client.post(
                "/api/dreams",
                headers=auth_headers,
                json={
                    "body": f"Dream {i}",
                    "mood": "joyful" if i % 2 == 0 else "peaceful",
                    "tags": ["tag1", "tag2"] if i % 2 == 0 else ["tag3"],
                    "lucidity": 7,
                },
            )

        response = client.get("/api/stats/detailed", headers=auth_headers)
        data = response.json()

        assert data["total_dreams"] == 5
        assert len(data["mood_distribution"]) == 2
        assert len(data["top_tags"]) > 0

    def test_detailed_stats_streak_calculation(self, client, auth_headers):
        """Test current streak calculation"""
        from datetime import timedelta

        today = datetime.now().date()

        # Create dreams for consecutive days
        for i in range(3):
            dream_date = (today - timedelta(days=i)).isoformat()
            client.post(
                "/api/dreams",
                headers=auth_headers,
                json={"body": f"Dream {i}", "dream_date": dream_date},
            )

        response = client.get("/api/stats/detailed", headers=auth_headers)
        data = response.json()

        # Should have a streak of at least 3
        assert data["current_streak"] >= 3

    def test_detailed_stats_unauthorized(self, client):
        """Test detailed stats without auth fails"""
        response = client.get("/api/stats/detailed")

        assert response.status_code == 403


class TestTags:
    """Test tags listing endpoint"""

    def test_list_tags_empty(self, client, auth_headers):
        """Test listing tags when user has no dreams"""
        response = client.get("/api/tags", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_list_tags_multiple_dreams(self, client, auth_headers):
        """Test listing all unique tags"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 1", "tags": ["flying", "ocean"]},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 2", "tags": ["flying", "forest"]},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 3", "tags": ["mountains"]},
        )

        response = client.get("/api/tags", headers=auth_headers)

        assert response.status_code == 200
        tags = response.json()

        assert len(tags) == 4
        assert "flying" in tags
        assert "ocean" in tags
        assert "forest" in tags
        assert "mountains" in tags

    def test_list_tags_sorted(self, client, auth_headers):
        """Test tags are returned sorted"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream", "tags": ["zebra", "apple", "monkey"]},
        )

        response = client.get("/api/tags", headers=auth_headers)
        tags = response.json()

        assert tags == ["apple", "monkey", "zebra"]

    def test_list_tags_no_duplicates(self, client, auth_headers):
        """Test duplicate tags are not returned"""
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 1", "tags": ["flying", "ocean"]},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Dream 2", "tags": ["flying", "ocean"]},
        )

        response = client.get("/api/tags", headers=auth_headers)
        tags = response.json()

        assert len(tags) == 2

    def test_list_tags_unauthorized(self, client):
        """Test listing tags without auth fails"""
        response = client.get("/api/tags")

        assert response.status_code == 403


class TestBackup:
    """Test dream backup/export"""

    def test_backup_empty(self, client, auth_headers):
        """Test backup with no dreams"""
        response = client.get("/api/backup", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert "export_date" in data
        assert data["version"] == "1.0"
        assert data["total_dreams"] == 0
        assert data["dreams"] == []

    def test_backup_with_dreams(self, client, auth_headers):
        """Test exporting dreams as backup"""
        # Create some dreams
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"title": "Dream 1", "body": "Body 1", "tags": ["tag1"]},
        )
        client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"title": "Dream 2", "body": "Body 2", "tags": ["tag2"]},
        )

        response = client.get("/api/backup", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["total_dreams"] == 2
        assert len(data["dreams"]) == 2
        assert all("id" in dream for dream in data["dreams"])
        assert all("body" in dream for dream in data["dreams"])

    def test_backup_has_download_header(self, client, auth_headers):
        """Test backup response has download header"""
        response = client.get("/api/backup", headers=auth_headers)

        assert "Content-Disposition" in response.headers
        assert "attachment" in response.headers["Content-Disposition"]
        assert ".json" in response.headers["Content-Disposition"]

    def test_backup_unauthorized(self, client):
        """Test backup without auth fails"""
        response = client.get("/api/backup")

        assert response.status_code == 403


class TestImport:
    """Test dream import"""

    def test_import_valid_backup(self, client, auth_headers):
        """Test importing dreams from valid backup"""
        backup_data = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "version": "1.0",
            "total_dreams": 2,
            "dreams": [
                {
                    "title": "Imported Dream 1",
                    "body": "Body 1",
                    "mood": "joyful",
                    "tags": ["imported"],
                    "dream_date": "2024-01-01",
                    "created_at": "2024-01-01T10:00:00",
                    "updated_at": "2024-01-01T10:00:00",
                },
                {
                    "title": "Imported Dream 2",
                    "body": "Body 2",
                    "mood": "neutral",
                    "tags": [],
                    "dream_date": "2024-01-02",
                    "created_at": "2024-01-02T10:00:00",
                    "updated_at": "2024-01-02T10:00:00",
                },
            ],
        }

        file_content = json.dumps(backup_data).encode()
        files = {"file": ("backup.json", io.BytesIO(file_content), "application/json")}

        response = client.post("/api/import", headers=auth_headers, files=files)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["imported"] == 2
        assert data["skipped"] == 0
        assert data["errors"] == 0

        # Verify dreams were imported
        dreams_response = client.get("/api/dreams", headers=auth_headers)
        dreams = dreams_response.json()
        assert len(dreams) == 2

    def test_import_skip_duplicates(self, client, auth_headers):
        """Test importing dreams skips duplicates"""
        # Create a dream
        create_response = client.post(
            "/api/dreams",
            headers=auth_headers,
            json={"body": "Existing dream", "dream_date": "2024-01-01"},
        )

        # Get the created dream's timestamp
        dreams = client.get("/api/dreams", headers=auth_headers).json()
        created_at = dreams[0]["created_at"]

        # Try to import same dream
        backup_data = {
            "dreams": [
                {
                    "body": "Existing dream",
                    "dream_date": "2024-01-01",
                    "created_at": created_at,
                    "updated_at": created_at,
                }
            ]
        }

        file_content = json.dumps(backup_data).encode()
        files = {"file": ("backup.json", io.BytesIO(file_content), "application/json")}

        response = client.post("/api/import", headers=auth_headers, files=files)

        data = response.json()
        assert data["skipped"] == 1
        assert data["imported"] == 0

    def test_import_invalid_json(self, client, auth_headers):
        """Test importing invalid JSON fails"""
        files = {"file": ("backup.json", io.BytesIO(b"not json"), "application/json")}

        response = client.post("/api/import", headers=auth_headers, files=files)

        assert response.status_code == 400
        assert "Invalid JSON" in response.json()["detail"]

    def test_import_invalid_format(self, client, auth_headers):
        """Test importing file with invalid format fails"""
        # Missing 'dreams' key
        invalid_data = {"some": "data"}

        file_content = json.dumps(invalid_data).encode()
        files = {"file": ("backup.json", io.BytesIO(file_content), "application/json")}

        response = client.post("/api/import", headers=auth_headers, files=files)

        assert response.status_code == 400
        assert "Invalid backup file format" in response.json()["detail"]

    def test_import_dreams_not_list(self, client, auth_headers):
        """Test importing file where dreams is not a list fails"""
        invalid_data = {"dreams": "not a list"}

        file_content = json.dumps(invalid_data).encode()
        files = {"file": ("backup.json", io.BytesIO(file_content), "application/json")}

        response = client.post("/api/import", headers=auth_headers, files=files)

        assert response.status_code == 400

    def test_import_unauthorized(self, client):
        """Test import without auth fails"""
        backup_data = {"dreams": []}
        file_content = json.dumps(backup_data).encode()
        files = {"file": ("backup.json", io.BytesIO(file_content), "application/json")}

        response = client.post("/api/import", files=files)

        assert response.status_code == 403
