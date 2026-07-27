#!/usr/bin/env python3
"""Validate SHS BOS V1.2 Package H Batch 02 planning artifacts."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RELEASES = ROOT / "docs" / "releases"
MANIFEST_PATH = RELEASES / "SHS_BOS_V1_2_PACKAGE_H_BATCH_02_PLAN_MANIFEST.json"
DEVELOPMENT_MANIFEST_PATH = RELEASES / "SHS_BOS_V1_2_DEVELOPMENT_MANIFEST.json"
PACKAGE_H_BATCH_01_COMMIT = "185ee97db7cd8c44bdcf97b74e3194862087ce89"

PLANNING_DOCS = (
    "SHS_BOS_V1_2_PACKAGE_H_BATCH_02_BLUEPRINT.md",
    "SHS_BOS_V1_2_PACKAGE_H_BATCH_02_OWNERSHIP_MAP.md",
    "SHS_BOS_V1_2_PACKAGE_H_BATCH_02_RESTORATION_READINESS.md",
    "SHS_BOS_V1_2_PACKAGE_H_BATCH_02_ACCEPTANCE_CRITERIA.md",
    "SHS_BOS_V1_2_PACKAGE_H_BATCH_02_PLAN_MANIFEST.json",
)

IMPLEMENTATION_PATH_MARKERS = (
    "services/shf-agent-fabric/services/owner_onboarding/",
    "services/shf-agent-fabric/routers/extension_owner_onboarding_routes.py",
    "services/shf-agent-fabric/main.py",
    "src/",
)

BROAD_AUTHORIZATION_MARKERS = (
    "services/**",
    "src/**",
    "tests/**",
    "docs/**",
)

REQUIRED_ACCEPTANCE_PREFIXES = (
    "PHB02-ARCH-",
    "PHB02-CONTRACT-",
    "PHB02-RUNTIME-",
    "PHB02-SEC-",
    "PHB02-EVID-",
    "PHB02-TEST-",
    "PHB02-GOV-",
)


def fail(message: str) -> None:
    print(f"SHS BOS V1.2 Package H Batch 02 blueprint validation: FAIL - {message}")
    sys.exit(1)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        fail(f"cannot read {path.relative_to(ROOT)}: {exc}")


def load_json(path: Path) -> dict:
    try:
        return json.loads(read_text(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def validate_planning_docs() -> dict[str, str]:
    texts: dict[str, str] = {}
    for name in PLANNING_DOCS:
        path = RELEASES / name
        require(path.exists(), f"missing planning document: {path.relative_to(ROOT)}")
        texts[name] = read_text(path)
    return texts


def validate_manifest(manifest: dict) -> None:
    require(manifest.get("schema_version") == "1.0", "schema version mismatch")
    require(manifest.get("product") == "SHS BOS", "product mismatch")
    require(manifest.get("development_release") == "V1.2", "development release mismatch")
    require(manifest.get("package") == "H", "package mismatch")
    require(manifest.get("batch") == "02", "batch mismatch")
    require(manifest.get("mission") == "PACKAGE_H_BATCH_02_BLUEPRINT_AND_RESTORATION_READINESS", "mission mismatch")
    require(manifest.get("mission_type") == "PLANNING_ONLY", "mission must be planning-only")
    require(manifest.get("implementation_authorized") is False, "implementation must remain unauthorized")
    require(manifest.get("runtime_changes_authorized") is False, "runtime changes must remain unauthorized")
    require(manifest.get("archive_restoration_authorized") is False, "archive restoration must remain unauthorized")
    require(manifest.get("new_layer_authorized") is False, "new layer must remain unauthorized")
    require(manifest.get("owner_neutrality_required") is True, "owner neutrality must be required")
    require(manifest.get("package_h_batch_01_commit") == PACKAGE_H_BATCH_01_COMMIT, "Package H Batch 01 anchor mismatch")
    require(bool(manifest.get("authoritative_purpose")), "authoritative purpose is missing")
    require(manifest.get("in_scope"), "in-scope list is missing")
    require(manifest.get("out_of_scope"), "out-of-scope list is missing")
    require(manifest.get("canonical_owners"), "canonical owners are not mapped")
    require(manifest.get("candidate_inventory"), "candidate inventory is missing")
    require(manifest.get("restoration_decision") == "SELECTIVE_CONCEPTUAL_REUSE_ONLY", "restoration decision mismatch")
    require(manifest.get("future_authorized_paths"), "future authorized paths are missing")
    require(manifest.get("future_prohibited_paths"), "future prohibited paths are missing")
    require(manifest.get("acceptance_criteria"), "acceptance criteria are missing")
    require(manifest.get("blocking_questions") == [], "blocking questions must be explicit and empty")
    require(manifest.get("next_mission") == "PACKAGE_H_BATCH_02_IMPLEMENTATION", "next mission must be implementation")
    require(manifest.get("planning_status") == "VALIDATED", "planning status must be validated")

    for marker in BROAD_AUTHORIZATION_MARKERS:
        require(
            all(item.get("path") != marker for item in manifest.get("future_authorized_paths", []) if isinstance(item, dict)),
            f"future authorized path is too broad: {marker}",
        )

    future_paths = [item.get("path", "") for item in manifest.get("future_authorized_paths", []) if isinstance(item, dict)]
    for path in future_paths:
        require(path and not path.endswith("/**"), f"future authorized path is not narrow: {path}")
        require(not any(path.startswith(marker) for marker in IMPLEMENTATION_PATH_MARKERS), f"implementation path is prohibited: {path}")

    criteria = manifest.get("acceptance_criteria", [])
    for prefix in REQUIRED_ACCEPTANCE_PREFIXES:
        require(any(str(item).startswith(prefix) for item in criteria), f"missing acceptance criterion family: {prefix}")

    dispositions = {item.get("disposition") for item in manifest.get("candidate_inventory", []) if isinstance(item, dict)}
    require("UNSAFE_TO_RESTORE" in dispositions, "unsafe archive disposition not recorded")
    require("REWRITE_FROM_REQUIREMENTS" in dispositions, "rewrite archive disposition not recorded")
    require("REUSE_CONCEPT_ONLY" in dispositions, "concept-only archive disposition not recorded")


def validate_development_manifest(manifest: dict) -> None:
    require(manifest.get("implementation_authorized") is False, "development manifest authorized implementation")
    require(manifest.get("runtime_changes_authorized") is False, "development manifest authorized runtime changes")
    require(manifest.get("archive_restoration_authorized") is False, "development manifest authorized archive restoration")
    require(manifest.get("new_layer_authorized") is False, "development manifest authorized new layer")
    anchors = manifest.get("package_anchors", {})
    require(anchors.get("package_h_batch_01", {}).get("peeled_commit") == PACKAGE_H_BATCH_01_COMMIT, "development manifest Package H Batch 01 anchor mismatch")
    require(manifest.get("active_package_mission") == "PACKAGE_H_BATCH_02_BLUEPRINT_AND_RESTORATION_READINESS", "active package mission mismatch")
    require(manifest.get("current_mission_type") == "PLANNING_ONLY", "current mission type mismatch")
    require(manifest.get("package_h_batch_02_implementation_authorized") is False, "Package H Batch 02 implementation must remain unauthorized")


def validate_text_consistency(texts: dict[str, str], manifest: dict) -> None:
    blueprint = texts["SHS_BOS_V1_2_PACKAGE_H_BATCH_02_BLUEPRINT.md"]
    ownership = texts["SHS_BOS_V1_2_PACKAGE_H_BATCH_02_OWNERSHIP_MAP.md"]
    restoration = texts["SHS_BOS_V1_2_PACKAGE_H_BATCH_02_RESTORATION_READINESS.md"]
    criteria = texts["SHS_BOS_V1_2_PACKAGE_H_BATCH_02_ACCEPTANCE_CRITERIA.md"]

    purpose = manifest["authoritative_purpose"]
    require(purpose in blueprint, "manifest purpose is not present in blueprint")
    require("RESTORATION_READINESS=SELECTIVE_CONCEPTUAL_REUSE_ONLY" in restoration, "restoration readiness line missing")
    require("Blocking ownership questions remaining: none." in ownership, "ownership map hides blocking questions")
    require("Unresolved criteria: none." in criteria, "acceptance criteria unresolved status missing")

    required_terms = (
        "owner-neutral",
        "no new registry",
        "No archived implementation is approved for file restoration",
        "NO_NEW_UI",
        "No route or UI is authorized",
    )
    combined = "\n".join(texts.values())
    for term in required_terms:
        require(term in combined, f"required planning term missing: {term}")


def validate_no_current_implementation_paths() -> None:
    prohibited_existing = (
        ROOT / "services/shf-agent-fabric/services/owner_onboarding/service.py",
        ROOT / "services/shf-agent-fabric/routers/extension_owner_onboarding_routes.py",
    )
    for path in prohibited_existing:
        require(not path.exists(), f"archived implementation exists in active tree: {path.relative_to(ROOT)}")


def main() -> None:
    texts = validate_planning_docs()
    manifest = load_json(MANIFEST_PATH)
    development_manifest = load_json(DEVELOPMENT_MANIFEST_PATH)
    validate_manifest(manifest)
    validate_development_manifest(development_manifest)
    validate_text_consistency(texts, manifest)
    validate_no_current_implementation_paths()
    print("SHS BOS V1.2 Package H Batch 02 blueprint validation: PASS")


if __name__ == "__main__":
    main()
