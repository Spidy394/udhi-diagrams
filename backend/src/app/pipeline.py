import logging
from typing import TypeVar

from app.checks import run_checks, format_feedback
from app.config import MAX_VALIDATION_RETRIES
from app.gemini_client import generate_svg
from app.schemas import Concept, DiagramResult


logger = logging.getLogger(__name__)

T = TypeVar("T", int, float)


def add_usage(
    current: T | None,
    new: T | None,
) -> T | None:
    if current is None or new is None:
        return None

    return current + new

def generate_diagram(concept: Concept) -> DiagramResult:
    feedback: str | None = None

    total_input_tokens: int | None = 0
    total_output_tokens: int | None = 0
    total_cost: float | None = 0.0
    total_api_retries = 0

    for attempt in range(MAX_VALIDATION_RETRIES + 1):

        logger.info(
            "Generating concept %s: %s | Attempt %s",
            concept.id,
            concept.name,
            attempt + 1,
        )

        generation = generate_svg(
            concept=concept,
            feedback=feedback,
        )

        total_input_tokens = add_usage(
            total_input_tokens,
            generation.input_tokens,
        )

        total_output_tokens = add_usage(
            total_output_tokens,
            generation.output_tokens,
        )

        total_cost = add_usage(
            total_cost,
            generation.estimated_cost_usd,
        )

        total_api_retries += generation.api_retries

        checks = run_checks(generation.svg)

        result = DiagramResult(
            concept_id=concept.id,
            model=generation.model,
            svg=generation.svg,
            checks=checks,
            input_tokens=total_input_tokens,
            output_tokens=total_output_tokens,
            estimated_cost_usd=total_cost,
            api_retries=total_api_retries,
            validation_retries=attempt,
        )

        for name, check in checks.items():
            logger.info(
                "Concept %s | %s: %s | %s",
                concept.id,
                name,
                "PASS" if check.passed else "FAIL",
                check.message,
            )

        if result.passed:
            break

        if attempt < MAX_VALIDATION_RETRIES:
            feedback = format_feedback(checks)

            logger.warning(
                "Concept %s failed validation. Retrying:\n%s",
                concept.id,
                feedback,
            )

    logger.info(
        "Concept %s | Model: %s | Passed: %s | "
        "Input tokens: %s | Output tokens: %s | "
        "Cost: %s USD | Retries: %s",
        concept.id,
        result.model,
        result.passed,
        result.input_tokens,
        result.output_tokens,
        result.estimated_cost_usd,
        result.retries,
    )

    return result