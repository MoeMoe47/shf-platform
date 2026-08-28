from __future__ import annotations

"""
Truth Spine legacy-data migration (Truth Spine security remediation).

Classifies and upgrades pre-existing claims.json / sources.json records that
predate the actor/organization/ownership_status/version fields introduced
by this remediation. Every legacy record is classified conservatively as
OWNERSHIP_LEGACY_UNSCOPED - it keeps its data, but:

  - can never be publicly visible (is_publicly_visible() in
    truth_spine_service.py explicitly excludes OWNERSHIP_LEGACY_UNSCOPED),
  - cannot be approved/revoked/verified through the normal secured
    endpoints until an authority with global scope explicitly re-scopes it
    to a real organization_id (a deliberate follow-up action, not
    performed by this migration),
  - has its pre-existing public_approved / verification_status values
    PRESERVED for reference under legacy_* keys but NOT trusted as live
    authorization state - the live public_approved is always forced False.

This module is dry-run by default (compute_migration_plan) and only writes
when explicitly told to via migrate() with dry_run=False AND an explicit
output path that is NOT the live claims.json/sources.json path - see
apply_migration_to_files()'s guard. It does not print record contents to
stdout/logs (only counts and IDs).

IMPORTANT: as of this remediation pass, this migration has been
implemented and tested against fixtures only (see
tests/test_truth_migration.py). It has NOT been executed against the real
services/shf-agent-fabric/db/truth/claims.json / sources.json files - see
docs/TRUTH_SPINE_SECURITY.md's migration section for why, and for the
explicit-authorization step required before it is run for real.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

from services.truth_spine_service import OWNERSHIP_LEGACY_UNSCOPED

MIGRATION_MARKER = "truth_migration_v1_applied"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _needs_migration(record: Dict[str, Any]) -> bool:
    return not bool(record.get(MIGRATION_MARKER))


def migrate_claim_record(claim: Dict[str, Any]) -> Dict[str, Any]:
    if not _needs_migration(claim):
        return claim  # idempotent: already migrated, unchanged
    migrated = dict(claim)
    migrated["legacy_public_approved_flag"] = bool(claim.get("public_approved"))
    migrated["legacy_verification_status_flag"] = claim.get("verification_status")
    migrated["public_approved"] = False
    migrated["approved_by"] = None
    migrated["approved_at"] = None
    migrated["approval_reason"] = ""
    migrated["revoked_by"] = None
    migrated["revoked_at"] = None
    migrated["revocation_reason"] = ""
    migrated["version"] = migrated.get("version") or 1
    migrated["previous_version_id"] = migrated.get("previous_version_id")
    migrated["superseded_by"] = migrated.get("superseded_by")
    migrated["organization_id"] = None
    migrated["ownership_status"] = OWNERSHIP_LEGACY_UNSCOPED
    migrated["created_by"] = migrated.get("created_by") or "legacy_migration"
    migrated["migrated_at"] = _now()
    migrated[MIGRATION_MARKER] = True
    return migrated


def migrate_source_record(source: Dict[str, Any]) -> Dict[str, Any]:
    if not _needs_migration(source):
        return source
    migrated = dict(source)
    migrated["legacy_verification_status_flag"] = source.get("verification_status")
    migrated["organization_id"] = None
    migrated["ownership_status"] = OWNERSHIP_LEGACY_UNSCOPED
    migrated["created_by"] = migrated.get("created_by") or "legacy_migration"
    migrated["verified_by"] = migrated.get("verified_by")
    migrated["verified_at"] = migrated.get("verified_at")
    migrated["verification_reason"] = migrated.get("verification_reason") or ""
    migrated["migrated_at"] = _now()
    migrated[MIGRATION_MARKER] = True
    return migrated


def compute_migration_plan(claims: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Read-only. Returns counts and identifiers only - never prints or
    returns full record contents, per the no-sensitive-content-in-logs
    requirement."""
    claims_to_migrate = [c for c in claims if _needs_migration(c)]
    sources_to_migrate = [s for s in sources if _needs_migration(s)]
    claims_already_migrated = len(claims) - len(claims_to_migrate)
    sources_already_migrated = len(sources) - len(sources_to_migrate)
    return {
        "claims_total": len(claims),
        "claims_to_migrate": len(claims_to_migrate),
        "claims_already_migrated": claims_already_migrated,
        "claim_ids_to_migrate": [c.get("claim_id") for c in claims_to_migrate],
        "sources_total": len(sources),
        "sources_to_migrate": len(sources_to_migrate),
        "sources_already_migrated": sources_already_migrated,
        "source_ids_to_migrate": [s.get("source_id") for s in sources_to_migrate],
        "claims_previously_public_approved": [
            c.get("claim_id") for c in claims_to_migrate if bool(c.get("public_approved"))
        ],
    }


def migrate(claims: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Pure, deterministic, idempotent transform - does not touch any
    file. Callers decide where (if anywhere) to write the result."""
    migrated_claims = [migrate_claim_record(c) for c in claims]
    migrated_sources = [migrate_source_record(s) for s in sources]
    return migrated_claims, migrated_sources


def apply_migration_to_files(
    claims_path: Path,
    sources_path: Path,
    output_claims_path: Path,
    output_sources_path: Path,
    *,
    dry_run: bool = True,
) -> Dict[str, Any]:
    """Reads claims_path/sources_path, computes the migration, and - only
    if dry_run is False - writes the result to output_claims_path /
    output_sources_path (which MUST differ from the input paths; this
    function refuses to overwrite its own input, as a guard against
    accidentally being pointed at the live store and asked to
    self-overwrite in a single step). Always returns the plan/report;
    never logs record contents."""
    if not dry_run and (output_claims_path == claims_path or output_sources_path == sources_path):
        raise ValueError(
            "apply_migration_to_files refuses to write output to the same path as its input - "
            "write to a new path and review it before manually promoting it, per the migration "
            "safety requirements in docs/TRUTH_SPINE_SECURITY.md."
        )
    claims = json.loads(claims_path.read_text(encoding="utf-8") or "[]") if claims_path.exists() else []
    sources = json.loads(sources_path.read_text(encoding="utf-8") or "[]") if sources_path.exists() else []
    plan = compute_migration_plan(claims, sources)
    if dry_run:
        return {**plan, "dry_run": True, "written": False}

    migrated_claims, migrated_sources = migrate(claims, sources)
    output_claims_path.parent.mkdir(parents=True, exist_ok=True)
    output_sources_path.parent.mkdir(parents=True, exist_ok=True)
    output_claims_path.write_text(json.dumps(migrated_claims, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    output_sources_path.write_text(json.dumps(migrated_sources, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {**plan, "dry_run": False, "written": True, "output_claims_path": str(output_claims_path), "output_sources_path": str(output_sources_path)}
