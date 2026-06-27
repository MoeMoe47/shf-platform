#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LAYER_MD_PATH = ROOT / "docs" / "SHS_DIRECT_CONNECT_LAYER_V1.md"
CORRECTION_MD_PATH = ROOT / "docs" / "SHS_DIRECT_CONNECT_DIRECT_SOURCE_PROOF_CORRECTION.md"
CORRECTION_JSON_PATH = ROOT / "docs" / "SHS_DIRECT_CONNECT_DIRECT_SOURCE_PROOF_CORRECTION.json"

REQUIRED_KEYS = [
    "correction_name",
    "status",
    "mistake_corrected",
    "corrected_definition",
    "core_framing",
    "not_bank_account_connection_v1",
    "v1_priority_sources",
    "deferred_sensitive_sources",
    "files_reviewed",
    "files_changed",
    "shf_boundary_rules",
    "batch2_readiness",
    "verification_commands",
]

REQUIRED_LAYER_PHRASES = [
    "Direct-Source Proof Clarification",
    "Direct Connect does not mean bank account connection in V1",
    "Direct Connect means approved source-backed records",
    "source-trust layer",
    "approved records from client systems",
    "SHS systems",
    "files, forms, analytics, reports",
    "manual verified entries",
    "ClientOps records",
    "SHS internal operations",
    "approval workflows",
    "no live banking integration in V1",
    "banking and financial-account connection are deferred",
    "Financial data must never become public impact data by default",
    "Direct Connect does not bypass SHF approval",
]

REQUIRED_CORRECTION_PHRASES = [
    "Direct Connect does not mean bank account connection in V1",
    "Direct Connect means approved source-backed records",
    "Banking and financial-account connection are deferred",
]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def main() -> int:
    failures: list[str] = []

    for path in [LAYER_MD_PATH, CORRECTION_MD_PATH, CORRECTION_JSON_PATH]:
        if not path.exists():
            failures.append(f"missing file: {rel(path)}")

    data = {}
    if CORRECTION_JSON_PATH.exists():
        try:
            data = json.loads(CORRECTION_JSON_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            failures.append(f"invalid JSON: {rel(CORRECTION_JSON_PATH)}: {exc}")

    for key in REQUIRED_KEYS:
        if key not in data:
            failures.append(f"correction JSON missing required key: {key}")

    if data.get("core_framing") != "direct_source_proof":
        failures.append("correction JSON core_framing must equal direct_source_proof")
    if data.get("not_bank_account_connection_v1") is not True:
        failures.append("correction JSON not_bank_account_connection_v1 must be true")
    if not isinstance(data.get("v1_priority_sources"), list) or not data.get("v1_priority_sources"):
        failures.append("correction JSON v1_priority_sources must be non-empty")
    if not isinstance(data.get("deferred_sensitive_sources"), list) or not data.get("deferred_sensitive_sources"):
        failures.append("correction JSON deferred_sensitive_sources must be non-empty")

    if LAYER_MD_PATH.exists():
        layer_md = LAYER_MD_PATH.read_text(encoding="utf-8")
        for phrase in REQUIRED_LAYER_PHRASES:
            if phrase not in layer_md:
                failures.append(f"layer markdown missing required phrase: {phrase}")

    if CORRECTION_MD_PATH.exists():
        correction_md = CORRECTION_MD_PATH.read_text(encoding="utf-8")
        for phrase in REQUIRED_CORRECTION_PHRASES:
            if phrase not in correction_md:
                failures.append(f"correction report missing required phrase: {phrase}")

    if failures:
        print("FAIL: SHS Direct Connect direct-source proof checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: SHS Direct Connect direct-source proof correction checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
