import argparse
import logging

from app.concepts import CONCEPTS
from app.gemini_client import GenerationError
from app.pipeline import generate_diagram
from app.store import load_results, save_result


logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)


def main(force: bool = False) -> int:
    existing_results = {
        result.concept_id: result
        for result in load_results()
    }

    for concept in CONCEPTS:

        existing = existing_results.get(concept.id)

        if existing and existing.passed and not force:
            logger.info(
                "Skipping %s: already passed validation.",
                concept.name,
            )
            continue

        logger.info(
            "Generating [%s/5] %s",
            concept.id,
            concept.name,
        )

        try:
            result = generate_diagram(concept)

        except GenerationError as exc:
            logger.error(
                "Generation failed for %s: %s",
                concept.name,
                exc,
            )
            continue

        save_result(result)

        logger.info(
            "Saved %s | Passed: %s | Cost: %s | Retries: %s",
            concept.name,
            result.passed,
            result.estimated_cost_usd,
            result.retries,
        )

    results = load_results()

    passed = sum(result.passed for result in results)

    costs = [
        result.estimated_cost_usd
        for result in results
    ]

    total_cost = (
        sum(costs)
        if all(cost is not None for cost in costs)
        else None
    )

    print("\n" + "=" * 50)
    print("GENERATION SUMMARY")
    print("=" * 50)

    print(f"Saved diagrams: {len(results)}/5")
    print(f"Passed validation: {passed}/5")
    print(f"Failed validation: {len(results) - passed}")
    print(f"Missing diagrams: {5 - len(results)}")
    print(f"Estimated saved results cost: {total_cost}")
    print(f"Total retries: {sum(r.retries for r in results)}")

    return 0 if passed == 5 else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate all concepts, including passed ones.",
    )

    args = parser.parse_args()

    raise SystemExit(main(force=args.force))