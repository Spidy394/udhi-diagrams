import json

from app.config import RESULTS_PATH
from app.schemas import DiagramResult


def load_results() -> list[DiagramResult]:
    if not RESULTS_PATH.exists():
        return []

    data = json.loads(
        RESULTS_PATH.read_text(encoding="utf-8")
    )

    results = []

    for item in data:
        # Computed fields are recalculated by Pydantic.
        item.pop("passed", None)
        item.pop("retries", None)

        results.append(
            DiagramResult.model_validate(item)
        )

    return results


def save_results(results: list[DiagramResult]) -> None:
    data = [
        result.model_dump(mode="json")
        for result in sorted(
            results,
            key=lambda result: result.concept_id,
        )
    ]

    temp_path = RESULTS_PATH.with_suffix(".tmp")

    temp_path.write_text(
        json.dumps(
            data,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    temp_path.replace(RESULTS_PATH)


def save_result(result: DiagramResult) -> None:
    results = load_results()

    results = [
        existing
        for existing in results
        if existing.concept_id != result.concept_id
    ]

    results.append(result)

    save_results(results)