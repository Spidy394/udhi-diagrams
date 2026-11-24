import logging
from pathlib import Path

from app.concepts import CONCEPTS
from app.pipeline import generate_diagram

logging.basicConfig(level=logging.INFO)


def main():
    result = generate_diagram(CONCEPTS[0])

    print(
        result.model_dump_json(
            indent=2,
            exclude={"svg"},
        )
    )

    if result.passed:
        Path("test_diagram.svg").write_text(
            result.svg,
            encoding="utf-8",
        )

        print("Validated diagram saved.")
    else:
        print("Diagram failed validation after retry.")


if __name__ == "__main__":
    main()