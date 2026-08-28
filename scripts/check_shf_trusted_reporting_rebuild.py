#!/usr/bin/env python3
"""Validate the SHF Trusted Reporting controlled-rebuild registry structure."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


ALLOWED_CATEGORIES = {"KEEP", "REPLACE", "QUARANTINE", "DELETE"}
ALLOWED_STATUSES = {"ACTIVE_LEGACY", "REPLACEMENT_IN_PROGRESS", "QUARANTINED", "SAFE_TO_DELETE", "DELETED"}
REQUIRED_FIELDS = {
    "id",
    "path_component",
    "category",
    "current_authority",
    "target_authority",
    "replacement",
    "migration_stage",
    "dependency_notes",
    "delete_eligibility",
    "status",
    "evidence",
}


def validate_registry(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"registry_read_failed: {exc}"]

    if not isinstance(document, dict):
        return ["registry_root_must_be_object"]
    entries = document.get("entries")
    if not isinstance(entries, list) or not entries:
        return ["entries_must_be_nonempty_list"]

    seen: set[str] = set()
    for index, entry in enumerate(entries):
        prefix = f"entries[{index}]"
        if not isinstance(entry, dict):
            errors.append(f"{prefix}_must_be_object")
            continue
        missing = sorted(REQUIRED_FIELDS - set(entry))
        if missing:
            errors.append(f"{prefix}_missing:{','.join(missing)}")
        entry_id = entry.get("id")
        if not isinstance(entry_id, str) or not entry_id.strip():
            errors.append(f"{prefix}_id_missing")
        elif entry_id in seen:
            errors.append(f"duplicate_id:{entry_id}")
        else:
            seen.add(entry_id)

        category = entry.get("category")
        if category not in ALLOWED_CATEGORIES:
            errors.append(f"{prefix}_invalid_category:{category}")
        status = entry.get("status")
        if status not in ALLOWED_STATUSES:
            errors.append(f"{prefix}_invalid_status:{status}")

        evidence = entry.get("evidence")
        if not isinstance(evidence, list) or not evidence or not all(isinstance(item, str) and item.strip() for item in evidence):
            errors.append(f"{prefix}_evidence_required")

        if category == "KEEP" and not str(entry.get("current_authority") or "").strip():
            errors.append(f"{prefix}_keep_authority_required")
        if category == "REPLACE" and not str(entry.get("migration_stage") or "").strip():
            errors.append(f"{prefix}_replace_stage_required")
        if category == "QUARANTINE":
            target = str(entry.get("target_authority") or "").lower()
            if "canonical" in target or "institutional truth" in target:
                errors.append(f"{prefix}_quarantine_cannot_target_canonical_authority")
        if category == "DELETE":
            replacement = entry.get("replacement")
            reason = entry.get("no_replacement_reason")
            if not str(replacement or reason or "").strip():
                errors.append(f"{prefix}_delete_replacement_or_reason_required")
            if not str(entry.get("delete_eligibility") or "").strip() or entry.get("delete_eligibility") == "not_applicable":
                errors.append(f"{prefix}_delete_gate_required")
            if status == "SAFE_TO_DELETE" and len(evidence) < 2:
                errors.append(f"{prefix}_safe_to_delete_requires_multiple_evidence_items")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--registry", type=Path, default=Path("docs/SHF_TRUSTED_REPORTING_REBUILD_REGISTRY.v1.json"))
    args = parser.parse_args()
    errors = validate_registry(args.registry)
    if errors:
        print(json.dumps({"ok": False, "errors": errors}, sort_keys=True))
        return 1
    entries = json.loads(args.registry.read_text(encoding="utf-8"))["entries"]
    print(json.dumps({"ok": True, "entry_count": len(entries), "categories": sorted(ALLOWED_CATEGORIES)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
