import math
import re
import xml.etree.ElementTree as ET

from defusedxml import ElementTree as SafeET
from defusedxml.common import DefusedXmlException

from app.schemas import CheckName, CheckResult

SVG_NS = "http://www.w3.org/2000/svg"

ALLOWED_ELEMENTS = frozenset({
    "svg",
    "g",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polygon",
    "polyline",
    "text",
    "tspan",
    "title",
    "desc",
    "animate",
})

DANGEROUS_ELEMENTS = frozenset({
    "script",
    "foreignObject",
    "image",
    "style",
    "a",
    "use",
    "iframe",
    "object",
    "embed",
    "audio",
    "video",
    "canvas",
})


def _tag(name: str) -> str:
    return f"{{{SVG_NS}}}{name}"


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _parse_svg(
    svg: str,
) -> tuple[ET.Element | None, str | None]:

    if len(svg.encode("utf-8")) > 250_000:
        return None, "SVG exceeds the 250 KB size limit."

    try:
        root = SafeET.fromstring(
            svg,
            forbid_dtd=True,
            forbid_entities=True,
            forbid_external=True,
        )

        return root, None

    except DefusedXmlException as exc:
        return None, f"Invalid or unsafe SVG: {exc}"
    except ET.ParseError as exc:
        return None, f"SVG is not well-formed XML: {exc}"


def _passed(message: str) -> CheckResult:
    return CheckResult(passed=True, message=message)


def _failed(message: str) -> CheckResult:
    return CheckResult(passed=False, message=message)


def _join_issues(issues: list[str]) -> str:
    return "; ".join(issues[:5])


def _check_valid_svg(root: ET.Element | None, error: str | None) -> CheckResult:
    if error is not None or root is None:
        return _failed(error or "No SVG document was provided.")

    if root.tag != _tag("svg"):
        return _failed(
            "Root element must be <svg> in the "
            f"{SVG_NS} namespace."
        )

    return _passed("Well-formed SVG document with the correct namespace.")


def _viewbox(root: ET.Element) -> tuple[list[float] | None, str | None]:
    raw = root.get("viewBox")

    if raw is None:
        return None, "Missing viewBox attribute."

    parts = [part for part in re.split(r"[\s,]+", raw.strip()) if part]

    if len(parts) != 4:
        return None, "viewBox must contain four numbers."

    try:
        box = [float(part) for part in parts]
    except ValueError:
        return None, "viewBox contains non-numeric values."

    if not all(math.isfinite(value) for value in box):
        return None, "viewBox contains non-finite values."

    if box[2] <= 0 or box[3] <= 0:
        return None, "viewBox width and height must be positive."

    return box, None


def _number(
    raw: str | None,
    default: float | None = None,
) -> float | None:

    if raw is None:
        return default

    try:
        value = float(raw)

        if not math.isfinite(value):
            return None

        return value

    except ValueError:
        return None


def _interval(
    axis: str,
    name: str,
    values: list[float],
) -> tuple[str, str, float, float]:
    return axis, name, min(values), max(values)


def _element_intervals(
    element: ET.Element,
    issues: list[str],
) -> list[tuple[str, str, float, float]]:
    local = _local_name(element.tag)
    label = f"<{local}>"

    if local == "rect":
        x = _number(element.get("x"), 0.0)
        y = _number(element.get("y"), 0.0)
        width = _number(element.get("width"))
        height = _number(element.get("height"))

        if x is None or y is None or width is None or height is None:
            issues.append(f"{label} has missing or non-numeric geometry.")
            return []

        if width < 0 or height < 0:
            issues.append(f"{label} has a negative width or height.")

        return [
            _interval("x", "x", [x, x + width]),
            _interval("y", "y", [y, y + height]),
        ]

    if local in {"circle", "ellipse"}:
        cx = _number(element.get("cx"), 0.0)
        cy = _number(element.get("cy"), 0.0)

        if local == "circle":
            rx = _number(element.get("r"))
            ry = rx
        else:
            rx = _number(element.get("rx"))
            ry = _number(element.get("ry"))

        if cx is None or cy is None or rx is None or ry is None:
            issues.append(f"{label} has missing or non-numeric geometry.")
            return []

        if rx < 0 or ry < 0:
            issues.append(f"{label} has a negative radius.")

        return [
            _interval("x", "x", [cx - rx, cx + rx]),
            _interval("y", "y", [cy - ry, cy + ry]),
        ]

    if local == "line":
        x1 = _number(element.get("x1"))
        y1 = _number(element.get("y1"))
        x2 = _number(element.get("x2"))
        y2 = _number(element.get("y2"))

        if x1 is None or y1 is None or x2 is None or y2 is None:
            issues.append(f"{label} has missing or non-numeric endpoints.")
            return []

        return [
            _interval("x", "x", [x1, x2]),
            _interval("y", "y", [y1, y2]),
        ]

    if local in {"polygon", "polyline"}:
        points: list[tuple[float, float]] = []

        for pair in (element.get("points") or "").split():
            parts = pair.split(",")

            if len(parts) != 2:
                issues.append(f"{label} has an invalid points attribute.")
                return []

            x = _number(parts[0])
            y = _number(parts[1])

            if x is None or y is None:
                issues.append(f"{label} has non-numeric points.")
                return []

            points.append((x, y))

        if not points:
            issues.append(f"{label} has no points.")
            return []

        return [
            _interval("x", "x", [x for x, _ in points]),
            _interval("y", "y", [y for _, y in points]),
        ]

    if local in {"text", "tspan"}:
        intervals = []

        for name, axis in (("x", "x"), ("y", "y")):
            value = _number(element.get(name))

            if value is not None:
                intervals.append(_interval(axis, name, [value]))

        return intervals

    if local == "animate":
        name = element.get("attributeName", "")
        values: list[float] = []
        raw_values = element.get("values")

        if raw_values:
            try:
                values = [
                    float(value.strip())
                    for value in raw_values.split(";")
                    if value.strip()
                ]
            except ValueError:
                issues.append(f"{label} has non-numeric animation values.")
                return []

        for attribute in ("from", "to", "by"):
            value = _number(element.get(attribute))

            if value is not None:
                values.append(value)

        if name in {"cx", "cy", "x", "y", "x1", "y1", "x2", "y2"}:
            if not values:
                issues.append(f"{label} has no numeric target values.")
                return []

            axis = "x" if name in {"cx", "x", "x1", "x2"} else "y"
            return [_interval(axis, f"animated {axis}", values)]

        if name in {"r", "rx", "ry", "width", "height"}:
            if any(value < 0 for value in values):
                issues.append(f"{label} animates a negative size.")
        elif name == "opacity" and any(
            value < 0 or value > 1 for value in values
        ):
            issues.append(f"{label} animates opacity outside 0 to 1.")

    return []


def _check_within_viewbox(root: ET.Element | None, error: str | None) -> CheckResult:
    if error is not None or root is None:
        return _failed(error or "No SVG document was provided.")

    box, box_error = _viewbox(root)

    if box is None or box_error is not None:
        return _failed(box_error or "Invalid viewBox.")

    min_x, min_y, width, height = box
    max_x = min_x + width
    max_y = min_y + height
    issues: list[str] = []

    for element in root.iter():
        if not isinstance(element.tag, str):
            continue

        if _local_name(element.tag) in {"svg", "g", "title", "desc"}:
            continue

        for axis, name, low, high in _element_intervals(element, issues):
            lower = min_x if axis == "x" else min_y
            upper = max_x if axis == "x" else max_y

            if low < lower or high > upper:
                issues.append(
                    f"<{_local_name(element.tag)}> {name} spans "
                    f"{low:g} to {high:g}, outside the viewBox."
                )

    if issues:
        return _failed(_join_issues(issues))

    return _passed(f"All elements stay within the {width:g} by {height:g} viewBox.")


def _check_title_and_labels(
    root: ET.Element | None,
    error: str | None,
) -> CheckResult:
    if error is not None or root is None:
        return _failed(error or "No SVG document was provided.")

    title = root.find(f".//{_tag('title')}")
    title_text = "".join(title.itertext()).strip() if title is not None else ""
    labels = [
        "".join(element.itertext()).strip()
        for element in root.iter(_tag("text"))
    ]
    labels = [label for label in labels if label]
    issues: list[str] = []

    if not title_text:
        issues.append("Missing non-empty <title> element.")

    if len(labels) < 3:
        issues.append(
            f"Found {len(labels)} visible text labels; at least 3 are required."
        )

    if issues:
        return _failed(_join_issues(issues))

    return _passed(f"Has a title and {len(labels)} visible text labels.")


def _check_has_animation(
    root: ET.Element | None,
    error: str | None,
) -> CheckResult:
    if error is not None or root is None:
        return _failed(error or "No SVG document was provided.")

    animations = list(root.iter(_tag("animate")))
    issues: list[str] = []

    if not animations:
        return _failed("No SMIL <animate> element found.")

    for animation in animations:
        name = animation.get("attributeName")
        values = animation.get("values")
        has_range = animation.get("from") is not None and (
            animation.get("to") is not None
            or animation.get("by") is not None
        )

        if not name:
            issues.append("<animate> is missing attributeName.")

        if not values and not has_range:
            issues.append("<animate> has no values, from/to or from/by range.")

        duration = animation.get("dur")

        if not duration or duration == "0s":
            issues.append("<animate> has no positive duration.")

        repeat = animation.get("repeatCount")

        if repeat is None:
            issues.append("<animate> has no repeatCount.")
        elif repeat != "indefinite":
            try:
                if float(repeat) <= 1:
                    issues.append("<animate> does not repeat.")
            except ValueError:
                issues.append("<animate> has an invalid repeatCount.")

    if issues:
        return _failed(_join_issues(issues))

    return _passed(f"Has {len(animations)} repeating SMIL animation(s).")


def _check_safe_svg(
    root: ET.Element | None,
    error: str | None,
    svg: str,
) -> CheckResult:
    issues: list[str] = []

    if re.search(r"<!DOCTYPE|<!ENTITY", svg, flags=re.IGNORECASE):
        issues.append("DTD and entity declarations are not allowed.")

    if re.search(r"javascript\s*:", svg, flags=re.IGNORECASE):
        issues.append("JavaScript URLs are not allowed.")

    if error is not None or root is None:
        issues.append(error or "No SVG document was provided.")
        return _failed(_join_issues(issues))

    for element in root.iter():
        if not isinstance(element.tag, str):
            continue

        local = _local_name(element.tag)

        if local in DANGEROUS_ELEMENTS:
            issues.append(f"Forbidden element <{local}>.")
        elif local not in ALLOWED_ELEMENTS:
            issues.append(f"Unsupported element <{local}>.")

        for name, value in element.attrib.items():
            attribute = _local_name(name).lower()

            if attribute.startswith("on"):
                issues.append(f"Event handler attribute '{attribute}' is not allowed.")
            elif attribute in {"style", "transform"}:
                issues.append(f"Attribute '{attribute}' is not allowed.")
            elif attribute == "href":
                issues.append("External references via href are not allowed.")
            elif "url(" in value.lower():
                issues.append(f"Attribute '{name}' uses a url() reference.")

    if issues:
        return _failed(_join_issues(issues))

    return _passed("SVG uses only safe elements and attributes.")


def check_valid_svg(svg: str) -> CheckResult:
    root, error = _parse_svg(svg)
    return _check_valid_svg(root, error)


def check_within_viewbox(svg: str) -> CheckResult:
    root, error = _parse_svg(svg)
    return _check_within_viewbox(root, error)


def check_title_and_labels(svg: str) -> CheckResult:
    root, error = _parse_svg(svg)
    return _check_title_and_labels(root, error)


def check_has_animation(svg: str) -> CheckResult:
    root, error = _parse_svg(svg)
    return _check_has_animation(root, error)


def check_safe_svg(svg: str) -> CheckResult:
    root, error = _parse_svg(svg)
    return _check_safe_svg(root, error, svg)


def run_checks(svg: str) -> dict[CheckName, CheckResult]:
    root, error = _parse_svg(svg)

    return {
        "valid_svg": _check_valid_svg(root, error),
        "within_viewbox": _check_within_viewbox(root, error),
        "title_and_labels": _check_title_and_labels(root, error),
        "has_animation": _check_has_animation(root, error),
        "safe_svg": _check_safe_svg(root, error, svg),
    }


def format_feedback(results: dict[CheckName, CheckResult]) -> str:
    return "\n".join(
        f"- {name}: {result.message}"
        for name, result in results.items()
        if not result.passed
    )