import logging

from pathlib import Path

from app.concepts import CONCEPTS
from app.gemini_client import generate_svg


logging.basicConfig(level=logging.INFO)


def main():
    concept = CONCEPTS[0]

    result = generate_svg(concept)

    print(
        result.model_dump_json(
            indent=2,
            exclude={"svg"},
        )
    )

    Path("test_diagram.svg").write_text(
        result.svg,
        encoding="utf-8",
    )

    print("Diagram saved to test_diagram.svg")


if __name__ == "__main__":
    main()