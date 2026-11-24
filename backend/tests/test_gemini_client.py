from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from google.genai import errors

from app.gemini_client import GenerationError, preflight_models


def make_client(listed, smoke_results=None):
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False

    client.models.list.return_value = [
        SimpleNamespace(name=name, supported_actions=actions)
        for name, actions in listed
    ]

    if smoke_results is not None:
        client.models.generate_content.side_effect = smoke_results

    return client


@patch("app.gemini_client.GEMINI_MODEL", "primary")
@patch("app.gemini_client.GEMINI_FALLBACK_MODELS", ["fallback"])
@patch("app.gemini_client.GEMINI_API_KEY", "test-key")
def test_preflight_returns_healthy_models(*_):
    client = make_client(
        [
            ("models/primary", ["generateContent"]),
            ("models/fallback", ["generateContent", "countTokens"]),
        ],
        [MagicMock(), MagicMock()],
    )

    with patch("app.gemini_client.genai.Client", return_value=client):
        assert preflight_models() == ["primary", "fallback"]

    assert client.models.generate_content.call_count == 2

    first_call = client.models.generate_content.call_args_list[0]
    assert first_call.kwargs["model"] == "primary"
    assert first_call.kwargs["config"].max_output_tokens == 1


@patch("app.gemini_client.GEMINI_MODEL", "primary")
@patch("app.gemini_client.GEMINI_FALLBACK_MODELS", ["fallback"])
@patch("app.gemini_client.GEMINI_API_KEY", "test-key")
def test_preflight_fails_when_configured_model_is_missing(*_):
    client = make_client([("models/other", ["generateContent"])])

    with (
        patch("app.gemini_client.genai.Client", return_value=client),
        pytest.raises(GenerationError, match="not found"),
    ):
        preflight_models()

    client.models.generate_content.assert_not_called()


@patch("app.gemini_client.GEMINI_MODEL", "primary")
@patch("app.gemini_client.GEMINI_FALLBACK_MODELS", ["fallback"])
@patch("app.gemini_client.GEMINI_API_KEY", "test-key")
def test_preflight_skips_model_without_generate_content(*_):
    client = make_client(
        [
            ("models/primary", ["countTokens"]),
            ("models/fallback", ["generateContent"]),
        ],
        [MagicMock()],
    )

    with patch("app.gemini_client.genai.Client", return_value=client):
        assert preflight_models() == ["fallback"]

    assert client.models.generate_content.call_count == 1


@patch("app.gemini_client.GEMINI_MODEL", "primary")
@patch("app.gemini_client.GEMINI_FALLBACK_MODELS", ["fallback"])
@patch("app.gemini_client.GEMINI_API_KEY", "test-key")
def test_preflight_uses_fallback_when_primary_unavailable(*_):
    client = make_client(
        [
            ("models/primary", ["generateContent"]),
            ("models/fallback", ["generateContent"]),
        ],
        [
            errors.APIError(503, {"error": {"message": "unavailable"}}),
            MagicMock(),
        ],
    )

    with patch("app.gemini_client.genai.Client", return_value=client):
        assert preflight_models() == ["fallback"]


@patch("app.gemini_client.GEMINI_MODEL", "primary")
@patch("app.gemini_client.GEMINI_FALLBACK_MODELS", ["fallback"])
@patch("app.gemini_client.GEMINI_API_KEY", "test-key")
def test_preflight_fails_when_all_models_unavailable(*_):
    client = make_client(
        [
            ("models/primary", ["generateContent"]),
            ("models/fallback", ["generateContent"]),
        ],
        [
            errors.APIError(503, {"error": {"message": "unavailable"}}),
            errors.APIError(503, {"error": {"message": "unavailable"}}),
        ],
    )

    with (
        patch("app.gemini_client.genai.Client", return_value=client),
        pytest.raises(GenerationError) as exc_info,
    ):
        preflight_models()

    assert exc_info.value.status_code == 503
    assert "HTTP 503" in str(exc_info.value)


@patch("app.gemini_client.GEMINI_MODEL", "primary")
@patch("app.gemini_client.GEMINI_FALLBACK_MODELS", ["fallback"])
@patch("app.gemini_client.GEMINI_API_KEY", "test-key")
def test_preflight_reports_model_list_failure(*_):
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False
    client.models.list.side_effect = errors.APIError(
        503,
        {"error": {"message": "unavailable"}},
    )

    with (
        patch("app.gemini_client.genai.Client", return_value=client),
        pytest.raises(GenerationError, match="preflight failed"),
    ):
        preflight_models()
