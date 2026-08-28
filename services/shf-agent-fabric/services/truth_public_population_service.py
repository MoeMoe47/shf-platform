from __future__ import annotations

"""Claim-version eligibility for governed aggregate public populations.

This authority is deliberately separate from Truth ``public_approved``. The
append-only JSONL store matches the current Truth Spine development persistence
model; production durability remains a deployment prerequisite.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from auth.permissions import TRUTH_PUBLIC_POPULATION_APPROVE, TRUTH_PUBLIC_POPULATION_REVOKE, has_permission
from services import truth_history_service, truth_public_population_authority_service, truth_public_population_postgres_repository as durable_repo, truth_spine_service

SERVICE_ROOT = Path(__file__).resolve().parents[1]
ELIGIBILITY_PATH = Path(os.getenv("SHF_TRUTH_PUBLIC_POPULATION_PATH", str(SERVICE_ROOT / "db" / "truth" / "public_population_eligibility.jsonl")))

REGISTERED_PREDICATES = {
    ("curriculum_completion", "completed_lesson"),
    ("hub_referral_created", "referral_created"),
}


class PublicPopulationEligibilityError(ValueError):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _scope(actor: Any, claim: Dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
    organization_id = getattr(actor, "organization_id", None)
    if organization_id and organization_id != claim.get("organization_id"):
        raise PublicPopulationEligibilityError("organization_scope_mismatch")
    if not organization_id and not truth_spine_service._actor_has_global_scope(actor):
        raise PublicPopulationEligibilityError("actor_missing_organization_scope")
    tenant_id = getattr(actor, "tenant_id", None) or claim.get("tenant_id")
    if claim.get("tenant_id") and tenant_id and claim.get("tenant_id") != tenant_id:
        raise PublicPopulationEligibilityError("tenant_scope_mismatch")
    return tenant_id, claim.get("organization_id")


def _read_events() -> List[Dict[str, Any]]:
    if durable_repo.is_postgres_mode():
        try:
            return [dict(row, approved_by=row.pop("actor_user_id", "")) for row in durable_repo.read_eligibility()]
        except durable_repo.PublicPopulationDatabaseUnavailable as exc:
            raise PublicPopulationEligibilityError(str(exc)) from exc
    if not ELIGIBILITY_PATH.exists():
        return []
    events: List[Dict[str, Any]] = []
    with ELIGIBILITY_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(event, dict):
                events.append(event)
    return events


def _append(event: Dict[str, Any]) -> Dict[str, Any]:
    if durable_repo.is_postgres_mode():
        try:
            stored = durable_repo.append_eligibility(event)
        except durable_repo.PublicPopulationDatabaseUnavailable as exc:
            raise PublicPopulationEligibilityError(str(exc)) from exc
        return {**event, "eligibility_id": stored.get("eligibility_id", event.get("eligibility_id")), "status": stored.get("status", event.get("status")), "version": stored.get("version", event.get("version"))}
    ELIGIBILITY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ELIGIBILITY_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")
    return event


def _validate_claim(claim_id: str, version: int, actor: Any) -> Dict[str, Any]:
    claim = truth_spine_service.get_claim(claim_id)
    if not claim:
        raise PublicPopulationEligibilityError("claim_not_found")
    if int(claim.get("version", 0)) != int(version):
        raise PublicPopulationEligibilityError("claim_version_mismatch")
    _scope(actor, claim)
    if (claim.get("claim_type"), claim.get("predicate")) not in REGISTERED_PREDICATES:
        raise PublicPopulationEligibilityError("predicate_not_registered")
    if claim.get("superseded_by"):
        raise PublicPopulationEligibilityError("claim_superseded")
    if claim.get("verification_status") != "verified":
        raise PublicPopulationEligibilityError("claim_not_verified")
    if claim.get("internal_approval_status") != "approved":
        raise PublicPopulationEligibilityError("claim_not_internally_approved")
    if not claim.get("lineage_id") or not claim.get("source_ids") or not claim.get("evidence_ids"):
        raise PublicPopulationEligibilityError("claim_lineage_incomplete")
    sources = {source.get("source_id"): source for source in truth_spine_service.list_sources()}
    if any(sid not in sources for sid in claim.get("source_ids", [])):
        raise PublicPopulationEligibilityError("source_not_found")
    if any(sources[sid].get("verification_status") != "verified" for sid in claim.get("source_ids", [])):
        raise PublicPopulationEligibilityError("source_not_verified")
    return claim


def approve(claim_id: str, version: int, actor: Any, reason: str) -> Dict[str, Any]:
    if not has_permission(getattr(actor, "role", None), TRUTH_PUBLIC_POPULATION_APPROVE):
        raise PublicPopulationEligibilityError("permission_required")
    reason = str(reason or "").strip()
    if not reason:
        raise PublicPopulationEligibilityError("reason_required")
    claim = _validate_claim(claim_id, version, actor)
    try:
        signoff = truth_public_population_authority_service.resolve_signoff(claim)
    except truth_public_population_authority_service.PublicPopulationAuthorityError as exc:
        raise PublicPopulationEligibilityError(exc.reason) from exc
    if not signoff:
        raise PublicPopulationEligibilityError("institutional_signoff_required")
    tenant_id, organization_id = _scope(actor, claim)
    event = {
        "eligibility_id": f"ppe_{uuid.uuid4().hex[:16]}",
        "event_type": "truth.public_population_approved",
        "truth_claim_id": claim_id,
        "truth_version": int(version),
        "predicate": claim.get("predicate"),
        "tenant_id": tenant_id,
        "organization_id": organization_id,
        "status": "PUBLIC_POPULATION_ELIGIBLE",
        "institutional_authority_reference": signoff["institutional_authority_reference"],
        "authority_id": signoff["authority_id"],
        "signoff_id": signoff["signoff_id"],
        "approved_by": getattr(actor, "user_id", ""),
        "reason": reason,
        "created_at": _now(),
        "version": 1,
    }
    event = _append(event)
    truth_history_service.append_history_event(
        event_type="claim.public_population_approved",
        entity_type="claim",
        entity_id=claim_id,
        entity_version=int(version),
        organization_id=organization_id,
        tenant_id=tenant_id,
        actor_id=getattr(actor, "user_id", ""),
        reason=reason,
        new_state={"public_population_eligible": True, "eligibility_id": event["eligibility_id"]},
    )
    return event


def revoke(claim_id: str, eligibility_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    if not has_permission(getattr(actor, "role", None), TRUTH_PUBLIC_POPULATION_REVOKE):
        raise PublicPopulationEligibilityError("permission_required")
    reason = str(reason or "").strip()
    if not reason:
        raise PublicPopulationEligibilityError("reason_required")
    current = next((event for event in reversed(_read_events()) if event.get("eligibility_id") == eligibility_id), None)
    if not current or current.get("truth_claim_id") != claim_id or current.get("status") != "PUBLIC_POPULATION_ELIGIBLE":
        raise PublicPopulationEligibilityError("eligibility_not_active")
    claim = _validate_claim(claim_id, int(current["truth_version"]), actor)
    tenant_id, organization_id = _scope(actor, claim)
    event = {**current, "event_type": "truth.public_population_revoked", "status": "PUBLIC_POPULATION_REVOKED", "revoked_by": getattr(actor, "user_id", ""), "revoked_at": _now(), "reason": reason, "version": int(current.get("version", 1)) + 1, "tenant_id": tenant_id, "organization_id": organization_id}
    _append(event)
    truth_history_service.append_history_event(
        event_type="claim.public_population_revoked",
        entity_type="claim",
        entity_id=claim_id,
        entity_version=int(current["truth_version"]),
        organization_id=organization_id,
        tenant_id=tenant_id,
        actor_id=getattr(actor, "user_id", ""),
        reason=reason,
        previous_state={"public_population_eligible": True, "eligibility_id": eligibility_id},
        new_state={"public_population_eligible": False},
    )
    return event


def is_eligible(claim: Dict[str, Any]) -> bool:
    if not isinstance(claim, dict) or (claim.get("claim_type"), claim.get("predicate")) not in REGISTERED_PREDICATES:
        return False
    if claim.get("superseded_by") or claim.get("verification_status") != "verified" or claim.get("internal_approval_status") != "approved":
        return False
    try:
        events = [event for event in _read_events() if event.get("truth_claim_id") == claim.get("claim_id") and int(event.get("truth_version", -1)) == int(claim.get("version", -2))]
        if not (events and events[-1].get("status") == "PUBLIC_POPULATION_ELIGIBLE" and events[-1].get("organization_id") == claim.get("organization_id") and events[-1].get("predicate") == claim.get("predicate")):
            return False
        return truth_public_population_authority_service.resolve_signoff(claim) is not None
    except (PublicPopulationEligibilityError, truth_public_population_authority_service.PublicPopulationAuthorityError):
        return False


def list_events() -> List[Dict[str, Any]]:
    return _read_events()


def list_for_claim(claim_id: str, actor: Any) -> List[Dict[str, Any]]:
    claim = truth_spine_service.get_claim(claim_id)
    if not claim:
        raise PublicPopulationEligibilityError("claim_not_found")
    _scope(actor, claim)
    return [event for event in _read_events() if event.get("truth_claim_id") == claim_id]
