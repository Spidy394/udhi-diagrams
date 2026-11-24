from typing import get_args

import pytest

from app.checks import (
    check_has_animation,
    check_safe_svg,
    check_title_and_labels,
    check_valid_svg,
    check_within_viewbox,
    format_feedback,
    run_checks,
)
from app.schemas import CheckName

VALID_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <title>Test diagram</title>
  <rect x="10" y="10" width="780" height="480" fill="#ffffff"/>
  <circle cx="400" cy="250" r="80" fill="blue">
    <animate attributeName="cx" values="300;500;300" dur="3s"
             repeatCount="indefinite"/>
  </circle>
  <text x="50" y="60" font-size="20">Label one</text>
  <text x="350" y="250" font-size="20">Label two</text>
  <text x="650" y="450" font-size="20">Label three</text>
</svg>"""


def test_valid_svg_accepts_valid_document():
    result = check_valid_svg(VALID_SVG)

    assert result.passed
    assert "namespace" in result.message.lower()


def test_valid_svg_rejects_malformed_xml():
    result = check_valid_svg("<svg>")

    assert not result.passed
    assert "well-formed" in result.message.lower()


def test_valid_svg_rejects_wrong_namespace():
    svg = VALID_SVG.replace(' xmlns="http://www.w3.org/2000/svg"', "")

    result = check_valid_svg(svg)

    assert not result.passed
    assert "namespace" in result.message.lower()


def test_within_viewbox_accepts_valid_document():
    assert check_within_viewbox(VALID_SVG).passed


def test_within_viewbox_rejects_shape_outside_viewbox():
    svg = VALID_SVG.replace('width="780"', 'width="900"')

    result = check_within_viewbox(svg)

    assert not result.passed
    assert "outside the viewBox" in result.message


def test_within_viewbox_rejects_animated_position_outside_viewbox():
    svg = VALID_SVG.replace('values="300;500;300"', 'values="700;900;700"')

    result = check_within_viewbox(svg)

    assert not result.passed
    assert "animated x" in result.message


def test_title_and_labels_accepts_valid_document():
    result = check_title_and_labels(VALID_SVG)

    assert result.passed
    assert "3 visible text labels" in result.message


def test_title_and_labels_rejects_missing_title():
    svg = VALID_SVG.replace("  <title>Test diagram</title>\n", "")

    result = check_title_and_labels(svg)

    assert not result.passed
    assert "<title>" in result.message


def test_title_and_labels_rejects_too_few_labels():
    svg = VALID_SVG.replace(
        '  <text x="650" y="450" font-size="20">Label three</text>\n',
        "",
    )

    result = check_title_and_labels(svg)

    assert not result.passed
    assert "at least 3" in result.message


def test_has_animation_accepts_repeating_animation():
    result = check_has_animation(VALID_SVG)

    assert result.passed
    assert "repeating" in result.message


def test_has_animation_rejects_missing_animation():
    svg = VALID_SVG.replace(
        '    <animate attributeName="cx" values="300;500;300" dur="3s"\n'
        '             repeatCount="indefinite"/>\n',
        "",
    )

    result = check_has_animation(svg)

    assert not result.passed
    assert "No SMIL" in result.message


def test_has_animation_rejects_non_repeating_animation():
    svg = VALID_SVG.replace('repeatCount="indefinite"', 'repeatCount="1"')

    result = check_has_animation(svg)

    assert not result.passed
    assert "does not repeat" in result.message


def test_has_animation_rejects_animation_without_values():
    svg = VALID_SVG.replace('values="300;500;300" ', "")

    result = check_has_animation(svg)

    assert not result.passed
    assert "no values" in result.message


@pytest.mark.parametrize(
    "snippet",
    [
        "<script>alert(1)</script>",
        '<rect x="0" y="0" width="10" height="10" onclick="alert(1)"/>',
        '<image href="https://example.com/x.png"/>',
        '<rect x="0" y="0" width="10" height="10" style="fill:red"/>',
        '<use href="#shape"/>',
    ],
)
def test_safe_svg_rejects_unsafe_content(snippet):
    svg = VALID_SVG.replace("</svg>", f"  {snippet}\n</svg>")

    result = check_safe_svg(svg)

    assert not result.passed


def test_safe_svg_rejects_doctype():
    svg = "<!DOCTYPE svg>\n" + VALID_SVG

    result = check_safe_svg(svg)

    assert not result.passed
    assert "entity" in result.message.lower()


def test_safe_svg_accepts_valid_document():
    assert check_safe_svg(VALID_SVG).passed


def test_run_checks_returns_all_checks_and_passes_valid_document():
    results = run_checks(VALID_SVG)

    assert set(results) == set(get_args(CheckName))
    assert all(result.passed for result in results.values()), format_feedback(
        results
    )


def test_run_checks_reports_every_check_on_malformed_svg():
    results = run_checks("<svg>")

    assert len(results) == 5
    assert all(not result.passed for result in results.values())


def test_format_feedback_only_lists_failed_checks():
    assert format_feedback(run_checks(VALID_SVG)) == ""

    feedback = format_feedback(run_checks("<svg>"))

    assert feedback.count("\n") == 4
    assert "valid_svg:" in feedback
