import logging
import re
import time

from google import genai
from google.genai import errors, types

from app.config import (
    GEMINI_API_KEY,
    GEMINI_FALLBACK_MODELS,
    GEMINI_MODEL,
    INITIAL_RETRY_DELAY,
    MAX_API_RETRIES,
    MAX_OUTPUT_TOKENS,
    MODEL_PRICING,
)
from app.schemas import Concept, GenerationResponse

logger = logging.getLogger(__name__)

class GenerationError(Exception):
    def __init__(
        self,
        message: str,
        api_retries: int = 0,
        status_code: int | None = None,
    ):
        super().__init__(message)
        self.api_retries = api_retries
        self.status_code = status_code

def build_prompt(
    concept: Concept,
    feedback: str | None = None,
) -> str:
    prompt = f"""
You are an expert science educator and SVG illustrator creating diagrams for UK GCSE students aged 14-16.

Create one scientifically accurate, animated SVG diagram.

Concept: {concept.name}
Subject: {concept.subject}

Educational content:
{concept.description}

VISUAL REQUIREMENTS:
- Use a clean, modern educational illustration style.
- Use meaningful and consistent colours.
- Ensure all labels are readable.
- Avoid overlapping text and diagram elements.
- Use animation to explain the scientific concept, not merely for decoration.

TECHNICAL REQUIREMENTS:
- Return only one complete SVG document.
- Use xmlns="http://www.w3.org/2000/svg".
- Use viewBox="0 0 800 500".
- Include a non-empty title element.
- Include at least three visible text labels.
- Keep all elements and their animated positions completely within the viewBox.
- Leave sufficient padding around the diagram.
- Use simple SVG shapes: rect, circle, ellipse, line, polygon, polyline, g and text.
- Use numeric coordinates and dimensions.
- Use inline SVG presentation attributes.
- Use SMIL animate elements for animations.
- Animate opacity, or circle cx/cy positions using numeric values and linear interpolation.
- Include meaningful repeating animation.
- Specify readable font sizes explicitly.
- Do not use CSS, style elements or transformations.
- Do not use scripts, event handlers, foreignObject, external resources or embedded images.
- Do not include markdown fences or explanations.

Return the raw SVG only.
""".strip()

    if feedback:
        prompt += f"""

CORRECTION REQUIRED:

The previous diagram failed these validation checks:

{feedback}

Generate a corrected, complete SVG that resolves
all the reported issues while preserving scientific accuracy.
"""

    return prompt

def extract_svg(text: str) -> str:
    text = text.strip()

    match = re.fullmatch(
        r"```(?:svg|xml)?\s*(.*?)\s*```",
        text,
        flags=re.DOTALL | re.IGNORECASE
    )

    return match.group(1).strip() if match else text

def calculate_cost(
    model: str,
    input_tokens: int | None,
    output_tokens: int | None,
) -> float | None:

    pricing = MODEL_PRICING.get(model)

    if (
        pricing is None
        or input_tokens is None
        or output_tokens is None
    ):
        return None

    return (
        input_tokens * pricing["input"]
        + output_tokens * pricing["output"]
    ) / 1_000_000

def generate_svg(
    concept: Concept,
    feedback: str | None = None,
) -> GenerationResponse:

    if not GEMINI_API_KEY:
        raise GenerationError("Gemini API key is not configured.")

    prompt = build_prompt(concept, feedback)

    models = [GEMINI_MODEL]
    models.extend(
        model for model in GEMINI_FALLBACK_MODELS if model != GEMINI_MODEL
    )

    total_retries = 0

    with genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=60_000,
            retry_options=types.HttpRetryOptions(
                attempts=1,
            ),
        ),
    ) as client:

        for model_index, model in enumerate(models):
            next_model = (
                models[model_index + 1]
                if model_index + 1 < len(models)
                else None
            )

            for attempt in range(MAX_API_RETRIES + 1):

                try:
                    response = client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            max_output_tokens=MAX_OUTPUT_TOKENS,
                        ),
                    )

                except errors.APIError as exc:

                    retryable = exc.code in (429, 503)

                    if retryable and attempt < MAX_API_RETRIES:
                        delay = INITIAL_RETRY_DELAY * (2 ** attempt)

                        logger.warning(
                            "Concept %s | Model %s: HTTP %s. "
                            "Retry %s/%s in %ss.",
                            concept.id,
                            model,
                            exc.code,
                            attempt + 1,
                            MAX_API_RETRIES,
                            delay,
                        )

                        time.sleep(delay)
                        total_retries += 1
                        continue

                    if next_model is not None:
                        logger.warning(
                            "Concept %s | Model %s unavailable "
                            "(HTTP %s). Trying %s.",
                            concept.id,
                            model,
                            exc.code,
                            next_model,
                        )
                        break

                    raise GenerationError(
                        message=(
                            f"Gemini API failed (HTTP {exc.code}) "
                            f"after trying: {', '.join(models)}."
                        ),
                        api_retries=total_retries,
                        status_code=exc.code,
                    ) from exc

                usage = response.usage_metadata

                input_tokens = (
                    usage.prompt_token_count
                    if usage is not None
                    else None
                )

                output_tokens = None

                if (
                    usage is not None
                    and usage.candidates_token_count is not None
                ):
                    output_tokens = (
                        usage.candidates_token_count
                        + (usage.thoughts_token_count or 0)
                    )

                cost = calculate_cost(
                    model,
                    input_tokens,
                    output_tokens,
                )

                result = GenerationResponse(
                    model=model,
                    svg=extract_svg(response.text or ""),
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    estimated_cost_usd=cost,
                    api_retries=total_retries,
                )

                logger.info(
                    "Concept %s | Model: %s | Input: %s | "
                    "Output: %s | Cost: %s | API retries: %s",
                    concept.id,
                    result.model,
                    result.input_tokens,
                    result.output_tokens,
                    result.estimated_cost_usd,
                    result.api_retries,
                )

                return result

    raise GenerationError(
        "Unexpected generation failure.",
        api_retries=total_retries,
    )