#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

CHECKS = [
    ("docs/MASTER_LAYER_REGISTRY.md", ["AI/Swarm Layer"]),
    ("docs/AI_SWARM_GUARDRAILS_V1.md", []),
    ("services/shf-agent-fabric/services/ai_guardrails_service.py", []),
    ("services/shf-agent-fabric/routers/ai_guardrails_routes.py", ["/health", "/policies", "/check-output", "/decisions", "/audit-feed"]),
    ("docs/TRUTH_SPINE_GUARDRAILS.md", ["AI may not label anything verified", "public-approved"]),
    ("package.json", ["check:governance"]),
]


def main() -> int:
    missing: list[str] = []
    for relative_path, tokens in CHECKS:
        path = ROOT / relative_path
        if not path.exists():
            missing.append(f"missing file: {relative_path}")
            continue
        text = path.read_text(encoding="utf-8")
        for token in tokens:
            if token not in text:
                missing.append(f"{relative_path} missing token: {token}")

    if missing:
        print("FAIL: AI/Swarm Guardrails checks failed:")
        for item in missing:
            print(f"- {item}")
        return 1

    print("PASS: AI/Swarm Guardrails V1 checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
