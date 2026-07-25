from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, order=True)
class SemanticVersion:
    major: int
    minor: int
    patch: int

    def as_string(self) -> str:
        return f"{self.major}.{self.minor}.{self.patch}"


def parse_semantic_version(value: str) -> SemanticVersion:
    parts = value.split(".")
    if len(parts) != 3:
        raise ValueError(f"expected semantic version major.minor.patch: {value}")
    try:
        major, minor, patch = (int(part) for part in parts)
    except ValueError as exc:
        raise ValueError(f"semantic version parts must be integers: {value}") from exc
    if major < 0 or minor < 0 or patch < 0:
        raise ValueError(f"semantic version parts must be non-negative: {value}")
    return SemanticVersion(major=major, minor=minor, patch=patch)


def is_compatible_version(version: str, compatibility: str) -> bool:
    return parse_semantic_version(version).major == parse_semantic_version(compatibility).major


def is_deprecated(version: str, deprecated_versions: tuple[str, ...]) -> bool:
    parsed = parse_semantic_version(version)
    return any(parsed == parse_semantic_version(item) for item in deprecated_versions)
