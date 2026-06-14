#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

CHECKS = [
    ("docs/MASTER_LAYER_REGISTRY.md", ["Oracle Layer"]),
    ("docs/ORACLE_LAYER_V1.md", []),
    ("services/shf-agent-fabric/services/oracle_service.py", ["build_truth_package", "Truth", "package"]),
    ("services/shf-agent-fabric/routers/oracle_routes.py", ["/health", "/cases", "/rulings", "/rule"]),
    ("docs/TRUTH_SPINE_GUARDRAILS.md", ["Oracle cannot verify", "Oracle cannot public-approve"]),
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
        print("FAIL: Oracle Layer checks failed:")
        for item in missing:
            print(f"- {item}")
        return 1

    print("PASS: Oracle Layer V1 checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
