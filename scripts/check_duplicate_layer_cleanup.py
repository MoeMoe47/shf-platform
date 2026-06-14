#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]

HIGH_RISK_DUPLICATES = [
    Path("services/shf-agent-fabric/routers/admin_agents_routes 2.py"),
    Path("services/shf-agent-fabric/routers/watchtower_attest_routes.py"),
    Path("services/shf-agent-fabric/routers/admin_routes.py"),
]

OFFICIAL_REPLACEMENTS = [
    Path("services/shf-agent-fabric/routers/admin_agents_routes.py"),
    Path("services/shf-agent-fabric/routers/watchtower_attestation_routes.py"),
    Path("services/shf-agent-fabric/routers/admin_layers_routes.py"),
]

AUDIT_DOC = Path("docs/DUPLICATE_LAYER_AUDIT.md")
ARCHIVE_ROOT = Path("_archive/duplicate-layer-audit")


def main() -> int:
    failures: list[str] = []

    for rel in HIGH_RISK_DUPLICATES:
        if (ROOT / rel).exists():
            failures.append(f"high-risk duplicate still in active path: {rel}")

    for rel in OFFICIAL_REPLACEMENTS:
        if not (ROOT / rel).exists():
            failures.append(f"official replacement missing: {rel}")

    if not (ROOT / AUDIT_DOC).exists():
        failures.append(f"audit doc missing: {AUDIT_DOC}")

    manifests = []
    archive_dir = ROOT / ARCHIVE_ROOT
    if archive_dir.exists():
        manifests = list(archive_dir.glob("*/ARCHIVE_MANIFEST.md"))
    if not manifests:
        failures.append(f"archive manifest missing under: {ARCHIVE_ROOT}")

    if failures:
        print("FAIL: duplicate layer cleanup checks failed")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        "PASS: duplicate layer cleanup checks passed "
        f"({len(HIGH_RISK_DUPLICATES)} high-risk duplicates archived; "
        f"{len(OFFICIAL_REPLACEMENTS)} official replacements present)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
