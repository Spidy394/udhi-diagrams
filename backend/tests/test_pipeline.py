from unittest.mock import patch

from app.checks import run_checks
from app.concepts import CONCEPTS
from app.pipeline import generate_diagram
from app.schemas import CheckResult, GenerationResponse

VALID_CHECKS = {
    name: CheckResult(
        passed=True,
        message="Passed",
    )
    for name in run_checks("")
}


def test_validation_retry():

    failed_checks = VALID_CHECKS.copy()

    failed_checks["within_viewbox"] = CheckResult(
        passed=False,
        message="Rectangle exceeds the viewBox.",
    )

    first_response = GenerationResponse(
        model="test-model",
        svg="<invalid/>",
        input_tokens=100,
        output_tokens=200,
        estimated_cost_usd=0.001,
        api_retries=0,
    )

    second_response = GenerationResponse(
        model="test-model",
        svg="<corrected/>",
        input_tokens=150,
        output_tokens=250,
        estimated_cost_usd=0.002,
        api_retries=1,
    )

    with (
        patch(
            "app.pipeline.generate_svg",
            side_effect=[first_response, second_response],
        ) as mock_generate,
        patch(
            "app.pipeline.run_checks",
            side_effect=[failed_checks, VALID_CHECKS],
        ),
    ):
        result = generate_diagram(CONCEPTS[0])

    assert result.passed
    assert result.validation_retries == 1
    assert result.api_retries == 1
    assert result.retries == 2

    assert result.input_tokens == 250
    assert result.output_tokens == 450
    assert abs(result.estimated_cost_usd - 0.003) < 1e-9

    assert mock_generate.call_count == 2

    feedback = mock_generate.call_args.kwargs["feedback"]

    assert "within_viewbox" in feedback
    assert "Rectangle exceeds the viewBox" in feedback


def test_preflighted_models_are_forwarded():
    response = GenerationResponse(
        model="preflighted-model",
        svg="<svg/>",
        input_tokens=10,
        output_tokens=10,
        estimated_cost_usd=0.001,
    )

    with (
        patch(
            "app.pipeline.generate_svg",
            return_value=response,
        ) as mock_generate,
        patch(
            "app.pipeline.run_checks",
            return_value=VALID_CHECKS,
        ),
    ):
        generate_diagram(
            CONCEPTS[0],
            models=["preflighted-model"],
        )

    assert mock_generate.call_args.kwargs["models"] == [
        "preflighted-model"
    ]