from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from auth.permissions import has_permission, SHF_METRIC_READ
from services import truth_spine_service
from services import truth_public_population_service

SERVICE_ROOT = Path(__file__).resolve().parents[1]
METRIC_REGISTRY_PATH = SERVICE_ROOT / "contracts" / "reporting" / "metric_registry.v1.json"
ALLOWED_FORMULAS = {"distinct_subject_count"}
REQUIRED_FIELDS = ("metric_id", "name", "description", "version", "status", "owner", "source_claim_types", "source_predicates", "formula_type", "formula", "numerator_definition", "denominator_definition", "filters", "population", "time_window", "time_zone", "unit", "rounding", "null_handling", "zero_denominator_behavior", "minimum_evidence", "source_verification_requirement", "claim_approval_requirement", "tenant_scope", "organization_scope", "public_eligibility", "small_population_suppression", "effective_from", "effective_to", "supersedes_metric_version", "lineage_output_requirement")

class MetricRegistryError(ValueError): pass
class MetricCalculationError(ValueError): pass

def validate_metric_registry(registry: Dict[str, Any]) -> None:
    if not isinstance(registry, dict) or not isinstance(registry.get("definitions"), list) or not registry["definitions"]:
        raise MetricRegistryError("metric registry must contain definitions")
    keys = set()
    active = set()
    for definition in registry["definitions"]:
        if not isinstance(definition, dict): raise MetricRegistryError("definition must be an object")
        missing = [field for field in REQUIRED_FIELDS if field not in definition]
        if missing: raise MetricRegistryError("definition missing required fields")
        key = (definition["metric_id"], definition["version"])
        if key in keys: raise MetricRegistryError("duplicate metric id/version")
        keys.add(key)
        if definition["status"] == "UNRESOLVED": raise MetricRegistryError("unresolved metric status")
        if definition["status"] == "active" and definition["metric_id"] in active: raise MetricRegistryError("duplicate active metric")
        active.add(definition["metric_id"])
        if definition["formula_type"] not in ALLOWED_FORMULAS: raise MetricRegistryError("unknown formula type")
        if not definition["zero_denominator_behavior"] or definition["public_eligibility"] is None: raise MetricRegistryError("missing calculation policy")
        start = datetime.fromisoformat(str(definition["effective_from"]).replace("Z", "+00:00"))
        end = definition.get("effective_to")
        if end and start >= datetime.fromisoformat(str(end).replace("Z", "+00:00")): raise MetricRegistryError("invalid effective dates")
        if definition["formula_type"] == "distinct_subject_count" and definition["denominator_definition"] is not None:
            raise MetricRegistryError("unsupported denominator")

def load_metric_registry(path: Path = METRIC_REGISTRY_PATH) -> Dict[str, Any]:
    try: registry = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc: raise MetricRegistryError("metric registry unavailable") from exc
    validate_metric_registry(registry)
    return registry

def get_metric_definition(metric_id: str) -> Dict[str, Any]:
    matches = [d for d in load_metric_registry()["definitions"] if d["metric_id"] == metric_id and d["status"] == "active"]
    if len(matches) != 1: raise MetricRegistryError("metric not authorized")
    return matches[0]

def _in_window(value: Any, start: datetime, end: datetime) -> bool:
    try: parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError): return False
    return start <= parsed.astimezone(timezone.utc) <= end

def calculate_metric(metric_id: str, organization_id: str, period_start: str, period_end: str, actor: Any, public: bool = False, correlation_id: str | None = None) -> Dict[str, Any]:
    if not organization_id or not getattr(actor, "organization_id", None) or actor.organization_id != organization_id: raise MetricCalculationError("scope_required")
    definition = get_metric_definition(metric_id)
    try:
        start = datetime.fromisoformat(period_start.replace("Z", "+00:00")).astimezone(timezone.utc)
        end = datetime.fromisoformat(period_end.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError as exc: raise MetricCalculationError("invalid_period") from exc
    if start > end: raise MetricCalculationError("invalid_period")
    sources = {s.get("source_id"): s for s in truth_spine_service.list_sources()}
    included, excluded, reasons = [], [], {}
    seen_subjects = set()
    for claim in truth_spine_service.list_claims():
        reason = None
        if not isinstance(claim, dict):
            if definition.get("fail_closed_on_invalid_input"): raise MetricCalculationError("malformed_population")
            reason = "malformed_claim"
        elif claim.get("organization_id") != organization_id or claim.get("ownership_status") != "scoped": reason = "scope"
        elif claim.get("claim_type") not in definition["source_claim_types"] or claim.get("predicate") not in definition["source_predicates"]: reason = "claim_type_or_predicate"
        elif claim.get("superseded_by"): reason = "superseded"
        elif not _in_window(claim.get("occurred_at"), start, end): reason = "outside_window"
        elif any(not claim.get(field) for field in definition.get("required_claim_fields", ())):
            if definition.get("fail_closed_on_invalid_input"): raise MetricCalculationError("missing_required_metadata")
            reason = "missing_metadata"
        elif not claim.get("source_ids") or not claim.get("evidence_ids"): reason = "missing_evidence"
        elif any(sid not in sources for sid in claim["source_ids"]):
            if definition.get("unavailable_behavior") == "fail_closed_on_missing_source_resolution_or_malformed_population": raise MetricCalculationError("source_unavailable")
            reason = "missing_source"
        elif any(sources.get(sid, {}).get("verification_status") != "verified" for sid in claim["source_ids"]): reason = "unverified_source"
        elif claim.get("verification_status") != "verified": reason = "unapproved_claim"
        elif definition.get("claim_approval_requirement", "").startswith("internal_approved") and "internal_approval_status" not in claim:
            if definition.get("fail_closed_on_invalid_input"): raise MetricCalculationError("missing_approval_state")
            reason = "unapproved_claim"
        elif definition.get("claim_approval_requirement", "").startswith("internal_approved") and claim.get("internal_approval_status") not in {"approved", "not_approved", "revoked"}:
            if definition.get("fail_closed_on_invalid_input"): raise MetricCalculationError("unknown_approval_state")
            reason = "unapproved_claim"
        elif definition.get("claim_approval_requirement", "").startswith("internal_approved") and claim.get("internal_approval_status") != "approved": reason = "unapproved_claim"
        elif public and definition.get("aggregate_public_population_requirement") == "public_population_eligible" and not truth_public_population_service.is_eligible(claim): reason = "public_population_ineligible"
        elif public and definition.get("aggregate_public_population_requirement") == "dual_read_public_approved_or_public_population_eligible" and claim.get("public_approved") is not True and not truth_public_population_service.is_eligible(claim): reason = "unapproved_claim"
        elif public and not definition.get("aggregate_public_population_requirement") and not truth_spine_service.is_publicly_visible(claim): reason = "not_public"
        elif claim["subject_id"] in seen_subjects: reason = "duplicate_subject"
        if reason: excluded.append(claim); reasons[reason] = reasons.get(reason, 0) + 1; continue
        seen_subjects.add(claim["subject_id"]); included.append(claim)
    claim_ids = sorted(c["claim_id"] for c in included)
    unavailable_reasons = set(definition.get("unavailable_on_exclusion_reasons", []))
    if unavailable_reasons.intersection(reasons):
        raise MetricCalculationError("ineligible_population")
    evidence_ids = sorted(e for c in included for e in c["evidence_ids"])
    return {"metric_result_id": hashlib.sha256(f"{metric_id}:{definition['version']}:{organization_id}:{period_start}:{period_end}:{','.join(claim_ids)}".encode()).hexdigest(), "metric_id": metric_id, "metric_version": definition["version"], "organization_id": organization_id, "period_start": period_start, "period_end": period_end, "calculated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(), "value": len(included), "unit": definition["unit"], "numerator": len(included), "denominator": None, "population_count": len({c.get("subject_id") for c in included}), "input_claim_count": len(included), "excluded_claim_count": len(excluded), "exclusion_reasons": reasons, "source_claim_ids": claim_ids, "source_claim_versions": [c.get("version") for c in sorted(included, key=lambda c: c["claim_id"])], "source_evidence_ids": evidence_ids, "definition_digest": hashlib.sha256(json.dumps(definition, sort_keys=True).encode()).hexdigest(), "verification_status": "verified", "public_eligibility": public, "suppression_status": "not_suppressed", "warnings": [], "correlation_id": correlation_id}
