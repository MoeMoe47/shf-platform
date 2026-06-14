#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PROPOSAL_PATH = ROOT / "docs" / "ARCHITECTURE_CHANGE_PROPOSAL_TEMPLATE.md"

REQUIRED_HEADINGS = [
    "Proposed Change",
    "Existing Layer Affected",
    "Why Existing Layers Cannot Support It",
    "Missing Support Need",
    "Safety/Governance/Reporting/Funding Reason",
    "Truth Spine Impact",
    "Watchtower Impact",
    "LOO Impact",
    "Alignment Impact",
    "Reports Impact",
    "Rollback Plan",
    "Approval Checklist",
]


def main() -> int:
    proposal_path = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_PROPOSAL_PATH
    if not proposal_path.is_absolute():
        proposal_path = ROOT / proposal_path

    if not proposal_path.exists():
        print(f"FAIL: missing architecture proposal file: {proposal_path}")
        return 1

    text = proposal_path.read_text(encoding="utf-8")
    missing = [heading for heading in REQUIRED_HEADINGS if f"## {heading}" not in text]

    if missing:
        print("FAIL: architecture proposal missing required headings:")
        for heading in missing:
            print(f"- {heading}")
        return 1

    print(f"PASS: Architecture proposal headings present in {proposal_path.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
