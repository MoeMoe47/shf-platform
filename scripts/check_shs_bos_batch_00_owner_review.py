#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
ARCH_DIR = ROOT / "docs" / "architecture"
REGISTRY_PATH = ROOT / "docs" / "MASTER_LAYER_REGISTRY.md"

EXPECTED_CANDIDATES = {
    "SHS-LAYER-007",
    "SHS-LAYER-008",
    "SHS-LAYER-012",
    "SHS-LAYER-040",
    "SHS-LAYER-057",
    "SHS-LAYER-058",
    "SHS-LAYER-059",
}

PACKAGE_D_DOCS = [
    "SHS_BOS_BATCH_00_OWNER_REVIEW_CLOSEOUT_V1.md",
    "SHS_BOS_BATCH_00_OWNER_REVIEW_CLOSEOUT_V1.json",
    "SHS_BOS_BATCH_00_CANDIDATE_EVIDENCE_PACKETS_V1.md",
    "SHS_BOS_BATCH_00_MIGRATION_AND_CONSOLIDATION_PLAN_V1.md",
    "SHS_BOS_BATCH_00_FINAL_BASELINE_SUMMARY_V1.md",
]

REQUIRED_DECISION_KEYS = {
    "candidate_id",
    "current_name",
    "final_name",
    "previous_classification",
    "final_classification",
    "final_family_id",
    "v1_disposition",
    "canonical_owner_layer_id",
    "authoritative_state_owner",
    "contract_updates",
    "chain_updates",
    "ownership_updates",
    "decision_rationale",
    "evidence",
    "evidence_confidence",
    "acceptance_criteria",
    "status",
}

ALLOWED_DISPOSITIONS = {"RETAIN", "MERGE", "RECLASSIFY", "ARCHIVE", "DEFER", "REJECT"}
NON_CANONICAL_ENDPOINTS = {
    "decision_required",
    "merge_into_existing_layer",
    "deferred_post_v1",
    "deprecated",
    "proposed_only",
    "not_a_layer",
}
APPROVAL_OVERSTATEMENTS = {
    "explicit human owner approval",
    "verified owner approval",
    "owner approved",
    "owner-approved",
    "approved by owner",
    "approved by owners",
    "all architecture work is approved",
}


def fail(rule: str, path: Path, expected: Any, actual: Any, candidate_id: str | None = None) -> None:
    target = str(path.relative_to(ROOT))
    candidate = f" candidate={candidate_id}" if candidate_id else ""
    print(f"FAIL: {rule} file={target}{candidate} expected={expected!r} actual={actual!r}")
    sys.exit(1)


def require_file(path: Path) -> None:
    if not path.is_file():
        fail("required file exists", path, "file present", "missing")


def read_text(path: Path) -> str:
    require_file(path)
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> dict[str, Any]:
    require_file(path)
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail("JSON parses", path, "valid JSON", str(exc))
    if not isinstance(payload, dict):
        fail("JSON root object", path, "object", type(payload).__name__)
    return payload


def run_validator(path: Path, label: str) -> None:
    require_file(path)
    result = subprocess.run(
        [sys.executable, str(path)],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=180,
        check=False,
    )
    if result.returncode != 0:
        output = "\n".join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
        fail(f"{label} validator passes", path, "exit code 0", output or result.returncode)


def disposition_for(decision: dict[str, Any]) -> str:
    classification = decision.get("final_classification")
    if classification == "merge_into_existing_layer":
        return "MERGE"
    if classification == "deferred_post_v1":
        return "DEFER"
    if classification in {"deprecated", "not_a_layer"}:
        return "REJECT"
    if decision.get("current_name") != decision.get("final_name") or decision.get("previous_classification") == "decision_required":
        return "RECLASSIFY"
    return "RETAIN"


def extract_batch_00_hunk(text: str) -> str:
    heading = "## Batch 00 Owner-Review Baseline"
    start = text.find(heading)
    if start == -1:
        fail("registry hunk exists", REGISTRY_PATH, heading, "missing")
    after_heading = text.find("\n", start)
    next_heading = text.find("\n## ", after_heading + 1)
    if next_heading == -1:
        fail("registry hunk bounded", REGISTRY_PATH, "next same-level heading", "missing")
    return text[start:next_heading]


def parse_registry_rows(hunk: str) -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    for line in hunk.splitlines():
        if not line.startswith("| SHS-LAYER-"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) != 6:
            fail("registry row shape", REGISTRY_PATH, "6 table cells", line)
        candidate_id, name, classification, family_id, owner, v1_disposition = cells
        rows[candidate_id] = {
            "final_name": name,
            "final_classification": classification,
            "final_family_id": family_id,
            "canonical_owner": owner,
            "v1_disposition": v1_disposition,
        }
    return rows


def validate_package_d_artifacts() -> dict[str, str]:
    texts: dict[str, str] = {}
    for name in PACKAGE_D_DOCS:
        path = ARCH_DIR / name
        require_file(path)
        if path.suffix == ".md":
            texts[name] = read_text(path)
    return texts


def validate_closeout(closeout: dict[str, Any], texts: dict[str, str]) -> list[dict[str, Any]]:
    path = ARCH_DIR / "SHS_BOS_BATCH_00_OWNER_REVIEW_CLOSEOUT_V1.json"
    decisions = closeout.get("candidate_decisions")
    if not isinstance(decisions, list):
        fail("candidate decisions list", path, "list", type(decisions).__name__)
    if closeout.get("candidate_count") != 7 or closeout.get("resolved_candidate_count") != 7:
        fail("candidate count", path, "candidate_count=7 and resolved_candidate_count=7", (closeout.get("candidate_count"), closeout.get("resolved_candidate_count")))
    if closeout.get("unresolved_candidate_count") != 0:
        fail("unresolved count", path, 0, closeout.get("unresolved_candidate_count"))
    if closeout.get("ownership_conflicts_after") != 0:
        fail("ownership conflict count", path, 0, closeout.get("ownership_conflicts_after"))

    candidate_ids = [item.get("candidate_id") for item in decisions]
    if set(candidate_ids) != EXPECTED_CANDIDATES:
        fail("candidate identity set", path, sorted(EXPECTED_CANDIDATES), sorted(candidate_ids))
    duplicates = [item for item, count in Counter(candidate_ids).items() if count > 1]
    if duplicates:
        fail("duplicate candidate IDs", path, "no duplicates", duplicates)

    closeout_md = texts["SHS_BOS_BATCH_00_OWNER_REVIEW_CLOSEOUT_V1.md"]
    evidence_md = texts["SHS_BOS_BATCH_00_CANDIDATE_EVIDENCE_PACKETS_V1.md"]
    migration_md = texts["SHS_BOS_BATCH_00_MIGRATION_AND_CONSOLIDATION_PLAN_V1.md"]
    baseline_md = texts["SHS_BOS_BATCH_00_FINAL_BASELINE_SUMMARY_V1.md"]

    expected_counts = {
        "final official-layer count": closeout.get("official_layer_count_after"),
        "final family count": closeout.get("family_count_after"),
        "ownership conflicts": closeout.get("ownership_conflicts_after"),
        "unresolved architecture decisions": closeout.get("unresolved_candidate_count"),
    }
    for label, value in expected_counts.items():
        if f"{label}: {value}" not in baseline_md:
            fail("baseline summary count agrees with JSON", ARCH_DIR / "SHS_BOS_BATCH_00_FINAL_BASELINE_SUMMARY_V1.md", f"{label}: {value}", "not found")

    for decision in decisions:
        candidate_id = decision["candidate_id"]
        missing = sorted(REQUIRED_DECISION_KEYS - set(decision))
        if missing:
            fail("candidate required fields", path, "all required fields", missing, candidate_id)
        inferred_disposition = disposition_for(decision)
        if inferred_disposition not in ALLOWED_DISPOSITIONS:
            fail("allowed disposition", path, sorted(ALLOWED_DISPOSITIONS), inferred_disposition, candidate_id)
        if decision.get("status") != "closed":
            fail("owner-review disposition recorded", path, "closed", decision.get("status"), candidate_id)
        if not decision.get("evidence"):
            fail("candidate evidence exists", path, "nonempty evidence", decision.get("evidence"), candidate_id)

        row = (
            f"| {candidate_id} | {decision['final_name']} | {decision['final_classification']} | "
            f"{decision['canonical_owner_layer_id']} | {decision['v1_disposition']} | {decision['evidence_confidence']} |"
        )
        if row not in closeout_md:
            fail("closeout Markdown uses JSON final_name values", ARCH_DIR / "SHS_BOS_BATCH_00_OWNER_REVIEW_CLOSEOUT_V1.md", row, "missing", candidate_id)
        for doc_name, text in (
            ("SHS_BOS_BATCH_00_CANDIDATE_EVIDENCE_PACKETS_V1.md", evidence_md),
            ("SHS_BOS_BATCH_00_MIGRATION_AND_CONSOLIDATION_PLAN_V1.md", migration_md),
        ):
            if candidate_id not in text:
                fail("Package D Markdown contains candidate ID", ARCH_DIR / doc_name, candidate_id, "missing", candidate_id)
    return decisions


def validate_package_c(decisions: list[dict[str, Any]]) -> None:
    family_doc = load_json(ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json")
    ownership_doc = load_json(ARCH_DIR / "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.json")
    contract_doc = load_json(ARCH_DIR / "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json")
    chain_doc = load_json(ARCH_DIR / "SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.json")

    layers = family_doc.get("layers", [])
    families = family_doc.get("families", [])
    ownership = ownership_doc.get("ownership", [])
    contracts = contract_doc.get("contracts", [])
    chains = chain_doc.get("chains", [])
    layer_by_id = {item.get("layer_id"): item for item in layers}
    family_ids = {item.get("family_id") for item in families}
    layer_ids = set(layer_by_id)
    official_ids = {item.get("layer_id") for item in layers if item.get("classification") == "official_layer"}

    state_owners: dict[str, str] = {}
    for item in ownership:
        owner = item.get("canonical_owner_layer_id")
        if owner not in layer_ids:
            fail("Package C ownership owner exists", ARCH_DIR / "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.json", "known layer", owner)
        state = item.get("state_name")
        if state in state_owners and state_owners[state] != owner:
            fail("singular authoritative state owner", ARCH_DIR / "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.json", state_owners[state], owner)
        state_owners[state] = owner

    for decision in decisions:
        candidate_id = decision["candidate_id"]
        layer = layer_by_id.get(candidate_id)
        if not layer:
            fail("Package C candidate exists", ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json", "candidate layer", "missing", candidate_id)
        if layer.get("classification") != decision["final_classification"]:
            fail("Package C classification matches Package D", ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json", decision["final_classification"], layer.get("classification"), candidate_id)
        if layer.get("primary_family_id") != decision["final_family_id"] or decision["final_family_id"] not in family_ids:
            fail("Package C family matches Package D", ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json", decision["final_family_id"], layer.get("primary_family_id"), candidate_id)
        if layer.get("owning_official_layer_id") != decision["canonical_owner_layer_id"]:
            fail("Package C canonical owner matches Package D", ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json", decision["canonical_owner_layer_id"], layer.get("owning_official_layer_id"), candidate_id)
        if decision["final_classification"] == "subsystem" and layer.get("owning_official_layer_id") not in official_ids:
            fail("subsystem owner is official", ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json", "official layer owner", layer.get("owning_official_layer_id"), candidate_id)
        if candidate_id == "SHS-LAYER-057":
            if decision["canonical_owner_layer_id"] != "SHS-LAYER-043":
                fail("SHS-LAYER-057 singular owner", ARCH_DIR / "SHS_BOS_BATCH_00_OWNER_REVIEW_CLOSEOUT_V1.json", "SHS-LAYER-043", decision["canonical_owner_layer_id"], candidate_id)
            merged_into = layer.get("merged_into_layer_ids", [])
            if "SHS-LAYER-043" not in merged_into:
                fail("SHS-LAYER-057 merged responsibility targets retain owner", ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json", "SHS-LAYER-043 in merged_into_layer_ids", merged_into, candidate_id)

        invalid_contracts = []
        for contract in contracts:
            for key in ("upstream_layer_id", "downstream_layer_id"):
                if contract.get(key) == candidate_id and decision["final_classification"] in NON_CANONICAL_ENDPOINTS:
                    invalid_contracts.append(contract.get("contract_id"))
        if invalid_contracts:
            fail("non-canonical candidate absent from contract endpoints", ARCH_DIR / "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json", "no endpoints", invalid_contracts, candidate_id)

        invalid_chains = [
            chain.get("chain_id")
            for chain in chains
            if candidate_id in chain.get("mandatory_steps", []) and decision["final_classification"] in NON_CANONICAL_ENDPOINTS
        ]
        if invalid_chains:
            fail("non-canonical candidate absent from operational chain steps", ARCH_DIR / "SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.json", "no steps", invalid_chains, candidate_id)


def validate_registry_hunk(decisions: list[dict[str, Any]]) -> None:
    hunk = extract_batch_00_hunk(read_text(REGISTRY_PATH))
    if "decision_required" in hunk:
        fail("registry hunk has no unresolved decision_required", REGISTRY_PATH, "absent", "decision_required")
    rows = parse_registry_rows(hunk)
    if set(rows) != EXPECTED_CANDIDATES:
        fail("registry hunk candidate IDs", REGISTRY_PATH, sorted(EXPECTED_CANDIDATES), sorted(rows))

    for decision in decisions:
        candidate_id = decision["candidate_id"]
        row = rows[candidate_id]
        for key in ("final_name", "final_classification", "final_family_id", "v1_disposition"):
            if row[key] != decision[key]:
                fail("registry hunk agrees with closeout JSON", REGISTRY_PATH, decision[key], row[key], candidate_id)

        owner_cell = row["canonical_owner"]
        if candidate_id == "SHS-LAYER-057":
            owner_prefix = owner_cell.split(";", 1)[0].strip()
            if owner_prefix != "SHS-LAYER-043":
                fail("SHS-LAYER-057 registry singular canonical owner", REGISTRY_PATH, "SHS-LAYER-043", owner_prefix, candidate_id)
            if "Merged Responsibilities:" not in owner_cell:
                fail("SHS-LAYER-057 supporting targets are not canonical owners", REGISTRY_PATH, "Merged Responsibilities label", owner_cell, candidate_id)
        elif owner_cell != decision["canonical_owner_layer_id"]:
            fail("registry canonical owner agrees with closeout JSON", REGISTRY_PATH, decision["canonical_owner_layer_id"], owner_cell, candidate_id)


def validate_approval_truth(texts: dict[str, str]) -> None:
    scanned = dict(texts)
    scanned["MASTER_LAYER_REGISTRY_BATCH_00_HUNK"] = extract_batch_00_hunk(read_text(REGISTRY_PATH))
    for name, text in scanned.items():
        lower = text.lower()
        for phrase in APPROVAL_OVERSTATEMENTS:
            if phrase in lower:
                path = REGISTRY_PATH if name == "MASTER_LAYER_REGISTRY_BATCH_00_HUNK" else ARCH_DIR / name
                fail("approval wording does not fabricate explicit owner approval", path, "truthful owner-review disposition language", phrase)


def main() -> None:
    texts = validate_package_d_artifacts()
    closeout = load_json(ARCH_DIR / "SHS_BOS_BATCH_00_OWNER_REVIEW_CLOSEOUT_V1.json")
    decisions = validate_closeout(closeout, texts)
    validate_package_c(decisions)
    validate_registry_hunk(decisions)
    validate_approval_truth(texts)

    run_validator(ROOT / "scripts" / "check_shs_bos_v1_layer_audit.py", "Package B")
    run_validator(ROOT / "scripts" / "check_shs_bos_layer_family_architecture.py", "Package C")

    print("PASS: SHS BOS Batch 00 owner-review validation OK.")
    print(f"candidate count: {len(decisions)}")
    print(f"candidate IDs: {', '.join(sorted(EXPECTED_CANDIDATES))}")
    print("approval posture: OWNER_REVIEW_DISPOSITION_RECORDED")
    print("SHS-LAYER-057 canonical owner: SHS-LAYER-043")


if __name__ == "__main__":
    main()
