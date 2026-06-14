#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "services/shf-agent-fabric/routers/truth_routes.py",
    "services/shf-agent-fabric/services/truth_spine_service.py",
    "docs/TRUTH_SPINE_V1.md",
    "docs/TRUTH_SPINE_GUARDRAILS.md",
    "docs/TRUTH_SPINE_FREEZE_V1.md",
]

TRUTH_ROUTE_TOKENS = [
    "/health",
    "/claims",
    "/sources",
    "/coverage",
    "/drift",
    "/package",
    "/replay",
    "/federation",
]

INTEGRATION_CHECKS = [
    ("services/shf-agent-fabric/routers/reports_routes.py", ["truth", "truth_summary"]),
    ("services/shf-agent-fabric/routers/watchtower_routes.py", ["truth_coverage", "truth_summary"]),
    ("services/shf-agent-fabric/routers/loo_routes.py", ["trust", "truth"]),
]


def _read_relative(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def main() -> int:
    missing: list[str] = []

    for path in REQUIRED_FILES:
        if not (ROOT / path).exists():
            missing.append(f"missing file: {path}")

    truth_routes_path = ROOT / "services/shf-agent-fabric/routers/truth_routes.py"
    if truth_routes_path.exists():
        truth_routes = truth_routes_path.read_text(encoding="utf-8")
        for token in TRUTH_ROUTE_TOKENS:
            if token not in truth_routes:
                missing.append(f"truth_routes.py missing route token: {token}")

    for path, tokens in INTEGRATION_CHECKS:
        file_path = ROOT / path
        if not file_path.exists():
            missing.append(f"missing file: {path}")
            continue
        text = _read_relative(path)
        for token in tokens:
            if token not in text:
                missing.append(f"{path} missing integration token: {token}")

    if missing:
        print("FAIL: Truth Spine freeze checks failed:")
        for item in missing:
            print(f"- {item}")
        return 1

    print("PASS: Truth Spine V1 freeze checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
