#!/usr/bin/env python3
"""Validate SHS BOS V1.2 initialization metadata."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "docs/releases/SHS_BOS_V1_2_DEVELOPMENT_BASELINE.md"
PLAN = ROOT / "docs/releases/SHS_BOS_V1_2_MISSION_PLAN.md"
MANIFEST = ROOT / "docs/releases/SHS_BOS_V1_2_DEVELOPMENT_MANIFEST.json"
VALIDATOR = ROOT / "scripts/check_shs_bos_v1_2_initialization.py"

AUTHORIZED_PATHS = [
    "docs/releases/SHS_BOS_V1_2_DEVELOPMENT_BASELINE.md",
    "docs/releases/SHS_BOS_V1_2_DEVELOPMENT_MANIFEST.json",
    "docs/releases/SHS_BOS_V1_2_MISSION_PLAN.md",
    "scripts/check_shs_bos_v1_2_initialization.py",
]

PACKAGE_ANCHORS = {
    "package_d_batch_00": "918e25fb8992460a42ce703d1f07c825a72458bc",
    "package_e_batch_01": "17b0458c4a897e5f1b22517f232ee767b4f43e44",
    "package_f_batch_02": "bdaecd00d91d9ae4ffdc39d0abfb25e06e6fa07b",
    "package_h_batch_01": "185ee97db7cd8c44bdcf97b74e3194862087ce89",
    "v1_1_release": "51d9bd571842c6f568ba636bef9dc03ed0b9f069",
}


def fail(message: str) -> None:
    print(f"SHS BOS V1.2 initialization validation: FAIL - {message}")
    sys.exit(1)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        fail(f"cannot read {path.relative_to(ROOT)}: {exc}")


def load_manifest() -> dict:
    try:
        return json.loads(read_text(MANIFEST))
    except json.JSONDecodeError as exc:
        fail(f"manifest JSON invalid: {exc}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def main() -> None:
    for path in (BASELINE, PLAN, MANIFEST, VALIDATOR):
        require(path.exists(), f"missing required file: {path.relative_to(ROOT)}")

    manifest = load_manifest()
    baseline = read_text(BASELINE)
    plan = read_text(PLAN)

    require(manifest.get("schema_version") == "1.0", "unrecognized schema version")
    require(manifest.get("product") == "SHS BOS", "product mismatch")
    require(manifest.get("development_release") == "V1.2", "development release mismatch")
    require(manifest.get("development_branch") == "v1.2-development", "development branch mismatch")
    require(manifest.get("baseline_release_tag") == "shs-bos-v1.1", "baseline release tag mismatch")
    require(manifest.get("baseline_release_commit") == "51d9bd571842c6f568ba636bef9dc03ed0b9f069", "baseline release commit mismatch")
    require(manifest.get("baseline_status") == "CERTIFIED_AND_IMMUTABLE", "baseline not marked immutable")
    require(manifest.get("implementation_authorized") is False, "implementation must not be authorized")
    require(manifest.get("runtime_changes_authorized") is False, "runtime changes must not be authorized")
    require(manifest.get("archive_restoration_authorized") is False, "archive restoration must not be authorized")
    require(manifest.get("new_layer_authorized") is False, "new layer must not be authorized")
    require(manifest.get("one_active_mission") is True, "one active mission not declared")
    require(manifest.get("owner_neutral_shared_infrastructure") is True, "owner-neutral shared infrastructure not declared")
    require(manifest.get("next_planned_mission") == "PACKAGE_H_BATCH_02_BLUEPRINT_AND_RESTORATION_READINESS", "next planned mission mismatch")
    require(manifest.get("initialization_status") in {"PENDING_VALIDATION", "VALIDATED_PENDING_COMMIT"}, "initialization status inconsistent")

    anchors = manifest.get("package_anchors", {})
    for key, commit in PACKAGE_ANCHORS.items():
        require(anchors.get(key, {}).get("peeled_commit") == commit, f"package anchor missing or mismatched: {key}")

    require(manifest.get("authorized_paths") == AUTHORIZED_PATHS, "authorized paths differ from required four-file boundary")
    prohibited = "\n".join(manifest.get("prohibited_path_classes", []))
    require("runtime state" in prohibited and "implementation code" in prohibited, "runtime or implementation prohibitions missing")
    require(manifest.get("planned_missions", [])[-1] == "Mission 10: SHS BOS V1.2 Release Closure", "mission sequence must end with V1.2 release closure")

    required_baseline_terms = [
        "V1.1 is frozen.",
        "V1.2 does not reopen V1.1.",
        "Implementation authorized by this initialization mission: NO",
        "Archived candidate restoration authorized: NO",
        "Runtime changes authorized: NO",
        "Owners register with shared infrastructure.",
    ]
    for term in required_baseline_terms:
        require(term in baseline, f"baseline missing term: {term}")

    required_plan_terms = [
        "Each future mission requires a separate Codex prompt and separate authorization.",
        "Mission 02: Package H Batch 02 Blueprint and Restoration-Readiness Review",
        "Mission 10: SHS BOS V1.2 Release Closure",
        "Prohibited scope: Runtime changes, implementation changes, archived candidate restoration, package implementation.",
    ]
    for term in required_plan_terms:
        require(term in plan, f"mission plan missing term: {term}")

    require("Package H Batch 02 implementation" in "\n".join(manifest.get("deferred_scope", [])), "Package H Batch 02 implementation not deferred")
    require("Package H Batch 03" in "\n".join(manifest.get("deferred_scope", [])), "Package H Batch 03 not deferred")

    print("SHS BOS V1.2 initialization validation: PASS")


if __name__ == "__main__":
    main()
