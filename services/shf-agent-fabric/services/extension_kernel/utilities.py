from __future__ import annotations

import re

_IDENTIFIER_PATTERN = re.compile(r"^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$")


def is_stable_identifier(value: str) -> bool:
    return bool(_IDENTIFIER_PATTERN.fullmatch(value))


def normalize_labels(labels: tuple[str, ...]) -> tuple[str, ...]:
    return tuple(sorted({label.strip().lower() for label in labels if label.strip()}))
