from __future__ import annotations

"""Governed authority and sign-offs for aggregate Truth populations.

This is intentionally separate from raw ``public_approved`` and from
report-level disclosure/publication authorities. The Truth service currently
uses file-backed development persistence; deployment durability remains a
prerequisite for production claim approvals.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from auth.permissions import (
    TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE,
    TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE,
    has_permission,
)
from services import truth_history_service, truth_public_population_postgres_repository as durable_repo, truth_spine_service

SERVICE_ROOT = Path(__file__).resolve().parents[1]
AUTHORITY_PATH = Path(os.getenv("SHF_PUBLIC_POPULATION_AUTHORITY_PATH", str(SERVICE_ROOT / "db" / "truth" / "public_population_authorities.jsonl")))
SIGNOFF_PATH = Path(os.getenv("SHF_PUBLIC_POPULATION_SIGNOFF_PATH", str(SERVICE_ROOT / "db" / "truth" / "public_population_signoffs.jsonl")))

AUTHORITY_TYPE = "SHF_PRIVACY_DATA_GOVERNANCE_AUTHORITY"
DELEGATED_AUTHORITY_TYPE = "PUBLIC_AGGREGATE_POPULATION_APPROVAL_AUTHORITY"
SIGNOFF_TYPE = "PUBLIC_AGGREGATE_POPULATION_APPROVAL"
REGISTERED_PREDICATES = {("curriculum_completion", "completed_lesson"), ("hub_referral_created", "referral_created")}


class PublicPopulationAuthorityError(ValueError):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _read(path: Path) -> List[Dict[str, Any]]:
    if durable_repo.is_postgres_mode():
        try:
            rows = durable_repo.read_authorities() if path == AUTHORITY_PATH else durable_repo.read_signoffs()
        except durable_repo.PublicPopulationDatabaseUnavailable as exc:
            raise PublicPopulationAuthorityError(str(exc)) from exc
        normalized = []
        for row in rows:
            item = dict(row)
            if path == AUTHORITY_PATH:
                item["created_by"] = item.pop("actor_user_id", item.get("created_by", ""))
            else:
                item["signed_by"] = item.pop("actor_user_id", item.get("signed_by", ""))
            normalized.append(item)
        return normalized
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(item, dict):
                rows.append(item)
    return rows


def _append(path: Path, item: Dict[str, Any]) -> Dict[str, Any]:
    if durable_repo.is_postgres_mode():
        try:
            if path == AUTHORITY_PATH:
                stored = durable_repo.append_authority(item)
            else:
                stored = durable_repo.append_signoff(item)
        except durable_repo.PublicPopulationDatabaseUnavailable as exc:
            raise PublicPopulationAuthorityError(str(exc)) from exc
        return {**item, "authority_id": stored.get("authority_id", item.get("authority_id")), "signoff_id": stored.get("signoff_id", item.get("signoff_id")), "status": stored.get("status", item.get("status")), "version": stored.get("version", item.get("version"))}
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(item, sort_keys=True) + "\n")
    return item


def _scope(actor: Any, organization_id: Optional[str], tenant_id: Optional[str]) -> None:
    actor_org = getattr(actor, "organization_id", None)
    if actor_org and organization_id and actor_org != organization_id:
        raise PublicPopulationAuthorityError("organization_scope_mismatch")
    if not actor_org and not truth_spine_service._actor_has_global_scope(actor):
        raise PublicPopulationAuthorityError("actor_missing_organization_scope")
    actor_tenant = getattr(actor, "tenant_id", None)
    if actor_tenant and tenant_id and actor_tenant != tenant_id:
        raise PublicPopulationAuthorityError("tenant_scope_mismatch")


def _active_authority(authority_id: str, organization_id: Optional[str], tenant_id: Optional[str]) -> Optional[Dict[str, Any]]:
    current = next((row for row in reversed(_read(AUTHORITY_PATH)) if row.get("authority_id") == authority_id), None)
    if not current or current.get("status") != "ACTIVE":
        return None
    if organization_id is not None and current.get("organization_id") != organization_id:
        return None
    if tenant_id is not None and current.get("tenant_id") != tenant_id:
        return None
    now = datetime.now(timezone.utc)
    try:
        effective_from = current.get("effective_from")
        effective_to = current.get("effective_to")
        if isinstance(effective_from, str):
            effective_from = datetime.fromisoformat(effective_from)
        if isinstance(effective_to, str):
            effective_to = datetime.fromisoformat(effective_to)
        if effective_from and effective_from > now:
            return None
        if effective_to and effective_to <= now:
            return None
    except ValueError:
        return None
    if current.get("authority_type") == DELEGATED_AUTHORITY_TYPE and not _active_authority(current.get("parent_authority_id", ""), None, None):
        return None
    return current


def create_authority(actor: Any, authority_type: str, organization_id: Optional[str], tenant_id: Optional[str], parent_authority_id: Optional[str] = None, effective_from: Optional[str] = None, effective_to: Optional[str] = None) -> Dict[str, Any]:
    if not has_permission(getattr(actor, "role", None), TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE):
        raise PublicPopulationAuthorityError("permission_required")
    if not truth_spine_service._actor_has_global_scope(actor):
        raise PublicPopulationAuthorityError("global_authority_required")
    if authority_type not in {AUTHORITY_TYPE, DELEGATED_AUTHORITY_TYPE}:
        raise PublicPopulationAuthorityError("authority_type_not_allowed")
    if not organization_id or not tenant_id:
        raise PublicPopulationAuthorityError("authority_scope_required")
    if authority_type == DELEGATED_AUTHORITY_TYPE:
        parent = _active_authority(parent_authority_id or "", None, None)
        if not parent or parent.get("authority_type") != AUTHORITY_TYPE:
            raise PublicPopulationAuthorityError("active_delegating_authority_required")
        if parent.get("tenant_id") != tenant_id or parent.get("organization_id") != organization_id:
            raise PublicPopulationAuthorityError("delegated_scope_exceeds_parent")
    authority = {
        "authority_id": f"ppa_{uuid.uuid4().hex[:16]}",
        "authority_type": authority_type,
        "authority_reference": f"truth-population-authority:{uuid.uuid4().hex}",
        "tenant_id": tenant_id,
        "organization_id": organization_id,
        "parent_authority_id": parent_authority_id,
        "status": "ACTIVE",
        "effective_from": effective_from or _now(),
        "effective_to": effective_to,
        "created_by": getattr(actor, "user_id", ""),
        "created_at": _now(),
        "version": 1,
    }
    _append(AUTHORITY_PATH, authority)
    truth_history_service.append_history_event(event_type="public_population_authority.created", entity_type="institutional_authority", entity_id=authority["authority_id"], organization_id=organization_id, tenant_id=tenant_id, actor_id=getattr(actor, "user_id", ""), reason="Governed public population authority registered", new_state={"authority_type": authority_type, "status": "ACTIVE", "authority_reference": authority["authority_reference"]})
    return authority


def revoke_authority(authority_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    if not has_permission(getattr(actor, "role", None), TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE):
        raise PublicPopulationAuthorityError("permission_required")
    reason = str(reason or "").strip()
    if not reason:
        raise PublicPopulationAuthorityError("reason_required")
    current = next((row for row in reversed(_read(AUTHORITY_PATH)) if row.get("authority_id") == authority_id), None)
    if not current or current.get("status") != "ACTIVE":
        raise PublicPopulationAuthorityError("authority_not_active")
    _scope(actor, current.get("organization_id"), current.get("tenant_id"))
    revoked = {**current, "event_type": "public_population_authority.revoked", "status": "REVOKED", "revoked_by": getattr(actor, "user_id", ""), "revoked_at": _now(), "reason": reason, "version": int(current.get("version", 1)) + 1}
    _append(AUTHORITY_PATH, revoked)
    truth_history_service.append_history_event(event_type="public_population_authority.revoked", entity_type="institutional_authority", entity_id=authority_id, organization_id=current.get("organization_id"), tenant_id=current.get("tenant_id"), actor_id=getattr(actor, "user_id", ""), reason=reason, new_state={"status": "REVOKED"})
    return revoked


def signoff_claim(claim_id: str, truth_version: int, authority_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    if not has_permission(getattr(actor, "role", None), TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE):
        raise PublicPopulationAuthorityError("permission_required")
    reason = str(reason or "").strip()
    if not reason:
        raise PublicPopulationAuthorityError("reason_required")
    claim = truth_spine_service.get_claim(claim_id)
    if not claim:
        raise PublicPopulationAuthorityError("claim_not_found")
    if int(claim.get("version", 0)) != int(truth_version):
        raise PublicPopulationAuthorityError("claim_version_mismatch")
    if (claim.get("claim_type"), claim.get("predicate")) not in REGISTERED_PREDICATES:
        raise PublicPopulationAuthorityError("predicate_not_registered")
    if claim.get("superseded_by") or claim.get("verification_status") != "verified" or claim.get("internal_approval_status") != "approved":
        raise PublicPopulationAuthorityError("claim_prerequisites_not_satisfied")
    if not claim.get("lineage_id") or not claim.get("source_ids") or not claim.get("evidence_ids"):
        raise PublicPopulationAuthorityError("claim_lineage_incomplete")
    sources = {source.get("source_id"): source for source in truth_spine_service.list_sources()}
    if any(source_id not in sources for source_id in claim.get("source_ids", [])):
        raise PublicPopulationAuthorityError("source_not_found")
    if any(sources[source_id].get("verification_status") != "verified" for source_id in claim.get("source_ids", [])):
        raise PublicPopulationAuthorityError("source_not_verified")
    _scope(actor, claim.get("organization_id"), claim.get("tenant_id"))
    authority = _active_authority(authority_id, claim.get("organization_id"), claim.get("tenant_id"))
    if not authority:
        raise PublicPopulationAuthorityError("active_institutional_authority_required")
    signoff = {
        "signoff_id": f"ppso_{uuid.uuid4().hex[:16]}",
        "truth_claim_id": claim_id,
        "truth_version": int(truth_version),
        "predicate": claim.get("predicate"),
        "tenant_id": claim.get("tenant_id") or getattr(actor, "tenant_id", None),
        "organization_id": claim.get("organization_id"),
        "authority_id": authority_id,
        "institutional_authority_reference": authority["authority_reference"],
        "signoff_type": SIGNOFF_TYPE,
        "status": "APPROVED",
        "signed_by": getattr(actor, "user_id", ""),
        "signed_at": _now(),
        "reason": reason,
        "created_at": _now(),
        "version": 1,
    }
    signoff = _append(SIGNOFF_PATH, signoff)
    truth_history_service.append_history_event(event_type="public_population_signoff.approved", entity_type="institutional_signoff", entity_id=signoff["signoff_id"], entity_version=int(truth_version), organization_id=signoff["organization_id"], tenant_id=signoff["tenant_id"], actor_id=getattr(actor, "user_id", ""), reason=reason, new_state={"signoff_type": SIGNOFF_TYPE, "status": "APPROVED", "truth_claim_id": claim_id, "authority_id": authority_id})
    return signoff


def revoke_signoff(signoff_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    if not has_permission(getattr(actor, "role", None), TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE):
        raise PublicPopulationAuthorityError("permission_required")
    reason = str(reason or "").strip()
    if not reason:
        raise PublicPopulationAuthorityError("reason_required")
    current = next((row for row in reversed(_read(SIGNOFF_PATH)) if row.get("signoff_id") == signoff_id), None)
    if not current or current.get("status") != "APPROVED":
        raise PublicPopulationAuthorityError("signoff_not_active")
    _scope(actor, current.get("organization_id"), current.get("tenant_id"))
    revoked = {**current, "event_type": "public_population_signoff.revoked", "status": "REVOKED", "revoked_by": getattr(actor, "user_id", ""), "revoked_at": _now(), "reason": reason, "version": int(current.get("version", 1)) + 1}
    _append(SIGNOFF_PATH, revoked)
    truth_history_service.append_history_event(event_type="public_population_signoff.revoked", entity_type="institutional_signoff", entity_id=signoff_id, entity_version=int(current["truth_version"]), organization_id=current.get("organization_id"), tenant_id=current.get("tenant_id"), actor_id=getattr(actor, "user_id", ""), reason=reason, new_state={"status": "REVOKED"})
    return revoked


def resolve_signoff(claim: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(claim, dict):
        return None
    rows = [row for row in _read(SIGNOFF_PATH) if row.get("truth_claim_id") == claim.get("claim_id") and int(row.get("truth_version", -1)) == int(claim.get("version", -2))]
    if not rows:
        return None
    current = rows[-1]
    if current.get("status") != "APPROVED" or current.get("predicate") != claim.get("predicate"):
        return None
    authority = _active_authority(current.get("authority_id", ""), claim.get("organization_id"), claim.get("tenant_id"))
    return current if authority else None


def list_authorities() -> List[Dict[str, Any]]:
    return _read(AUTHORITY_PATH)


def list_signoffs(claim_id: str, actor: Any) -> List[Dict[str, Any]]:
    claim = truth_spine_service.get_claim(claim_id)
    if not claim:
        raise PublicPopulationAuthorityError("claim_not_found")
    _scope(actor, claim.get("organization_id"), claim.get("tenant_id"))
    return [row for row in _read(SIGNOFF_PATH) if row.get("truth_claim_id") == claim_id]
