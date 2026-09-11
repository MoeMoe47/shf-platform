from __future__ import annotations

import json
import hashlib
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from services import truth_history_service
from services.truth_fact_provider import JsonlTruthFactProvider, ShsCurriculumTruthProvider, provider_name
from services import truth_spine_postgres_repository as durable_repo


SERVICE_ROOT = Path(__file__).resolve().parents[1]
TRUTH_DB_DIR = Path(os.getenv("SHF_TRUTH_DB_DIR", str(SERVICE_ROOT / "db" / "truth")))
CLAIMS_PATH = TRUTH_DB_DIR / "claims.json"
SOURCES_PATH = TRUTH_DB_DIR / "sources.json"
FEDERATION_PATH = TRUTH_DB_DIR / "federation_registry.json"
AUDIT_LOG_PATH = Path(os.getenv("SHF_TRUTH_AUDIT_LOG_PATH", str(SERVICE_ROOT / "logs" / "truth.audit.log")))

VERIFIED_SOURCE_STATUSES = {"verified", "approved", "public_approved"}
VALID_TRUST_LEVELS = {"draft", "sample", "verified", "public_approved"}
KNOWN_CLAIM_STATUSES = {"missing_source", "draft", "verified"}
KNOWN_SOURCE_STATUSES = {"draft", "verified", "approved", "public_approved", "unverified"}
TRUST_MODES = {"local", "trusted_partner", "review_required", "blocked"}

# --- Truth Spine security remediation additions -----------------------------
#
# Ownership/ scope classification for claims. "scoped" claims belong to a
# real organization_id derived from the creating actor. "global" claims are
# intentionally organization-less (only a global-authority actor - i.e.
# ROLE_SHS_ADMIN - may create one). "legacy_unscoped" is applied only by the
# migration tool (services/truth_migration.py) to pre-existing records that
# have no trustworthy actor/organization on file; such records are
# conservatively excluded from public visibility and from privileged
# mutation until explicitly reviewed. See docs/TRUTH_SPINE_SECURITY.md.
OWNERSHIP_SCOPED = "scoped"
OWNERSHIP_GLOBAL = "global"
OWNERSHIP_LEGACY_UNSCOPED = "legacy_unscoped"
KNOWN_OWNERSHIP_STATUSES = {OWNERSHIP_SCOPED, OWNERSHIP_GLOBAL, OWNERSHIP_LEGACY_UNSCOPED}
REQUIRED_CANONICAL_CLAIM_METADATA = (
    "subject_id", "claim_type", "predicate", "tenant_id", "organization_id",
    "occurred_at", "evidence_ids", "source_ids", "lineage_id",
)

# Fields that change the factual substance of a claim. Editing any of these
# on an existing claim always creates a new version rather than mutating the
# stored record in place - this is what prevents silent overwrite of
# previously-approved Truth (see create_claim_version()).
SUBSTANTIVE_CLAIM_FIELDS = (
    "claim_type", "claim_text", "metric_name", "metric_value", "source_ids",
    "subject_id", "predicate", "occurred_at", "evidence_ids", "lineage_id",
    "producer_id", "producer_event_type",
)

# Fields a caller's request body can NEVER set directly - they are always
# server-derived. Any of these present in an inbound payload is ignored.
CALLER_CANNOT_SET_CLAIM_FIELDS = (
    "public_approved",
    "verification_status",
    "trust_level",
    "report_ready",
    "approved_by",
    "approved_at",
    "approval_reason",
    "internal_approval_status",
    "internal_approved_by",
    "internal_approved_at",
    "internal_approval_reason",
    "internal_approval_revoked_by",
    "internal_approval_revoked_at",
    "internal_approval_revocation_reason",
    "revoked_by",
    "revoked_at",
    "revocation_reason",
    "created_by",
    "organization_id",
    "tenant_id",
    "ownership_status",
    "version",
    "previous_version_id",
    "superseded_by",
)
CALLER_CANNOT_SET_SOURCE_FIELDS = (
    "verification_status",
    "verified_by",
    "verified_at",
    "verification_reason",
    "created_by",
    "organization_id",
    "ownership_status",
)


class TruthAuthorityError(Exception):
    """Raised when an actor lacks scope authority over a Truth Spine record.

    Routers translate this to HTTP 403/404 - see routers/truth_routes.py.
    """


class TruthTransitionError(Exception):
    """Raised when a requested state transition is not currently valid
    (e.g. approving an unverified claim, or approving a legacy-unscoped
    record). Routers translate this to HTTP 409."""

    def __init__(self, reason: str, detail: Optional[Dict[str, Any]] = None):
        super().__init__(reason)
        self.reason = reason
        self.detail = detail or {}


DEFAULT_FEDERATION_SYSTEMS = [
    {
        "system_id": "shs",
        "display_name": "SHS",
        "system_type": "internal",
        "owner": "SHS",
        "trust_mode": "local",
        "allowed_claim_types": ["fact", "metric", "report_readiness", "client_project_fact"],
        "allowed_source_types": ["manual", "admin_sample", "operator_record", "report", "csv", "document"],
        "active": True,
    },
    {
        "system_id": "shf",
        "display_name": "SHF",
        "system_type": "foundation",
        "owner": "SHF",
        "trust_mode": "trusted_partner",
        "allowed_claim_types": ["fact", "metric", "impact", "report_readiness"],
        "allowed_source_types": ["report", "csv", "document", "manual"],
        "active": True,
    },
    {
        "system_id": "kermit",
        "display_name": "Kermit",
        "system_type": "program",
        "owner": "SHS",
        "trust_mode": "review_required",
        "allowed_claim_types": ["fact", "metric", "program"],
        "allowed_source_types": ["manual", "operator_record", "document"],
        "active": True,
    },
    {
        "system_id": "abram",
        "display_name": "Abram",
        "system_type": "program",
        "owner": "SHS",
        "trust_mode": "review_required",
        "allowed_claim_types": ["fact", "metric", "story"],
        "allowed_source_types": ["manual", "document", "operator_record"],
        "active": True,
    },
    {
        "system_id": "career",
        "display_name": "Career Pathways",
        "system_type": "program",
        "owner": "SHS",
        "trust_mode": "review_required",
        "allowed_claim_types": ["fact", "metric", "program"],
        "allowed_source_types": ["manual", "csv", "document"],
        "active": True,
    },
    {
        "system_id": "clientops",
        "display_name": "ClientOps",
        "system_type": "operations",
        "owner": "SHS",
        "trust_mode": "trusted_partner",
        "allowed_claim_types": ["fact", "metric", "client_project_fact", "report_readiness"],
        "allowed_source_types": ["manual", "operator_record", "document", "report"],
        "active": True,
    },
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_storage() -> None:
    if durable_repo.is_postgres_mode():
        return
    TRUTH_DB_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not CLAIMS_PATH.exists():
        CLAIMS_PATH.write_text("[]\n", encoding="utf-8")
    if not SOURCES_PATH.exists():
        SOURCES_PATH.write_text("[]\n", encoding="utf-8")
    if not FEDERATION_PATH.exists():
        now = _now()
        seeded = [{**system, "created_at": now, "updated_at": now} for system in DEFAULT_FEDERATION_SYSTEMS]
        FEDERATION_PATH.write_text(json.dumps(seeded, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _read_list(path: Path) -> List[Dict[str, Any]]:
    if durable_repo.is_postgres_mode():
        return durable_repo.read_records(path.name)
    _ensure_storage()
    try:
        data = json.loads(path.read_text(encoding="utf-8") or "[]")
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def _write_list(path: Path, items: List[Dict[str, Any]]) -> None:
    if durable_repo.is_postgres_mode():
        durable_repo.replace_records(path.name, items)
        return
    _ensure_storage()
    path.write_text(json.dumps(items, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _audit(action: str, entity_type: str, entity_id: str, payload: Optional[Dict[str, Any]] = None) -> None:
    _ensure_storage()
    event = {
        "ts": _now(),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "payload": payload or {},
    }
    with AUDIT_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


# --- Actor helpers ------------------------------------------------------
#
# `actor` throughout this module is expected to duck-type an auth.sessions.
# AuthSession: it must expose .user_id, .role, and .organization_id
# (None = global authority). Tests may pass a lightweight stand-in with the
# same three attributes instead of a real session - see
# tests/test_truth_routes_security.py.

def _actor_has_global_scope(actor: Any) -> bool:
    from auth.permissions import has_global_scope

    return has_global_scope(getattr(actor, "role", None))


def _actor_organization_id(actor: Any) -> Optional[str]:
    return getattr(actor, "organization_id", None)


def check_organization_access(actor: Any, target_organization_id: Optional[str]) -> None:
    """Public tenant/organization scope check, used by BOTH read and write
    paths in addition to the permission dependency already enforced at the
    router layer. Router permissions answer "can this role ever do X";
    this answers "can this specific actor do X to this specific
    organization's record". Raises TruthAuthorityError (translated by
    routers/truth_routes.py to a 404, so cross-tenant callers cannot infer
    that a record exists - see docs/TRUTH_SPINE_SECURITY.md)."""
    if _actor_has_global_scope(actor):
        return
    actor_org = _actor_organization_id(actor)
    if target_organization_id is None:
        # Only global-authority actors may access global (organization-less)
        # records.
        raise TruthAuthorityError("global_records_require_global_authority")
    if actor_org != target_organization_id:
        raise TruthAuthorityError("cross_organization_access_denied")


# Backward-compatible internal alias used by write paths in this module.
_require_write_scope = check_organization_access


def list_sources() -> List[Dict[str, Any]]:
    records = _read_list(SOURCES_PATH)
    if not durable_repo.is_postgres_mode():
        return records
    latest: Dict[str, Dict[str, Any]] = {}
    for record in records:
        source_id = record.get("source_id")
        if source_id:
            latest[str(source_id)] = record
    return list(latest.values())


def list_claims() -> List[Dict[str, Any]]:
    """Unfiltered internal read of the LATEST version of every claim.
    Not access-controlled - only call this from server-internal aggregate
    functions (truth_coverage, truth_drift) or from viewer-aware wrappers
    below (list_claims_for_viewer / list_public_claims) that apply the
    appropriate filter before returning data across a trust boundary."""
    provider = JsonlTruthFactProvider(CLAIMS_PATH, _read_list)
    if durable_repo.is_postgres_mode():
        all_claims = [_apply_truth_rules(claim, list_sources()) for claim in _read_list(CLAIMS_PATH)]
    elif provider_name() == "shs_postgres":
        all_claims = ShsCurriculumTruthProvider().list_facts()
    elif provider_name() == "jsonl":
        sources = list_sources()
        all_claims = [_apply_truth_rules(claim, sources) for claim in provider.list_facts()]
    else:
        raise RuntimeError("truth_provider_unknown")
    # Collapse to latest version per claim_id (superseded_by is None on the
    # current version).
    latest: Dict[str, Dict[str, Any]] = {}
    for claim in all_claims:
        cid = claim.get("claim_id")
        if claim.get("superseded_by"):
            continue
        latest[cid] = claim
    return list(latest.values())


def list_all_claim_versions(claim_id: str) -> List[Dict[str, Any]]:
    """Privileged: every version of a claim, oldest first."""
    sources = list_sources()
    versions = [
        _apply_truth_rules(claim, sources)
        for claim in _read_list(CLAIMS_PATH)
        if claim.get("claim_id") == claim_id
    ]
    return sorted(versions, key=lambda c: int(c.get("version") or 1))


def list_claims_for_viewer(actor: Any) -> List[Dict[str, Any]]:
    """Privileged internal read (truth.internal.read). Global-scope actors
    see every claim; organization-scoped actors see only their own
    organization's claims plus global claims. Never returns
    legacy_unscoped claims' full detail to non-global actors."""
    claims = list_claims()
    if _actor_has_global_scope(actor):
        return claims
    org_id = _actor_organization_id(actor)
    return [
        claim
        for claim in claims
        if claim.get("organization_id") == org_id or claim.get("ownership_status") == OWNERSHIP_GLOBAL
    ]


def is_publicly_visible(claim: Dict[str, Any]) -> bool:
    """The single canonical public-visibility predicate. Every public-read
    path in this module and in routers/truth_routes.py MUST use this
    function rather than re-implementing filtering logic. Fails closed:
    any missing/malformed required field results in NOT visible."""
    if not isinstance(claim, dict):
        return False
    if claim.get("public_approved") is not True:
        return False
    if claim.get("verification_status") != "verified":
        return False
    if claim.get("superseded_by"):
        return False
    ownership_status = claim.get("ownership_status")
    if ownership_status not in (OWNERSHIP_SCOPED, OWNERSHIP_GLOBAL):
        return False
    if ownership_status == OWNERSHIP_SCOPED and not claim.get("organization_id"):
        return False
    return True


def is_internal_institutionally_eligible(claim: Dict[str, Any]) -> bool:
    """Fail-closed predicate for future internal metric consumers.

    Internal approval is deliberately independent from ``public_approved``;
    both source verification and an authorized internal approval are required.
    Missing canonical lineage metadata, legacy scope, or superseded versions
    are never eligible.
    """
    if not isinstance(claim, dict):
        return False
    if any(not claim.get(field) for field in REQUIRED_CANONICAL_CLAIM_METADATA):
        return False
    if not isinstance(claim.get("evidence_ids"), list) or not isinstance(claim.get("source_ids"), list):
        return False
    if claim.get("verification_status") != "verified":
        return False
    if claim.get("internal_approval_status") != "approved":
        return False
    if claim.get("superseded_by"):
        return False
    return claim.get("ownership_status") in (OWNERSHIP_SCOPED, OWNERSHIP_GLOBAL)


def list_public_claims() -> List[Dict[str, Any]]:
    return [claim for claim in list_claims() if is_publicly_visible(claim)]


def get_source(source_id: str) -> Optional[Dict[str, Any]]:
    return next((source for source in list_sources() if source.get("source_id") == source_id), None)


def get_claim(claim_id: str) -> Optional[Dict[str, Any]]:
    """Latest (non-superseded) version only. Not access-controlled by
    itself - callers in routers/truth_routes.py apply the appropriate
    public/privileged filter before returning the result."""
    return next((claim for claim in list_claims() if claim.get("claim_id") == claim_id), None)


def get_public_claim(claim_id: str) -> Optional[Dict[str, Any]]:
    claim = get_claim(claim_id)
    return claim if claim and is_publicly_visible(claim) else None


def _clean_string(value: Any) -> str:
    return str(value or "").strip()


def _clean_source_ids(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    out: List[str] = []
    for item in value:
        source_id = _clean_string(item)
        if source_id and source_id not in out:
            out.append(source_id)
    return out


def _trace_coverage(value: Any) -> int:
    try:
        numeric = int(float(value))
    except (TypeError, ValueError):
        numeric = 0
    return max(0, min(100, numeric))


def _clean_string_list(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    out: List[str] = []
    for item in value:
        cleaned = _clean_string(item)
        if cleaned and cleaned not in out:
            out.append(cleaned)
    return out


def _clean_optional_string_list(value: Any) -> List[str]:
    return _clean_string_list(value)


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _sha256_payload(value: Dict[str, Any]) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def _resolve_write_organization(actor: Any, payload: Dict[str, Any]) -> tuple[Optional[str], str]:
    """Server-side derivation of (organization_id, ownership_status) for a
    NEW record. The request body's own organization_id (if any) is never
    trusted directly - see CALLER_CANNOT_SET_CLAIM_FIELDS /
    CALLER_CANNOT_SET_SOURCE_FIELDS. A global-authority actor may
    optionally target a specific organization by passing
    requested_organization_id, or create a truly global record by omitting
    it."""
    if _actor_has_global_scope(actor):
        requested = _clean_string(payload.get("requested_organization_id")) or None
        if requested:
            return requested, OWNERSHIP_SCOPED
        return None, OWNERSHIP_GLOBAL
    org_id = _actor_organization_id(actor)
    if not org_id:
        # An authenticated, organization-scoped actor with no organization
        # on file cannot write anything attributable - fail closed rather
        # than guessing.
        raise TruthAuthorityError("actor_missing_organization_scope")
    return org_id, OWNERSHIP_SCOPED


def _normalize_source(payload: Dict[str, Any], existing: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    now = _now()
    source_id = _clean_string(payload.get("source_id") or (existing or {}).get("source_id") or f"src_{uuid.uuid4().hex[:12]}")
    created_at = _clean_string((existing or {}).get("created_at") or payload.get("created_at") or now)
    return {
        "source_id": source_id,
        "system_id": _clean_string(payload.get("system_id") or (existing or {}).get("system_id")),
        "source_type": _clean_string(payload.get("source_type") or (existing or {}).get("source_type") or "manual"),
        "title": _clean_string(payload.get("title") or (existing or {}).get("title") or "Untitled source"),
        "uri": _clean_string(payload.get("uri") or (existing or {}).get("uri")),
        "evidence_type": _clean_string(payload.get("evidence_type") or (existing or {}).get("evidence_type") or "document"),
        "created_at": created_at,
        "updated_at": now,
    }


def create_source(payload: Dict[str, Any], actor: Any) -> Dict[str, Any]:
    """Requires truth.source.create (enforced by the router). A newly
    created source ALWAYS starts as verification_status="unverified"
    regardless of anything the caller sends - verification is only ever
    performed by verify_source(), which requires truth.source.verify and a
    reason. This is what closes the self-verification attack chain."""
    clean_payload = {k: v for k, v in payload.items() if k not in CALLER_CANNOT_SET_SOURCE_FIELDS}
    organization_id, ownership_status = _resolve_write_organization(actor, payload)

    sources = list_sources()
    existing = next((s for s in sources if s.get("source_id") == clean_payload.get("source_id")), None)
    if existing and existing.get("organization_id") not in (None, organization_id) and not _actor_has_global_scope(actor):
        raise TruthAuthorityError("cross_organization_access_denied")

    source = _normalize_source(clean_payload, existing=existing)
    source["verification_status"] = "unverified"
    source["organization_id"] = organization_id
    source["tenant_id"] = f"tenant:{organization_id}" if organization_id else None
    source["ownership_status"] = ownership_status
    source["created_by"] = getattr(actor, "user_id", "")
    source["verified_by"] = None
    source["verified_at"] = None
    source["verification_reason"] = ""

    sources = [item for item in sources if item.get("source_id") != source["source_id"]]
    sources.append(source)
    _write_list(SOURCES_PATH, sources)
    _audit("source.upserted", "source", source["source_id"], {"verification_status": source["verification_status"]})
    truth_history_service.append_history_event(
        event_type="source.created",
        entity_type="source",
        entity_id=source["source_id"],
        organization_id=organization_id,
        tenant_id=f"tenant:{organization_id}" if organization_id else None,
        actor_id=getattr(actor, "user_id", ""),
        new_state={"verification_status": source["verification_status"]},
    )
    return source


def verify_source(source_id: str, actor: Any, verification_status: str, reason: str) -> Dict[str, Any]:
    """Requires truth.source.verify (enforced by the router) and a
    non-empty reason. This is the ONLY function that may move a source
    into verified/approved/public_approved."""
    reason = _clean_string(reason)
    if not reason:
        raise TruthTransitionError("reason_required", {"field": "reason"})
    verification_status = _clean_string(verification_status).lower()
    if verification_status not in KNOWN_SOURCE_STATUSES:
        raise TruthTransitionError("invalid_verification_status", {"allowed": sorted(KNOWN_SOURCE_STATUSES)})

    source = get_source(source_id)
    if not source:
        raise TruthTransitionError("source_not_found")
    _require_write_scope(actor, source.get("organization_id"))

    previous_status = source.get("verification_status")
    source = {**source}
    source["verification_status"] = verification_status
    source["verified_by"] = getattr(actor, "user_id", "")
    source["verified_at"] = _now()
    source["verification_reason"] = reason
    source["updated_at"] = _now()

    sources = [item for item in list_sources() if item.get("source_id") != source_id]
    sources.append(source)
    _write_list(SOURCES_PATH, sources)

    event_type = (
        "source.verification_revoked"
        if verification_status in {"draft", "unverified"} and previous_status in VERIFIED_SOURCE_STATUSES
        else "source.verified"
    )
    _audit("source.verification_updated", "source", source_id, {"verification_status": verification_status})
    truth_history_service.append_history_event(
        event_type=event_type,
        entity_type="source",
        entity_id=source_id,
        organization_id=source.get("organization_id"),
        actor_id=getattr(actor, "user_id", ""),
        reason=reason,
        previous_state={"verification_status": previous_status},
        new_state={"verification_status": verification_status},
    )
    return source


def _base_claim(payload: Dict[str, Any], existing: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    now = _now()
    claim_id = _clean_string(payload.get("claim_id") or (existing or {}).get("claim_id") or f"claim_{uuid.uuid4().hex[:12]}")
    created_at = _clean_string((existing or {}).get("created_at") or payload.get("created_at") or now)
    return {
        "claim_id": claim_id,
        "app_id": _clean_string(payload.get("app_id") or (existing or {}).get("app_id") or "shs"),
        "project_id": _clean_string(payload.get("project_id") or (existing or {}).get("project_id")),
        "client_id": _clean_string(payload.get("client_id") or (existing or {}).get("client_id")),
        "program_id": _clean_string(payload.get("program_id") or (existing or {}).get("program_id")),
        "claim_type": _clean_string(payload.get("claim_type") or (existing or {}).get("claim_type") or "fact"),
        "claim_text": _clean_string(payload.get("claim_text") or (existing or {}).get("claim_text") or "Untitled claim"),
        "metric_name": _clean_string(payload.get("metric_name") or (existing or {}).get("metric_name")),
        "metric_value": payload.get("metric_value", (existing or {}).get("metric_value")),
        "source_ids": _clean_source_ids(payload.get("source_ids", (existing or {}).get("source_ids", []))),
        "evidence_ids": _clean_optional_string_list(payload.get("evidence_ids", (existing or {}).get("evidence_ids", []))),
        "subject_id": _clean_string(payload.get("subject_id") or (existing or {}).get("subject_id")),
        "predicate": _clean_string(payload.get("predicate") or (existing or {}).get("predicate")),
        "occurred_at": _clean_string(payload.get("occurred_at") or (existing or {}).get("occurred_at")),
        "lineage_id": _clean_string(payload.get("lineage_id") or (existing or {}).get("lineage_id")),
        "producer_id": _clean_string(payload.get("producer_id") or (existing or {}).get("producer_id")),
        "producer_event_type": _clean_string(payload.get("producer_event_type") or (existing or {}).get("producer_event_type")),
        "trace_coverage": _trace_coverage(payload.get("trace_coverage", (existing or {}).get("trace_coverage", 0))),
        "created_at": created_at,
        "updated_at": now,
    }


def _apply_truth_rules(claim: Dict[str, Any], sources: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    sources = list_sources() if sources is None else sources
    source_ids = _clean_source_ids(claim.get("source_ids"))
    source_map = {source.get("source_id"): source for source in sources}
    linked_sources = [source_map[source_id] for source_id in source_ids if source_id in source_map]
    missing_source_ids = [source_id for source_id in source_ids if source_id not in source_map]
    trace_coverage = _trace_coverage(claim.get("trace_coverage"))

    if not source_ids:
        verification_status = "missing_source"
    elif missing_source_ids:
        verification_status = "missing_source"
    elif not linked_sources or any(str(source.get("verification_status", "")).lower() not in VERIFIED_SOURCE_STATUSES for source in linked_sources):
        verification_status = "draft"
    elif trace_coverage >= 80:
        verification_status = "verified"
    else:
        verification_status = "draft"

    # public_approved is a STORED decision (see approve_public/revoke_public
    # below), not re-derived from source state on every read - but it can
    # never be effectively true unless verification_status is currently
    # "verified" (defense in depth against a source being unverified after
    # a claim was approved).
    public_approved = bool(claim.get("public_approved")) and verification_status == "verified"
    report_ready = verification_status == "verified" and trace_coverage >= 80

    if public_approved:
        trust_level = "public_approved"
    elif verification_status == "verified":
        trust_level = "verified"
    elif str(claim.get("trust_level")).lower() == "sample":
        trust_level = "sample"
    else:
        trust_level = "draft"

    if trust_level not in VALID_TRUST_LEVELS:
        trust_level = "draft"

    return {
        **claim,
        "source_ids": source_ids,
        "verification_status": verification_status,
        "trust_level": trust_level,
        "trace_coverage": trace_coverage,
        "public_approved": public_approved,
        "internal_approval_status": _clean_string(claim.get("internal_approval_status") or "not_approved"),
        "internal_approved_by": _clean_string(claim.get("internal_approved_by")),
        "internal_approved_at": _clean_string(claim.get("internal_approved_at")),
        "internal_approval_reason": _clean_string(claim.get("internal_approval_reason")),
        "internal_approval_revoked_by": _clean_string(claim.get("internal_approval_revoked_by")),
        "internal_approval_revoked_at": _clean_string(claim.get("internal_approval_revoked_at")),
        "internal_approval_revocation_reason": _clean_string(claim.get("internal_approval_revocation_reason")),
        "report_ready": report_ready,
        "warnings": build_claim_warnings({
            **claim,
            "source_ids": source_ids,
            "verification_status": verification_status,
            "trace_coverage": trace_coverage,
            "public_approved": public_approved,
            "report_ready": report_ready,
        }, missing_source_ids=missing_source_ids),
    }


def create_claim(payload: Dict[str, Any], actor: Any) -> Dict[str, Any]:
    """Creates a brand-new claim (version 1). Requires truth.claim.create
    (enforced by the router). If claim_id already exists, this raises -
    use create_claim_version() to edit an existing claim."""
    clean_payload = {k: v for k, v in payload.items() if k not in CALLER_CANNOT_SET_CLAIM_FIELDS}
    existing = next(
        (c for c in _read_list(CLAIMS_PATH) if c.get("claim_id") == clean_payload.get("claim_id")),
        None,
    )
    if existing:
        raise TruthTransitionError("claim_already_exists", {"claim_id": existing.get("claim_id")})

    organization_id, ownership_status = _resolve_write_organization(actor, payload)
    claim = _base_claim(clean_payload)
    claim["version"] = 1
    claim["previous_version_id"] = None
    claim["superseded_by"] = None
    claim["organization_id"] = organization_id
    claim["tenant_id"] = _clean_string(getattr(actor, "tenant_id", "") or (f"tenant:{organization_id}" if organization_id else ""))
    claim["ownership_status"] = ownership_status
    claim["created_by"] = getattr(actor, "user_id", "")
    claim["public_approved"] = False
    claim["approved_by"] = None
    claim["approved_at"] = None
    claim["approval_reason"] = ""
    claim["internal_approval_status"] = "not_approved"
    claim["internal_approved_by"] = None
    claim["internal_approved_at"] = None
    claim["internal_approval_reason"] = ""
    claim["internal_approval_revoked_by"] = None
    claim["internal_approval_revoked_at"] = None
    claim["internal_approval_revocation_reason"] = ""

    stored = _apply_truth_rules(claim, list_sources())
    stored_for_write = {k: v for k, v in stored.items() if k != "warnings"}
    all_claims = _read_list(CLAIMS_PATH)
    all_claims.append(stored_for_write)
    _write_list(CLAIMS_PATH, all_claims)

    _audit("claim.upserted", "claim", stored["claim_id"], {"verification_status": stored["verification_status"]})
    truth_history_service.append_history_event(
        event_type="claim.created",
        entity_type="claim",
        entity_id=stored["claim_id"],
        entity_version=1,
        organization_id=organization_id,
        tenant_id=stored.get("tenant_id"),
        actor_id=getattr(actor, "user_id", ""),
        new_state={"verification_status": stored["verification_status"]},
    )
    return stored


def _is_substantive_change(current: Dict[str, Any], payload: Dict[str, Any]) -> bool:
    for field in SUBSTANTIVE_CLAIM_FIELDS:
        if field not in payload:
            continue
        new_value = payload.get(field)
        if field == "source_ids":
            new_value = _clean_source_ids(new_value)
            if new_value != current.get("source_ids", []):
                return True
        elif str(new_value if new_value is not None else "") != str(current.get(field) if current.get(field) is not None else ""):
            return True
    return False


def create_claim_version(claim_id: str, payload: Dict[str, Any], actor: Any) -> Dict[str, Any]:
    """Edits an existing claim. Requires truth.claim.update (enforced by
    the router). Any substantive change (see SUBSTANTIVE_CLAIM_FIELDS)
    ALWAYS creates a new version rather than mutating the current record in
    place - this is what prevents silent overwrite of previously-approved
    Truth. The prior version is preserved, marked superseded_by the new
    version's id, and remains available to privileged readers via
    list_all_claim_versions(). public_approved always resets to False on a
    new version - a new version requires a fresh approval decision."""
    current = get_claim(claim_id)
    if not current:
        raise TruthTransitionError("claim_not_found")
    _require_write_scope(actor, current.get("organization_id"))

    clean_payload = {k: v for k, v in payload.items() if k not in CALLER_CANNOT_SET_CLAIM_FIELDS}
    substantive = _is_substantive_change(current, clean_payload)

    if not substantive:
        # Metadata-only edit (e.g. project_id/program_id label correction):
        # applied in place, no new version, no re-approval needed. Still
        # cannot touch approval fields (already stripped above).
        merged = {**current, **clean_payload}
        merged = _base_claim(merged, existing=current)
        merged["version"] = current.get("version", 1)
        merged["previous_version_id"] = current.get("previous_version_id")
        merged["superseded_by"] = None
        merged["organization_id"] = current.get("organization_id")
        merged["tenant_id"] = current.get("tenant_id")
        merged["ownership_status"] = current.get("ownership_status")
        merged["created_by"] = current.get("created_by")
        merged["public_approved"] = current.get("public_approved", False)
        merged["approved_by"] = current.get("approved_by")
        merged["approved_at"] = current.get("approved_at")
        merged["approval_reason"] = current.get("approval_reason", "")
        merged["internal_approval_status"] = current.get("internal_approval_status", "not_approved")
        merged["internal_approved_by"] = current.get("internal_approved_by")
        merged["internal_approved_at"] = current.get("internal_approved_at")
        merged["internal_approval_reason"] = current.get("internal_approval_reason", "")
        merged["internal_approval_revoked_by"] = current.get("internal_approval_revoked_by")
        merged["internal_approval_revoked_at"] = current.get("internal_approval_revoked_at")
        merged["internal_approval_revocation_reason"] = current.get("internal_approval_revocation_reason", "")
        stored = _apply_truth_rules(merged, list_sources())
        all_claims = [c for c in _read_list(CLAIMS_PATH) if not (c.get("claim_id") == claim_id and c.get("version") == merged["version"])]
        all_claims.append({k: v for k, v in stored.items() if k != "warnings"})
        _write_list(CLAIMS_PATH, all_claims)
        _audit("claim.upserted", "claim", claim_id, {"verification_status": stored["verification_status"]})
        return stored

    next_version = int(current.get("version", 1)) + 1
    new_claim = _base_claim(clean_payload, existing=current)
    new_claim["version"] = next_version
    new_claim["previous_version_id"] = f"{claim_id}@v{current.get('version', 1)}"
    new_claim["superseded_by"] = None
    new_claim["organization_id"] = current.get("organization_id")
    new_claim["tenant_id"] = current.get("tenant_id")
    new_claim["ownership_status"] = current.get("ownership_status")
    new_claim["created_by"] = getattr(actor, "user_id", "")
    new_claim["public_approved"] = False
    new_claim["approved_by"] = None
    new_claim["approved_at"] = None
    new_claim["approval_reason"] = ""
    new_claim["internal_approval_status"] = "not_approved"
    new_claim["internal_approved_by"] = None
    new_claim["internal_approved_at"] = None
    new_claim["internal_approval_reason"] = ""
    new_claim["internal_approval_revoked_by"] = None
    new_claim["internal_approval_revoked_at"] = None
    new_claim["internal_approval_revocation_reason"] = ""

    stored = _apply_truth_rules(new_claim, list_sources())
    all_claims = _read_list(CLAIMS_PATH)
    # Mark the prior version superseded (find its exact stored row by
    # claim_id + version, not just claim_id, since multiple versions share
    # claim_id).
    for row in all_claims:
        if row.get("claim_id") == claim_id and int(row.get("version", 1)) == int(current.get("version", 1)):
            row["superseded_by"] = f"{claim_id}@v{next_version}"
            row["updated_at"] = _now()
    all_claims.append({k: v for k, v in stored.items() if k != "warnings"})
    _write_list(CLAIMS_PATH, all_claims)

    _audit("claim.version_created", "claim", claim_id, {"version": next_version})
    truth_history_service.append_history_event(
        event_type="claim.version_created",
        entity_type="claim",
        entity_id=claim_id,
        entity_version=next_version,
        organization_id=current.get("organization_id"),
        tenant_id=current.get("tenant_id"),
        actor_id=getattr(actor, "user_id", ""),
        previous_state={"version": current.get("version", 1), "public_approved": current.get("public_approved", False)},
        new_state={"version": next_version, "public_approved": False},
    )
    return stored


def _normalize_federation_system(payload: Dict[str, Any], existing: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    now = _now()
    existing = existing or {}
    system_id = _clean_string(payload.get("system_id") or existing.get("system_id"))
    trust_mode = _clean_string(payload.get("trust_mode") or existing.get("trust_mode") or "review_required").lower()
    if trust_mode not in TRUST_MODES:
        trust_mode = "review_required"
    return {
        "system_id": system_id,
        "display_name": _clean_string(payload.get("display_name") or existing.get("display_name") or system_id),
        "system_type": _clean_string(payload.get("system_type") or existing.get("system_type") or "external"),
        "owner": _clean_string(payload.get("owner") or existing.get("owner") or "review_required"),
        "trust_mode": trust_mode,
        "allowed_claim_types": _clean_string_list(payload.get("allowed_claim_types", existing.get("allowed_claim_types", []))),
        "allowed_source_types": _clean_string_list(payload.get("allowed_source_types", existing.get("allowed_source_types", []))),
        "active": bool(payload.get("active", existing.get("active", True))),
        "created_at": _clean_string(existing.get("created_at") or payload.get("created_at") or now),
        "updated_at": now,
    }


def list_federation_systems() -> List[Dict[str, Any]]:
    records = _read_list(FEDERATION_PATH)
    if not durable_repo.is_postgres_mode():
        return records
    latest: Dict[str, Dict[str, Any]] = {}
    for record in records:
        system_id = record.get("system_id")
        if system_id:
            latest[str(system_id)] = record
    return list(latest.values())


def get_federation_system(system_id: str) -> Optional[Dict[str, Any]]:
    clean_id = _clean_string(system_id)
    return next((system for system in list_federation_systems() if system.get("system_id") == clean_id), None)


def upsert_federation_system(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Requires truth.admin (enforced by the router)."""
    systems = list_federation_systems()
    requested_id = _clean_string(payload.get("system_id"))
    existing = next((system for system in systems if system.get("system_id") == requested_id), None)
    system = _normalize_federation_system(payload, existing=existing)
    systems = [item for item in systems if item.get("system_id") != system["system_id"]]
    systems.append(system)
    _write_list(FEDERATION_PATH, systems)
    _audit("federation_system.upserted", "federation_system", system["system_id"], {"trust_mode": system["trust_mode"]})
    return system


def truth_federation_summary() -> Dict[str, Any]:
    systems = list_federation_systems()
    active = [system for system in systems if system.get("active") is True]
    return {
        "ok": True,
        "count": len(systems),
        "active_count": len(active),
        "trust_modes": {mode: len([system for system in systems if system.get("trust_mode") == mode]) for mode in sorted(TRUST_MODES)},
        "systems": systems,
        "remote_sync": False,
        "remote_sync_note": "No remote federation sync in V1.",
    }


def build_truth_package(claim_id: str) -> Optional[Dict[str, Any]]:
    claim = get_claim(claim_id)
    if not claim:
        return None
    source_map = {source.get("source_id"): source for source in list_sources()}
    source_ids = _clean_source_ids(claim.get("source_ids"))
    sources = [source_map[source_id] for source_id in source_ids if source_id in source_map]
    missing_source_ids = [source_id for source_id in source_ids if source_id not in source_map]
    warnings = list(claim.get("warnings") or [])
    if missing_source_ids and "source_not_found" not in warnings:
        warnings.append("source_not_found")
    issued_at = _clean_string(claim.get("updated_at") or claim.get("created_at") or _now())
    package = {
        "package_id": f"truth_pkg_{claim['claim_id']}",
        "package_version": "truth_package_v1",
        "claim_id": claim["claim_id"],
        "claim": claim,
        "sources": sources,
        "verification_status": claim["verification_status"],
        "trust_level": claim["trust_level"],
        "trace_coverage": claim["trace_coverage"],
        "public_approved": claim["public_approved"],
        "report_ready": claim["report_ready"],
        "issued_at": issued_at,
        "issued_by": "shs-truth-spine-v1",
        "signature_status": "hash_signed_v1",
        "display_scope": "public" if is_publicly_visible(claim) else "internal",
        "warnings": warnings,
    }
    return {**package, "package_hash": _sha256_payload(package)}


def build_public_truth_package(claim_id: str) -> Optional[Dict[str, Any]]:
    claim = get_public_claim(claim_id)
    if not claim:
        return None
    package = build_truth_package(claim_id)
    if not package or package.get("display_scope") != "public":
        return None
    # Strip internal-only source detail from the public view - public
    # consumers get sources that are themselves publicly relevant, not
    # private evidentiary metadata (e.g. internal uri/system_id).
    package = {**package}
    package["sources"] = [
        {"source_id": s.get("source_id"), "title": s.get("title"), "source_type": s.get("source_type")}
        for s in package.get("sources", [])
    ]
    return package


def list_truth_packages() -> List[Dict[str, Any]]:
    packages: List[Dict[str, Any]] = []
    for claim in list_claims():
        package = build_truth_package(claim.get("claim_id"))
        if package:
            packages.append({
                "package_id": package["package_id"],
                "claim_id": package["claim_id"],
                "package_version": package["package_version"],
                "verification_status": package["verification_status"],
                "trust_level": package["trust_level"],
                "trace_coverage": package["trace_coverage"],
                "public_approved": package["public_approved"],
                "report_ready": package["report_ready"],
                "issued_at": package["issued_at"],
                "issued_by": package["issued_by"],
                "package_hash": package["package_hash"],
                "signature_status": package["signature_status"],
                "display_scope": package["display_scope"],
                "warnings": package["warnings"],
            })
    return packages


def list_public_truth_packages() -> List[Dict[str, Any]]:
    return [p for p in list_truth_packages() if p.get("display_scope") == "public"]


def replay_claim(claim_id: str) -> Optional[Dict[str, Any]]:
    claim = get_claim(claim_id)
    if not claim:
        return None
    source_map = {source.get("source_id"): source for source in list_sources()}
    linked_sources = [source_map[source_id] for source_id in _clean_source_ids(claim.get("source_ids")) if source_id in source_map]
    timeline: List[Dict[str, Any]] = [
        {
            "ts": claim.get("created_at"),
            "event_type": "claim_created",
            "actor": claim.get("created_by") or "shs-truth-spine-v1",
            "summary": "Claim entered Truth Spine.",
            "state": {"verification_status": "missing_source", "trust_level": "draft"},
        }
    ]
    for source in linked_sources:
        timeline.append({
            "ts": source.get("created_at"),
            "event_type": "source_created",
            "actor": source.get("created_by") or "shs-truth-spine-v1",
            "source_id": source.get("source_id"),
            "summary": "Source attached to Truth Spine evidence registry.",
            "state": {"verification_status": source.get("verification_status")},
        })
        if source.get("updated_at") and source.get("updated_at") != source.get("created_at"):
            timeline.append({
                "ts": source.get("updated_at"),
                "event_type": "source_updated",
                "actor": source.get("verified_by") or "shs-truth-spine-v1",
                "source_id": source.get("source_id"),
                "summary": "Source verification state updated.",
                "state": {"verification_status": source.get("verification_status")},
            })
    if claim.get("updated_at") and claim.get("updated_at") != claim.get("created_at"):
        timeline.append({
            "ts": claim.get("updated_at"),
            "event_type": "claim_updated",
            "actor": claim.get("approved_by") or claim.get("created_by") or "shs-truth-spine-v1",
            "summary": "Claim fields updated.",
            "state": {"trace_coverage": claim.get("trace_coverage")},
        })
    timeline.extend([
        {
            "ts": claim.get("updated_at"),
            "event_type": "verification_evaluated",
            "actor": "shs-truth-spine-v1",
            "summary": "Deterministic V1 verification rules evaluated.",
            "state": {
                "verification_status": claim.get("verification_status"),
                "trust_level": claim.get("trust_level"),
                "trace_coverage": claim.get("trace_coverage"),
            },
        },
        {
            "ts": claim.get("updated_at"),
            "event_type": "public_approval_evaluated",
            "actor": claim.get("approved_by") or "shs-truth-spine-v1",
            "summary": "Public approval gate evaluated.",
            "state": {"public_approved": claim.get("public_approved")},
        },
        {
            "ts": claim.get("updated_at"),
            "event_type": "report_readiness_evaluated",
            "actor": "shs-truth-spine-v1",
            "summary": "Report readiness gate evaluated.",
            "state": {"report_ready": claim.get("report_ready")},
        },
    ])
    timeline = sorted(timeline, key=lambda event: str(event.get("ts") or ""))
    return {
        "claim_id": claim["claim_id"],
        "timeline": timeline,
        "current_state": {
            "verification_status": claim.get("verification_status"),
            "trust_level": claim.get("trust_level"),
            "trace_coverage": claim.get("trace_coverage"),
            "public_approved": claim.get("public_approved"),
            "report_ready": claim.get("report_ready"),
        },
        "source_events": [event for event in timeline if str(event.get("event_type", "")).startswith("source_")],
        "approval_events": [event for event in timeline if "approval" in str(event.get("event_type", ""))],
        "verification_events": [event for event in timeline if "verification" in str(event.get("event_type", ""))],
        "warnings": claim.get("warnings", []),
        "structured_history": truth_history_service.list_history_for_entity(claim_id),
    }


def build_claim_warnings(claim: Dict[str, Any], missing_source_ids: Optional[List[str]] = None) -> List[str]:
    warnings: List[str] = []
    if not claim.get("source_ids"):
        warnings.append("missing_source")
    if missing_source_ids:
        warnings.append("source_not_found")
    if _trace_coverage(claim.get("trace_coverage")) < 80:
        warnings.append("low_trace_coverage")
    if claim.get("verification_status") != "verified":
        warnings.append("unverified_claim")
    if claim.get("public_approved") and claim.get("verification_status") != "verified":
        warnings.append("public_approval_blocked")
    return warnings


def build_envelope(claim_id: str) -> Optional[Dict[str, Any]]:
    claim = get_claim(claim_id)
    if not claim:
        return None
    sources = [source for source in list_sources() if source.get("source_id") in set(claim.get("source_ids") or [])]
    return {
        "claim_id": claim["claim_id"],
        "verification_status": claim["verification_status"],
        "trust_level": claim["trust_level"],
        "trace_coverage": claim["trace_coverage"],
        "public_approved": claim["public_approved"],
        "report_ready": claim["report_ready"],
        "source_count": len(sources),
        "sources": sources,
        "warnings": claim.get("warnings", []),
        "canonical_rule": "Truth Spine verifies what is true. Oracle decides what evidence supports. Watchtower observes coverage and risk. LOO ranks outcomes. Reports communicate only verified/readiness-approved information.",
    }


def build_readiness(claim_id: str) -> Optional[Dict[str, Any]]:
    claim = get_claim(claim_id)
    if not claim:
        return None
    return {
        "claim_id": claim["claim_id"],
        "report_ready": claim["report_ready"],
        "public_approved": claim["public_approved"],
        "verification_status": claim["verification_status"],
        "trace_coverage": claim["trace_coverage"],
        "ready_for_reports": claim["report_ready"] is True,
        "warnings": claim.get("warnings", []),
    }


def _assert_human_internal_approver(actor: Any) -> None:
    if str(getattr(actor, "principal_type", "user")).lower() == "service":
        raise TruthAuthorityError("service_principal_cannot_approve_internal_claim")


def _set_internal_approval(claim_id: str, actor: Any, reason: str, status: str) -> Dict[str, Any]:
    _assert_human_internal_approver(actor)
    reason = _clean_string(reason)
    if not reason:
        raise TruthTransitionError("reason_required", {"field": "reason"})
    existing = get_claim(claim_id)
    if not existing:
        raise TruthTransitionError("claim_not_found")
    _require_write_scope(actor, existing.get("organization_id"))
    if existing.get("ownership_status") == OWNERSHIP_LEGACY_UNSCOPED:
        raise TruthTransitionError("legacy_unscoped_records_cannot_be_approved")
    if status == "approved" and existing.get("verification_status") != "verified":
        truth_history_service.append_history_event(
            event_type="transition.rejected",
            entity_type="claim",
            entity_id=claim_id,
            entity_version=existing.get("version"),
            organization_id=existing.get("organization_id"),
            tenant_id=existing.get("tenant_id"),
            actor_id=getattr(actor, "user_id", ""),
            actor_type="USER",
            reason=reason,
            previous_state={"verification_status": existing.get("verification_status")},
            new_state={"attempted_internal_approval": status},
        )
        raise TruthTransitionError("claim_not_verified", {"verification_status": existing.get("verification_status")})

    now = _now()
    all_claims = _read_list(CLAIMS_PATH)
    previous = existing.get("internal_approval_status", "not_approved")
    for row in all_claims:
        if row.get("claim_id") == claim_id and int(row.get("version", 1)) == int(existing.get("version", 1)):
            row["internal_approval_status"] = status
            if status == "approved":
                row["internal_approved_by"] = getattr(actor, "user_id", "")
                row["internal_approved_at"] = now
                row["internal_approval_reason"] = reason
                row["internal_approval_revoked_by"] = None
                row["internal_approval_revoked_at"] = None
                row["internal_approval_revocation_reason"] = ""
            else:
                row["internal_approval_revoked_by"] = getattr(actor, "user_id", "")
                row["internal_approval_revoked_at"] = now
                row["internal_approval_revocation_reason"] = reason
            row["updated_at"] = now
    _write_list(CLAIMS_PATH, all_claims)
    updated = get_claim(claim_id)
    event_type = "claim.internal_approved" if status == "approved" else "claim.internal_approval_revoked"
    _audit("internal_approval.updated", "claim", claim_id, {"internal_approval_status": status})
    truth_history_service.append_history_event(
        event_type=event_type,
        entity_type="claim",
        entity_id=claim_id,
        entity_version=existing.get("version"),
        organization_id=existing.get("organization_id"),
        tenant_id=existing.get("tenant_id"),
        actor_id=getattr(actor, "user_id", ""),
        actor_type="USER",
        reason=reason,
        previous_state={"internal_approval_status": previous},
        new_state={"internal_approval_status": status},
    )
    return updated or existing


def approve_internal(claim_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    """Approve a verified claim for internal institutional use only.

    This transition is intentionally separate from public approval and never
    changes ``public_approved``. Router permission checks provide the
    external authorization boundary; the service repeats separation-of-duty
    and scope checks for defense in depth.
    """
    return _set_internal_approval(claim_id, actor, reason, "approved")


def revoke_internal(claim_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    return _set_internal_approval(claim_id, actor, reason, "revoked")


def approve_public(claim_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    """Requires truth.claim.approve_public (enforced by the router) and a
    non-empty reason. Idempotent: re-approving an already-approved claim
    re-records history but does not error."""
    reason = _clean_string(reason)
    if not reason:
        raise TruthTransitionError("reason_required", {"field": "reason"})

    existing = get_claim(claim_id)
    if not existing:
        raise TruthTransitionError("claim_not_found")
    _require_write_scope(actor, existing.get("organization_id"))
    if existing.get("ownership_status") == OWNERSHIP_LEGACY_UNSCOPED:
        raise TruthTransitionError("legacy_unscoped_records_cannot_be_approved")
    if existing.get("verification_status") != "verified":
        _audit("public_approval.blocked", "claim", claim_id, {"reason": "claim_not_verified"})
        truth_history_service.append_history_event(
            event_type="transition.rejected",
            entity_type="claim",
            entity_id=claim_id,
            entity_version=existing.get("version"),
            organization_id=existing.get("organization_id"),
            actor_id=getattr(actor, "user_id", ""),
            reason=reason,
            previous_state={"verification_status": existing.get("verification_status")},
            new_state={"attempted": "public_approved"},
        )
        raise TruthTransitionError(
            "claim_not_verified",
            {"claim_id": claim_id, "verification_status": existing.get("verification_status")},
        )

    was_already_approved = bool(existing.get("public_approved"))
    all_claims = _read_list(CLAIMS_PATH)
    for row in all_claims:
        if row.get("claim_id") == claim_id and int(row.get("version", 1)) == int(existing.get("version", 1)):
            row["public_approved"] = True
            row["approved_by"] = getattr(actor, "user_id", "")
            row["approved_at"] = _now()
            row["approval_reason"] = reason
            row["updated_at"] = _now()
    _write_list(CLAIMS_PATH, all_claims)
    updated = get_claim(claim_id)

    _audit("public_approval.updated", "claim", claim_id, {"public_approved": True})
    truth_history_service.append_history_event(
        event_type="claim.public_approved",
        entity_type="claim",
        entity_id=claim_id,
        entity_version=existing.get("version"),
        organization_id=existing.get("organization_id"),
        actor_id=getattr(actor, "user_id", ""),
        reason=reason,
        previous_state={"public_approved": was_already_approved},
        new_state={"public_approved": True},
    )
    return updated


def revoke_public(claim_id: str, actor: Any, reason: str) -> Dict[str, Any]:
    """Requires truth.claim.revoke_public (enforced by the router) and a
    non-empty reason."""
    reason = _clean_string(reason)
    if not reason:
        raise TruthTransitionError("reason_required", {"field": "reason"})

    existing = get_claim(claim_id)
    if not existing:
        raise TruthTransitionError("claim_not_found")
    _require_write_scope(actor, existing.get("organization_id"))

    all_claims = _read_list(CLAIMS_PATH)
    for row in all_claims:
        if row.get("claim_id") == claim_id and int(row.get("version", 1)) == int(existing.get("version", 1)):
            row["public_approved"] = False
            row["revoked_by"] = getattr(actor, "user_id", "")
            row["revoked_at"] = _now()
            row["revocation_reason"] = reason
            row["updated_at"] = _now()
    _write_list(CLAIMS_PATH, all_claims)
    updated = get_claim(claim_id)

    _audit("public_approval.updated", "claim", claim_id, {"public_approved": False})
    truth_history_service.append_history_event(
        event_type="claim.public_approval_revoked",
        entity_type="claim",
        entity_id=claim_id,
        entity_version=existing.get("version"),
        organization_id=existing.get("organization_id"),
        actor_id=getattr(actor, "user_id", ""),
        reason=reason,
        previous_state={"public_approved": existing.get("public_approved")},
        new_state={"public_approved": False},
    )
    return updated


def truth_summary() -> Dict[str, Any]:
    claims = list_claims()
    total = len(claims)
    verified = len([claim for claim in claims if claim.get("verification_status") == "verified"])
    report_ready = len([claim for claim in claims if claim.get("report_ready") is True])
    public_approved = len([claim for claim in claims if claim.get("public_approved") is True])
    missing = len([claim for claim in claims if claim.get("verification_status") == "missing_source"])
    low_coverage = len([claim for claim in claims if _trace_coverage(claim.get("trace_coverage")) < 80])
    return {
        "ok": True,
        "claim_count": total,
        "source_count": len(list_sources()),
        "verified_claim_count": verified,
        "report_ready_count": report_ready,
        "public_approved_count": public_approved,
        "missing_source_count": missing,
        "low_trace_coverage_count": low_coverage,
        "coverage_percent": round((report_ready / total) * 100) if total else 0,
    }


def _percent(numerator: int, denominator: int) -> int:
    return round((numerator / denominator) * 100) if denominator else 0


def truth_coverage() -> Dict[str, Any]:
    claims = list_claims()
    sources = list_sources()
    federation_systems = list_federation_systems()
    total_claims = len(claims)
    verified_claims = len([claim for claim in claims if claim.get("verification_status") == "verified"])
    draft_claims = len([claim for claim in claims if claim.get("verification_status") == "draft"])
    missing_source_claims = len([claim for claim in claims if claim.get("verification_status") == "missing_source"])
    public_approved_claims = len([claim for claim in claims if claim.get("public_approved") is True])
    report_ready_claims = len([claim for claim in claims if claim.get("report_ready") is True])
    trace_total = sum(_trace_coverage(claim.get("trace_coverage")) for claim in claims)
    average_trace_coverage = round(trace_total / total_claims) if total_claims else 0
    verified_percent = _percent(verified_claims, total_claims)
    public_approved_percent = _percent(public_approved_claims, total_claims)
    report_ready_percent = _percent(report_ready_claims, total_claims)
    missing_source_percent = _percent(missing_source_claims, total_claims)

    if verified_percent >= 90 and missing_source_percent <= 5:
        coverage_status = "excellent"
    elif verified_percent >= 75 and missing_source_percent <= 15:
        coverage_status = "good"
    elif verified_percent >= 50:
        coverage_status = "warning"
    else:
        coverage_status = "critical"

    return {
        "ok": True,
        "total_claims": total_claims,
        "total_sources": len(sources),
        "total_packages_available": len(claims),
        "total_federated_systems": len(federation_systems),
        "active_federated_systems": len([system for system in federation_systems if system.get("active") is True]),
        "verified_claims": verified_claims,
        "draft_claims": draft_claims,
        "missing_source_claims": missing_source_claims,
        "public_approved_claims": public_approved_claims,
        "report_ready_claims": report_ready_claims,
        "average_trace_coverage": average_trace_coverage,
        "verified_percent": verified_percent,
        "public_approved_percent": public_approved_percent,
        "report_ready_percent": report_ready_percent,
        "missing_source_percent": missing_source_percent,
        "coverage_status": coverage_status,
    }


def _make_finding(
    *,
    index: int,
    severity: str,
    category: str,
    message: str,
    suggested_fix: str,
    claim_id: Optional[str] = None,
    source_id: Optional[str] = None,
) -> Dict[str, Any]:
    finding: Dict[str, Any] = {
        "finding_id": f"truth_drift_{index:04d}",
        "severity": severity,
        "category": category,
        "message": message,
        "suggested_fix": suggested_fix,
    }
    if claim_id:
        finding["claim_id"] = claim_id
    if source_id:
        finding["source_id"] = source_id
    return finding


def truth_drift() -> Dict[str, Any]:
    raw_claims = _read_list(CLAIMS_PATH)
    claims = list_claims()
    sources = list_sources()
    source_ids = {str(source.get("source_id") or "") for source in sources}
    federation_systems = list_federation_systems()
    federation_map = {system.get("system_id"): system for system in federation_systems}
    findings: List[Dict[str, Any]] = []

    def add(**kwargs: Any) -> None:
        findings.append(_make_finding(index=len(findings) + 1, **kwargs))

    for claim in raw_claims:
        claim_id = _clean_string(claim.get("claim_id"))
        claim_source_ids = _clean_source_ids(claim.get("source_ids"))
        raw_status = _clean_string(claim.get("verification_status")).lower()
        raw_trust = _clean_string(claim.get("trust_level")).lower()
        claim_system_id = _clean_string(claim.get("system_id") or claim.get("app_id") or "shs")

        if claim_system_id not in federation_map:
            add(
                severity="WARNING",
                category="unknown_federation_system",
                claim_id=claim_id,
                message="Claim app_id/system_id is not registered in the Truth Spine federation registry.",
                suggested_fix="Register the system or remap the claim to a known federated system.",
            )
        elif bool(claim.get("public_approved")) and federation_map[claim_system_id].get("trust_mode") == "blocked":
            add(
                severity="CRITICAL",
                category="blocked_federation_public_claim",
                claim_id=claim_id,
                message="Claim is public_approved from a blocked federated system.",
                suggested_fix="Remove public approval and review the federated system trust mode.",
            )

        if not claim_source_ids:
            add(
                severity="WARNING",
                category="missing_source",
                claim_id=claim_id,
                message="Claim has no source_ids.",
                suggested_fix="Attach at least one verified source before reporting or public approval.",
            )

        for source_id in claim_source_ids:
            if source_id not in source_ids:
                add(
                    severity="WARNING",
                    category="missing_source",
                    claim_id=claim_id,
                    source_id=source_id,
                    message="Claim references a source_id that does not exist.",
                    suggested_fix="Create the missing source or remove the stale source_id from the claim.",
                )

        if bool(claim.get("public_approved")) and raw_status not in {"verified", "public_approved"}:
            add(
                severity="CRITICAL",
                category="unsafe_public_approval",
                claim_id=claim_id,
                message="Claim is public_approved without a verified/public-approved status.",
                suggested_fix="Remove public approval until Truth Spine verification passes.",
            )

        if bool(claim.get("report_ready")) and _trace_coverage(claim.get("trace_coverage")) < 80:
            add(
                severity="CRITICAL",
                category="unsafe_report_readiness",
                claim_id=claim_id,
                message="Claim is report_ready with trace_coverage below 80.",
                suggested_fix="Raise trace coverage to at least 80 or mark the claim not report-ready.",
            )

        if raw_trust == "public_approved" and not bool(claim.get("public_approved")):
            add(
                severity="WARNING",
                category="trust_level_mismatch",
                claim_id=claim_id,
                message="Claim trust_level is public_approved but public_approved is false.",
                suggested_fix="Align trust_level with public approval state.",
            )

        if not raw_status or raw_status not in KNOWN_CLAIM_STATUSES:
            add(
                severity="WARNING",
                category="unknown_status",
                claim_id=claim_id,
                message="Claim verification_status is missing or unknown.",
                suggested_fix="Use missing_source, draft, or verified for V1 claims.",
            )

    for claim in claims:
        package = build_truth_package(claim.get("claim_id"))
        if package and not package.get("package_hash"):
            add(
                severity="WARNING",
                category="package_hash_missing",
                claim_id=claim.get("claim_id"),
                message="Truth package is missing its deterministic package_hash.",
                suggested_fix="Regenerate the Truth Package before reporting.",
            )
        if claim.get("verification_status") == "draft" and not any(finding.get("claim_id") == claim.get("claim_id") for finding in findings):
            add(
                severity="INFO",
                category="draft_internal",
                claim_id=claim.get("claim_id"),
                message="Claim remains draft/internal-only.",
                suggested_fix="Attach verified sources and raise trace coverage when the claim is ready for reporting.",
            )

    for source in sources:
        status = _clean_string(source.get("verification_status")).lower()
        source_system_id = _clean_string(source.get("system_id"))
        if source_system_id and source_system_id not in federation_map:
            add(
                severity="WARNING",
                category="unknown_source_system",
                source_id=source.get("source_id"),
                message="Source system_id is not registered in the Truth Spine federation registry.",
                suggested_fix="Register the source system or clear the unsupported system_id.",
            )
        if not status or status not in KNOWN_SOURCE_STATUSES:
            add(
                severity="WARNING",
                category="unknown_status",
                source_id=source.get("source_id"),
                message="Source verification_status is missing or unknown.",
                suggested_fix="Use draft, unverified, verified, approved, or public_approved for V1 sources.",
            )

    severity_counts = {"CRITICAL": 0, "WARNING": 0, "INFO": 0}
    for finding in findings:
        severity = str(finding.get("severity") or "INFO").upper()
        severity_counts[severity] = severity_counts.get(severity, 0) + 1

    return {
        "ok": True,
        "total_findings": len(findings),
        "severity_counts": severity_counts,
        "findings": findings,
    }


def audit_feed(limit: int = 100) -> List[Dict[str, Any]]:
    _ensure_storage()
    if not AUDIT_LOG_PATH.exists():
        return []
    lines = AUDIT_LOG_PATH.read_text(encoding="utf-8").splitlines()
    events: List[Dict[str, Any]] = []
    for line in lines[-max(1, int(limit)):]:
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(event, dict):
            events.append(event)
    return events
