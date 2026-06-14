from __future__ import annotations

import json
import hashlib
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


SERVICE_ROOT = Path(__file__).resolve().parents[1]
TRUTH_DB_DIR = SERVICE_ROOT / "db" / "truth"
CLAIMS_PATH = TRUTH_DB_DIR / "claims.json"
SOURCES_PATH = TRUTH_DB_DIR / "sources.json"
FEDERATION_PATH = TRUTH_DB_DIR / "federation_registry.json"
AUDIT_LOG_PATH = SERVICE_ROOT / "logs" / "truth.audit.log"

VERIFIED_SOURCE_STATUSES = {"verified", "approved", "public_approved"}
VALID_TRUST_LEVELS = {"draft", "sample", "verified", "public_approved"}
KNOWN_CLAIM_STATUSES = {"missing_source", "draft", "verified"}
KNOWN_SOURCE_STATUSES = {"draft", "verified", "approved", "public_approved", "unverified"}
TRUST_MODES = {"local", "trusted_partner", "review_required", "blocked"}

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
    _ensure_storage()
    try:
        data = json.loads(path.read_text(encoding="utf-8") or "[]")
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def _write_list(path: Path, items: List[Dict[str, Any]]) -> None:
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


def list_sources() -> List[Dict[str, Any]]:
    return _read_list(SOURCES_PATH)


def list_claims() -> List[Dict[str, Any]]:
    sources = list_sources()
    return [_apply_truth_rules(claim, sources) for claim in _read_list(CLAIMS_PATH)]


def get_source(source_id: str) -> Optional[Dict[str, Any]]:
    return next((source for source in list_sources() if source.get("source_id") == source_id), None)


def get_claim(claim_id: str) -> Optional[Dict[str, Any]]:
    return next((claim for claim in list_claims() if claim.get("claim_id") == claim_id), None)


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


def _canonical_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _sha256_payload(value: Dict[str, Any]) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def _normalize_source(payload: Dict[str, Any], existing: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    now = _now()
    source_id = _clean_string(payload.get("source_id") or (existing or {}).get("source_id") or f"src_{uuid.uuid4().hex[:12]}")
    created_at = _clean_string((existing or {}).get("created_at") or payload.get("created_at") or now)
    verification_status = _clean_string(payload.get("verification_status") or (existing or {}).get("verification_status") or "draft").lower()
    return {
        "source_id": source_id,
        "system_id": _clean_string(payload.get("system_id") or (existing or {}).get("system_id")),
        "source_type": _clean_string(payload.get("source_type") or (existing or {}).get("source_type") or "manual"),
        "title": _clean_string(payload.get("title") or (existing or {}).get("title") or "Untitled source"),
        "uri": _clean_string(payload.get("uri") or (existing or {}).get("uri")),
        "evidence_type": _clean_string(payload.get("evidence_type") or (existing or {}).get("evidence_type") or "document"),
        "verification_status": verification_status,
        "created_at": created_at,
        "updated_at": now,
    }


def _base_claim(payload: Dict[str, Any], existing: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    now = _now()
    claim_id = _clean_string(payload.get("claim_id") or (existing or {}).get("claim_id") or f"claim_{uuid.uuid4().hex[:12]}")
    created_at = _clean_string((existing or {}).get("created_at") or payload.get("created_at") or now)
    public_approved = bool(payload.get("public_approved", (existing or {}).get("public_approved", False)))
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
        "verification_status": _clean_string(payload.get("verification_status") or (existing or {}).get("verification_status") or "missing_source"),
        "trust_level": _clean_string(payload.get("trust_level") or (existing or {}).get("trust_level") or "draft"),
        "trace_coverage": _trace_coverage(payload.get("trace_coverage", (existing or {}).get("trace_coverage", 0))),
        "public_approved": public_approved,
        "report_ready": bool(payload.get("report_ready", (existing or {}).get("report_ready", False))),
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


def create_source(payload: Dict[str, Any]) -> Dict[str, Any]:
    sources = list_sources()
    source = _normalize_source(payload)
    sources = [item for item in sources if item.get("source_id") != source["source_id"]]
    sources.append(source)
    _write_list(SOURCES_PATH, sources)
    _audit("source.upserted", "source", source["source_id"], {"verification_status": source["verification_status"]})
    return source


def create_claim(payload: Dict[str, Any]) -> Dict[str, Any]:
    claims = _read_list(CLAIMS_PATH)
    existing = next((claim for claim in claims if claim.get("claim_id") == payload.get("claim_id")), None)
    claim = _base_claim(payload, existing=existing)
    claim = _apply_truth_rules(claim, list_sources())
    stored_claim = {key: value for key, value in claim.items() if key != "warnings"}
    claims = [item for item in claims if item.get("claim_id") != stored_claim["claim_id"]]
    claims.append(stored_claim)
    _write_list(CLAIMS_PATH, claims)
    _audit("claim.upserted", "claim", stored_claim["claim_id"], {"verification_status": claim["verification_status"]})
    return claim


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
    return _read_list(FEDERATION_PATH)


def get_federation_system(system_id: str) -> Optional[Dict[str, Any]]:
    clean_id = _clean_string(system_id)
    return next((system for system in list_federation_systems() if system.get("system_id") == clean_id), None)


def upsert_federation_system(payload: Dict[str, Any]) -> Dict[str, Any]:
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
        "display_scope": "public" if claim.get("public_approved") is True else "internal",
        "warnings": warnings,
    }
    return {**package, "package_hash": _sha256_payload(package)}


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
            "actor": "shs-truth-spine-v1",
            "summary": "Claim entered Truth Spine.",
            "state": {"verification_status": "missing_source", "trust_level": "draft"},
        }
    ]
    for source in linked_sources:
        timeline.append({
            "ts": source.get("created_at"),
            "event_type": "source_created",
            "actor": "shs-truth-spine-v1",
            "source_id": source.get("source_id"),
            "summary": "Source attached to Truth Spine evidence registry.",
            "state": {"verification_status": source.get("verification_status")},
        })
        if source.get("updated_at") and source.get("updated_at") != source.get("created_at"):
            timeline.append({
                "ts": source.get("updated_at"),
                "event_type": "source_updated",
                "actor": "shs-truth-spine-v1",
                "source_id": source.get("source_id"),
                "summary": "Source verification state updated.",
                "state": {"verification_status": source.get("verification_status")},
            })
    if claim.get("updated_at") and claim.get("updated_at") != claim.get("created_at"):
        timeline.append({
            "ts": claim.get("updated_at"),
            "event_type": "claim_updated",
            "actor": "shs-truth-spine-v1",
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
            "actor": "shs-truth-spine-v1",
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


def patch_public_approval(claim_id: str, public_approved: bool) -> Optional[Dict[str, Any]]:
    existing = get_claim(claim_id)
    if not existing:
        return None
    requested = bool(public_approved)
    if requested and existing.get("verification_status") != "verified":
        updated = create_claim({**existing, "public_approved": False})
        _audit("public_approval.blocked", "claim", claim_id, {"reason": "claim_not_verified"})
        return {**updated, "approval_blocked": True, "block_reason": "public_approved requires verification_status verified"}
    updated = create_claim({**existing, "public_approved": requested})
    _audit("public_approval.updated", "claim", claim_id, {"public_approved": requested})
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
