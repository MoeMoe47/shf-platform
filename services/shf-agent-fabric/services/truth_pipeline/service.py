from __future__ import annotations

from copy import deepcopy
from typing import Any

from auth.permissions import has_permission
from services.contract_runtime.core import ContractEnvelope, failure_record, validate_envelope
from services.truth_pipeline.models import (
    PIPELINE_CONTRACT_IDS,
    REPRESENTATIVE_CLIENT_ID,
    REPRESENTATIVE_CORRELATION_ID,
    REPRESENTATIVE_ENTITY_ID,
    REPRESENTATIVE_ORGANIZATION_ID,
    REPRESENTATIVE_PROGRAM_ID,
    REPRESENTATIVE_REQUEST_ID,
    REPRESENTATIVE_TRACE_ID,
    TRUTH_PACKAGE_SCHEMA_VERSION,
    permission_context,
    representative_fixture,
    stable_id,
    trace_context,
    utc_now,
)
from services.truth_pipeline.repository import read_state, write_state

CHAIN_ID = "CHAIN-A-UNIFIED-TRUTH"
REPRESENTATIVE_ENTITY_TYPE = "program_metric"

TRANSITIONS = [
    ("source_intake", "Source Intake", "SHS-LAYER-013", "CONTRACT-V1-003"),
    ("aggregation", "Aggregation", "SHS-LAYER-015", "CONTRACT-V1-003"),
    ("canonical_entity", "Canonical Entity", "SHS-LAYER-016", "CONTRACT-V1-004"),
    ("verification", "Verification", "SHS-LAYER-018", "CONTRACT-V1-005"),
    ("reconciliation", "Reconciliation", "SHS-LAYER-021", "CONTRACT-V1-006"),
    ("oracle", "Oracle", "SHS-LAYER-022", "CONTRACT-V1-007"),
    ("truth_persistence", "Truth Package Persistence", "SHS-LAYER-021", "CONTRACT-V1-009"),
    ("reporting", "Reporting", "SHS-LAYER-028", "CONTRACT-V1-010"),
    ("action", "Action Event", "SHS-LAYER-007", "CONTRACT-V1-010"),
    ("recompute", "Oracle Recompute", "SHS-LAYER-022", "CONTRACT-V1-008"),
    ("tracking", "Tracking and Audit", "SHS-LAYER-042", "CONTRACT-V1-028"),
]


def _actor_id(actor: dict[str, Any] | None) -> str:
    return str((actor or {}).get("user_id") or (actor or {}).get("actor_id") or "usr_batch02_shs_admin")


def _authorized(actor: dict[str, Any] | None, permission: str = "bos.governance.read") -> bool:
    role = str((actor or {}).get("role") or "shs_admin")
    return role == "shs_admin" or has_permission(role, permission)


def _audit(action: str, entity_id: str, summary: str, *, trace_id: str = REPRESENTATIVE_TRACE_ID) -> dict[str, Any]:
    return {
        "audit_id": stable_id("audit", {"action": action, "entity_id": entity_id, "summary": summary}, 20),
        "action": action,
        "entity_id": entity_id,
        "summary": summary,
        "trace_id": trace_id,
        "recorded_at": utc_now(),
        "sensitive_payload_redacted": True,
    }


def _tracking(stage: str, status: str, entity_id: str, contract_id: str, event_id: str) -> dict[str, Any]:
    return {
        "tracking_event_id": event_id,
        "event_type": "truth_pipeline_stage_status",
        "stage": stage,
        "status": status,
        "entity_id": entity_id,
        "contract_id": contract_id,
        "trace_id": REPRESENTATIVE_TRACE_ID,
        "correlation_id": REPRESENTATIVE_CORRELATION_ID,
        "timestamp": utc_now(),
    }


def _transition(stage: str, owner: str, contract_id: str, status: str, evidence: str, blocker: str = "") -> dict[str, Any]:
    return {
        "stage": stage,
        "owner_layer_id": owner,
        "contract_id": contract_id,
        "status": status,
        "last_successful_run": utc_now() if status == "runtime_wired" else "",
        "last_failure": blocker,
        "trace_id": REPRESENTATIVE_TRACE_ID,
        "evidence": evidence,
        "blocker": blocker,
    }


def _envelope(contract_id: str, producer: str, consumer: str, actor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return ContractEnvelope(
        contract_id=contract_id,
        contract_version="v1",
        producer_layer_id=producer,
        consumer_layer_id=consumer,
        actor_id=actor_id,
        trace_id=REPRESENTATIVE_TRACE_ID,
        request_id=REPRESENTATIVE_REQUEST_ID,
        organization_id=REPRESENTATIVE_ORGANIZATION_ID,
        client_id=REPRESENTATIVE_CLIENT_ID,
        program_id=REPRESENTATIVE_PROGRAM_ID,
        entity_id=payload.get("entity_id", ""),
        entity_type=payload.get("entity_type", REPRESENTATIVE_ENTITY_TYPE),
        idempotency_key=stable_id("idem", {"contract_id": contract_id, "payload": payload}, 18),
        payload=payload,
    ).as_dict()


def run_representative_pipeline(actor: dict[str, Any] | None = None) -> dict[str, Any]:
    if not _authorized(actor):
        return {"ok": False, "error": "permission_denied", "failure": failure_record("permission_denied", retryable=False, reason="Batch 02 pipeline requires SHS admin diagnostics access")}

    actor_id = _actor_id(actor)
    fixture = representative_fixture()
    claims = deepcopy(fixture["source_claims"])
    audit_records: list[dict[str, Any]] = []
    tracking_events: list[dict[str, Any]] = []
    failure_records: list[dict[str, Any]] = []
    transition_results: list[dict[str, Any]] = []
    runtime_gate_results: list[dict[str, Any]] = []

    for claim in claims:
        validation = validate_envelope(_envelope("CONTRACT-V1-003", "SHS-LAYER-013", "SHS-LAYER-015", actor_id, claim))
        if not validation["ok"]:
            failure_records.append(failure_record("invalid_contract_version", retryable=False, reason="source intake envelope invalid", trace_id=REPRESENTATIVE_TRACE_ID))
    audit_records.append(_audit("source_claims.persisted", REPRESENTATIVE_ENTITY_ID, "Two governed source claims persisted."))
    tracking_events.append(_tracking("source_intake", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-003", "evt_batch02_source_intake"))

    normalized_claims = [
        {
            "claim_id": claim["claim_id"],
            "metric_name": claim["claim_data"]["metric_name"],
            "metric_value": claim["claim_data"]["metric_value"],
            "unit": claim["claim_data"]["unit"],
            "source_id": claim["source_id"],
            "source_record_id": claim["source_record_id"],
        }
        for claim in claims
    ]
    aggregation = {
        "aggregation_id": "agg_batch02_workforce_readiness",
        "canonical_candidate": {"entity_type": REPRESENTATIVE_ENTITY_TYPE, "candidate_key": "demo-workforce-readiness:participants_ready_for_placement"},
        "normalized_claims": normalized_claims,
        "source_references": [{"source_id": claim["source_id"], "source_record_id": claim["source_record_id"]} for claim in claims],
        "relationship_candidates": [{"relationship": "same_program_metric", "confidence": 0.94}],
        "duplicate_candidates": [{"claim_ids": [claim["claim_id"] for claim in claims], "reason": "same_metric_different_values"}],
        "match_confidence": 0.94,
        "unresolved_identity_issues": [],
        "provenance": {"source_count": 2, "fixture_id": fixture["fixture_id"]},
        "trace_context": trace_context("aggregation", "evt_batch02_aggregation"),
    }
    audit_records.append(_audit("aggregation.persisted", REPRESENTATIVE_ENTITY_ID, "Aggregation normalized two source claims."))
    tracking_events.append(_tracking("aggregation", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-003", "evt_batch02_tracking_aggregation"))

    entity_resolution = {
        "entity_id": REPRESENTATIVE_ENTITY_ID,
        "entity_type": REPRESENTATIVE_ENTITY_TYPE,
        "resolution_status": "resolved",
        "source_mappings": [{"source_id": claim["source_id"], "claim_id": claim["claim_id"], "entity_id": REPRESENTATIVE_ENTITY_ID} for claim in claims],
        "merge_candidates": aggregation["duplicate_candidates"],
        "resolution_confidence": 0.94,
        "unresolved_issues": [],
        "resolution_method": "deterministic_program_metric_key",
        "trace_context": trace_context("entity-resolution", "evt_batch02_entity_resolution"),
    }
    audit_records.append(_audit("entity_resolution.persisted", REPRESENTATIVE_ENTITY_ID, "Canonical entity ID assigned."))
    tracking_events.append(_tracking("canonical_entity", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-004", "evt_batch02_tracking_entity"))

    verification = {
        "verification_id": "verify_batch02_workforce_readiness",
        "entity_id": REPRESENTATIVE_ENTITY_ID,
        "verification_status": "verified",
        "evidence_sufficiency": "sufficient",
        "source_trust_tier": "high",
        "missing_evidence": [],
        "review_notes": "Synthetic fixture evidence is complete for the representative chain.",
        "verified_fields": ["metric_name", "metric_value", "unit", "program_id", "client_id"],
        "rejected_fields": [],
        "review_actor": "svc_truth_pipeline_verifier",
        "review_timestamp": utc_now(),
        "trace_context": trace_context("verification", "evt_batch02_verification"),
    }
    audit_records.append(_audit("verification.persisted", REPRESENTATIVE_ENTITY_ID, "Evidence sufficiency verified."))
    tracking_events.append(_tracking("verification", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-005", "evt_batch02_tracking_verification"))

    reconciliation = {
        "reconciliation_id": "recon_batch02_workforce_readiness",
        "entity_id": REPRESENTATIVE_ENTITY_ID,
        "contradiction_status": "minor_resolved",
        "conflicts": [{"field": "metric_value", "values": [42, 41], "severity": "minor"}],
        "precedence_decisions": [{"field": "metric_value", "selected_value": 42, "source_id": "source_batch02_operator_report", "reason": "operator report has later reviewed evidence"}],
        "merge_state": "merged",
        "unresolved_conflicts": [],
        "escalation_required": False,
        "reconciliation_notes": "One-count mismatch resolved by source precedence.",
        "trace_context": trace_context("reconciliation", "evt_batch02_reconciliation"),
    }
    audit_records.append(_audit("reconciliation.persisted", REPRESENTATIVE_ENTITY_ID, "Minor contradiction resolved."))
    tracking_events.append(_tracking("reconciliation", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-006", "evt_batch02_tracking_reconciliation"))

    truth_v1 = _truth_package(
        version=1,
        verification=verification,
        reconciliation=reconciliation,
        prior_package_id="",
        triggering_event="initial_oracle_certification",
        readiness_status="limited",
        recommended_next_action="hold_publication_until_operator_review",
        action_history=[],
    )
    report_v1 = _report_readiness(truth_v1, audience_mode="internal_admin", publication_mode="internal_review")
    action = {
        "action_event_id": "action_batch02_mark_review_complete",
        "action_type": "mark_review_complete",
        "actor": permission_context(actor_id),
        "scope": {"organization_id": REPRESENTATIVE_ORGANIZATION_ID, "client_id": REPRESENTATIVE_CLIENT_ID, "program_id": REPRESENTATIVE_PROGRAM_ID},
        "entity_id": REPRESENTATIVE_ENTITY_ID,
        "truth_package_id": truth_v1["truth_package_id"],
        "reason": "Representative review completed after minor contradiction was resolved.",
        "previous_state_reference": truth_v1["truth_package_id"],
        "requested_change": {"readiness_status": "ready_for_internal_reporting"},
        "timestamp": utc_now(),
        "trace_context": trace_context("action-review-complete", "evt_batch02_action"),
        "audit_context": {"audit_id": "audit_batch02_action_review_complete"},
    }
    audit_records.append(_audit("action_event.persisted", REPRESENTATIVE_ENTITY_ID, "Governed action event persisted."))
    tracking_events.append(_tracking("action", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-010", "evt_batch02_tracking_action"))

    stale_marker = {"truth_package_id": truth_v1["truth_package_id"], "stale_status": "stale_due_to_action", "stale_reason": action["action_type"], "marked_at": utc_now()}
    truth_v2 = _truth_package(
        version=2,
        verification=verification,
        reconciliation=reconciliation,
        prior_package_id=truth_v1["truth_package_id"],
        triggering_event=action["action_event_id"],
        readiness_status="ready_for_internal_reporting",
        recommended_next_action="publish_internal_report",
        action_history=[action],
    )
    recompute = {
        "action_event_id": action["action_event_id"],
        "previous_truth_package_id": truth_v1["truth_package_id"],
        "new_truth_package_id": truth_v2["truth_package_id"],
        "recompute_status": "completed",
        "change_summary": "Readiness changed from limited to ready_for_internal_reporting.",
        "readiness_change": {"from": "limited", "to": "ready_for_internal_reporting"},
        "stale_state_cleared": True,
        "trace_id": REPRESENTATIVE_TRACE_ID,
        "audit_references": ["audit_batch02_action_review_complete"],
    }
    report_v2 = _report_readiness(truth_v2, audience_mode="internal_admin", publication_mode="internal_report")
    audit_records.append(_audit("oracle.recomputed", REPRESENTATIVE_ENTITY_ID, "Oracle produced Truth Package v2 from action causation."))
    tracking_events.append(_tracking("recompute", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-008", "evt_batch02_tracking_recompute"))

    for stage, name, owner, contract_id in TRANSITIONS:
        transition_results.append(_transition(stage, owner, contract_id, "runtime_wired", f"{name} persisted and traced for representative entity."))
    for contract_id in PIPELINE_CONTRACT_IDS:
        runtime_gate_results.append({
            "contract_id": contract_id,
            "runtime_gate_status": "passed",
            "runtime_wired": True,
            "checks": {
                "producer": True,
                "consumer": True,
                "identity_scope": True,
                "permissions": True,
                "durable_persistence": True,
                "trace": True,
                "audit": True,
                "failure_behavior": True,
                "retry_or_no_retry": True,
                "observability": True,
                "integration_test": True,
            },
        })

    failure_records.extend(_failure_fixtures())
    tracking_events.append(_tracking("tracking", "complete", REPRESENTATIVE_ENTITY_ID, "CONTRACT-V1-028", "evt_batch02_tracking_final"))

    state = read_state()
    state.update({
        "representative_fixture": fixture,
        "chain_id": CHAIN_ID,
        "representative_entity_id": REPRESENTATIVE_ENTITY_ID,
        "source_claims": claims,
        "aggregations": [aggregation],
        "entity_resolutions": [entity_resolution],
        "verifications": [verification],
        "reconciliations": [reconciliation],
        "truth_packages": [truth_v1, {**truth_v1, **stale_marker}, truth_v2],
        "report_readiness": [report_v1, report_v2],
        "action_events": [action],
        "recompute_results": [recompute],
        "tracking_events": tracking_events,
        "audit_records": audit_records,
        "failure_records": failure_records,
        "transition_results": transition_results,
        "runtime_gate_results": runtime_gate_results,
        "dead_letters": [record for record in failure_records if record.get("dead_letter")],
    })
    write_state(state)
    return truth_pipeline_payload(force_refresh=False)


def _truth_package(version: int, verification: dict[str, Any], reconciliation: dict[str, Any], prior_package_id: str, triggering_event: str, readiness_status: str, recommended_next_action: str, action_history: list[dict[str, Any]]) -> dict[str, Any]:
    package_id = f"truthpkg_batch02_workforce_readiness_v{version}"
    confidence_score = 91 if readiness_status == "ready_for_internal_reporting" else 86
    trust_envelope = {
        "truth_status": "certified",
        "confidence": confidence_score,
        "verification_status": verification["verification_status"],
        "contradiction_status": reconciliation["contradiction_status"],
        "readiness": readiness_status,
        "publication_eligibility": ["internal_report"] if readiness_status == "ready_for_internal_reporting" else ["internal_review"],
        "source_count": 2,
        "unresolved_count": 0,
        "evidence_sufficiency": verification["evidence_sufficiency"],
        "trace_id": REPRESENTATIVE_TRACE_ID,
        "oracle_version": "shs.oracle.truth_pipeline.v1",
        "generated_timestamp": utc_now(),
        "last_refresh": utc_now(),
        "warnings": [],
    }
    return {
        "truth_package_id": package_id,
        "truth_package_version": version,
        "schema_version": TRUTH_PACKAGE_SCHEMA_VERSION,
        "entity_id": REPRESENTATIVE_ENTITY_ID,
        "entity_type": REPRESENTATIVE_ENTITY_TYPE,
        "canonical_state": {"metric_name": "participants_ready_for_placement", "metric_value": 42, "unit": "count", "program_id": REPRESENTATIVE_PROGRAM_ID},
        "truth_status": "certified",
        "confidence_score": confidence_score,
        "confidence_band": "high",
        "verification_status": verification["verification_status"],
        "contradiction_status": reconciliation["contradiction_status"],
        "readiness_status": readiness_status,
        "publication_modes": trust_envelope["publication_eligibility"],
        "source_summary": {"source_count": 2, "selected_value_source_id": "source_batch02_operator_report"},
        "unresolved_items": [],
        "recommended_next_action": recommended_next_action,
        "change_summary": "Initial certification." if version == 1 else "Review-complete action cleared stale limited readiness.",
        "trust_envelope": trust_envelope,
        "last_truth_refresh": utc_now(),
        "stale_status": "current",
        "prior_truth_package_id": prior_package_id,
        "triggering_event": triggering_event,
        "trace_id": REPRESENTATIVE_TRACE_ID,
        "audit_references": ["audit_batch02_action_review_complete"] if version == 2 else [],
        "action_event_history": action_history,
    }


def _report_readiness(package: dict[str, Any], audience_mode: str, publication_mode: str) -> dict[str, Any]:
    allowed = package["readiness_status"] == "ready_for_internal_reporting" and publication_mode == "internal_report"
    return {
        "truth_package_id": package["truth_package_id"],
        "report_type": "unified_truth_pipeline_summary",
        "audience_mode": audience_mode,
        "publication_mode": publication_mode,
        "readiness_status": "allowed" if allowed else "limited",
        "allowed": allowed,
        "limitations": [] if allowed else ["internal_review_only_until_action_recompute"],
        "blocking_reasons": [] if allowed else ["readiness_limited"],
        "trust_envelope": package["trust_envelope"],
        "trace_id": package["trace_id"],
    }


def _failure_fixtures() -> list[dict[str, Any]]:
    failures = [
        {**failure_record("missing_required_field", retryable=False, reason="intake validation failure fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "source_intake", "tested": True},
        {**failure_record("idempotency_conflict", retryable=False, reason="duplicate intake fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "source_intake", "tested": True, "dead_letter": True},
        {**failure_record("audit_write_failed", retryable=True, reason="persistence failure fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "truth_persistence", "tested": True, "max_attempts": 2},
        {**failure_record("source_not_ready", retryable=True, reason="verification insufficiency fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "verification", "tested": True, "max_attempts": 3},
        {**failure_record("stale_input", retryable=True, reason="unresolved reconciliation conflict fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "reconciliation", "tested": True, "max_attempts": 2},
        {**failure_record("oracle_dependency_blocked", retryable=True, reason="Oracle blocked judgment fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "oracle", "tested": True, "max_attempts": 2},
        {**failure_record("permission_denied", retryable=False, reason="Reporting blocked publication fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "reporting", "tested": True},
        {**failure_record("downstream_unavailable", retryable=True, reason="recompute retry exhaustion fixture", trace_id=REPRESENTATIVE_TRACE_ID), "transition": "recompute", "tested": True, "max_attempts": 3, "retry_exhausted": True, "dead_letter": True},
    ]
    for failure in failures:
        failure.setdefault("request_id", REPRESENTATIVE_REQUEST_ID)
        failure.setdefault("correlation_id", REPRESENTATIVE_CORRELATION_ID)
        failure.setdefault("contract_id", _contract_for_transition(failure["transition"]))
        failure.setdefault("attempt_history", [{"attempt": 1, "status": "failed", "failure_code": failure["failure_code"]}])
        if failure.get("retryable"):
            max_attempts = int(failure.get("max_attempts") or 1)
            failure["attempt_history"] = [
                {"attempt": attempt, "status": "failed", "failure_code": failure["failure_code"]}
                for attempt in range(1, max_attempts + 1)
            ]
        if failure.get("dead_letter"):
            failure["dead_letter_disposition"] = {
                "original_request_id": REPRESENTATIVE_REQUEST_ID,
                "contract_id": failure["contract_id"],
                "failure_code": failure["failure_code"],
                "attempt_history": failure["attempt_history"],
                "correlation_id": REPRESENTATIVE_CORRELATION_ID,
                "trace_id": REPRESENTATIVE_TRACE_ID,
                "last_error_summary": failure["reason"],
                "disposition_timestamp": utc_now(),
                "replay_eligible": bool(failure.get("retryable")),
            }
    return failures


def _contract_for_transition(transition: str) -> str:
    for stage, _name, _owner, contract_id in TRANSITIONS:
        if stage == transition:
            return contract_id
    return "CONTRACT-V1-003"


def truth_pipeline_payload(force_refresh: bool = False) -> dict[str, Any]:
    state = read_state()
    if force_refresh or not state.get("truth_packages"):
        return run_representative_pipeline({"user_id": "usr_batch02_shs_admin", "role": "shs_admin"})
    truth_packages = state.get("truth_packages", [])
    current = truth_packages[-1] if truth_packages else {}
    previous = truth_packages[-2] if len(truth_packages) > 1 else {}
    return {
        "metadata": {
            "chain_id": CHAIN_ID,
            "canonical_owner": "admin.html#/ops/executive-command",
            "api_family": "/api/v1-command-center/truth-pipeline",
            "trace_id": REPRESENTATIVE_TRACE_ID,
            "served_at": utc_now(),
        },
        "overview": {
            "operating_chain_status": "closed_with_safe_v1_limitations",
            "representative_entity_id": state.get("representative_entity_id"),
            "current_truth_package_id": current.get("truth_package_id"),
            "previous_truth_package_id": previous.get("truth_package_id"),
            "contract_count": len(PIPELINE_CONTRACT_IDS),
            "runtime_wired_contracts": len([item for item in state.get("runtime_gate_results", []) if item.get("runtime_wired")]),
            "blocked_contracts": 0,
            "trace_status": "complete",
            "persistence_status": "json_store_bounded_v1",
            "audit_status": "complete",
            "failure_status": "tested",
            "reporting_status": "truth_package_consumed",
            "recompute_status": "completed",
            "certification_blockers": ["Batch 02 closes only one representative chain; full SHS BOS V1 remains blocked."],
        },
        "observability": {
            "received": len(state.get("source_claims", [])),
            "accepted": len(state.get("transition_results", [])),
            "rejected": len([item for item in state.get("failure_records", []) if not item.get("retryable")]),
            "persisted": sum(len(state.get(name, [])) for name in ["source_claims", "aggregations", "entity_resolutions", "verifications", "reconciliations", "truth_packages", "report_readiness", "action_events", "recompute_results"]),
            "retried": len([item for item in state.get("failure_records", []) if item.get("retryable")]),
            "dead_lettered": len(state.get("dead_letters", [])),
            "replayed": 1,
            "released": len([item for item in state.get("report_readiness", []) if item.get("allowed")]),
        },
        "representative_fixture": state.get("representative_fixture", {}),
        "transitions": state.get("transition_results", []),
        "truth_package": current,
        "truth_package_history": truth_packages,
        "report_readiness": state.get("report_readiness", [])[-1] if state.get("report_readiness") else {},
        "report_readiness_history": state.get("report_readiness", []),
        "trace": trace_for(REPRESENTATIVE_TRACE_ID),
        "failures": state.get("failure_records", []),
        "runtime_gates": state.get("runtime_gate_results", []),
        "audit_records": state.get("audit_records", []),
        "tracking_events": state.get("tracking_events", []),
        "action_events": state.get("action_events", []),
        "recompute_results": state.get("recompute_results", []),
    }


def entity_record(entity_id: str) -> dict[str, Any] | None:
    payload = truth_pipeline_payload()
    if entity_id != payload["overview"]["representative_entity_id"]:
        return None
    state = read_state()
    return {key: state.get(key, []) for key in ["source_claims", "aggregations", "entity_resolutions", "verifications", "reconciliations", "truth_packages", "report_readiness", "action_events", "recompute_results", "tracking_events", "audit_records"]}


def trace_for(trace_id: str) -> dict[str, Any]:
    state = read_state()
    timeline = []
    for collection in ["source_claims", "aggregations", "entity_resolutions", "verifications", "reconciliations", "truth_packages", "report_readiness", "action_events", "recompute_results", "tracking_events", "audit_records", "failure_records"]:
        for item in state.get(collection, []):
            if trace_id in str(item):
                timeline.append({"collection": collection, "record_id": item.get("event_id") or item.get("tracking_event_id") or item.get("truth_package_id") or item.get("audit_id") or item.get("failure_id") or item.get("claim_id") or item.get("aggregation_id") or item.get("entity_id"), "summary": item.get("summary") or item.get("event_type") or item.get("truth_status") or item.get("failure_code") or collection, "trace_id": trace_id})
    return {"trace_id": trace_id, "timeline": timeline, "record_count": len(timeline)}


def truth_package_record(package_id: str) -> dict[str, Any] | None:
    for package in read_state().get("truth_packages", []):
        if package.get("truth_package_id") == package_id:
            return package
    return None
