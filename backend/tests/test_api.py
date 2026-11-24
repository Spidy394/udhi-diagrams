from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.gemini_client import GenerationError


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_results():
    response = client.get("/results")

    assert response.status_code == 200

    results = response.json()

    assert len(results) == 5

    assert {
        item["concept"]["id"]
        for item in results
    } == {1, 2, 3, 4, 5}


def test_invalid_concept():
    response = client.post("/generate/99")

    assert response.status_code == 404


def test_generation_service_unavailable():
    with patch(
        "app.main.generate_diagram",
        side_effect=GenerationError(
            message="Gemini service unavailable.",
            api_retries=3,
            status_code=503,
        ),
    ):
        response = client.post("/generate/1")

    assert response.status_code == 503
    assert "unavailable" in response.json()["detail"]


def test_generation_rate_limit():
    with patch(
        "app.main.generate_diagram",
        side_effect=GenerationError(
            message="Gemini rate limit exceeded.",
            api_retries=3,
            status_code=429,
        ),
    ):
        response = client.post("/generate/1")

    assert response.status_code == 429


def test_successful_live_generation():
    from app.store import load_results

    result = load_results()[0]

    with patch(
        "app.main.generate_diagram",
        return_value=result,
    ):
        response = client.post(
            f"/generate/{result.concept_id}"
        )

    assert response.status_code == 200
    assert response.json()["result"]["passed"] is True