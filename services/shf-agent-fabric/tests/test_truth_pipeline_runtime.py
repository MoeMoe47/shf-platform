from __future__ import annotations

from services.truth_pipeline.models import PIPELINE_CONTRACT_IDS, REPRESENTATIVE_ENTITY_ID, REPRESENTATIVE_TRACE_ID
from services.truth_pipeline.service import entity_record, run_representative_pipeline, trace_for, truth_package_record, truth_pipeline_payload


def test_representative_pipeline_closes_unified_truth_chain() -> None:
    payload = run_representative_pipeline({"user_id": "usr_batch02_test_admin", "role": "shs_admin"})

    assert payload["metadata"]["chain_id"] == "CHAIN-A-UNIFIED-TRUTH"
    assert payload["overview"]["operating_chain_status"] == "closed_with_safe_v1_limitations"
    assert payload["overview"]["representative_entity_id"] == REPRESENTATIVE_ENTITY_ID
    assert len(payload["representative_fixture"]["source_claims"]) == 2
    assert payload["truth_package"]["truth_package_version"] == 2
    assert payload["truth_package"]["prior_truth_package_id"] == "truthpkg_batch02_workforce_readiness_v1"
    assert payload["truth_package"]["readiness_status"] == "ready_for_internal_reporting"
    assert payload["report_readiness"]["truth_package_id"] == payload["truth_package"]["truth_package_id"]
    assert payload["report_readiness"]["allowed"] is True
    assert payload["action_events"][0]["truth_package_id"] == "truthpkg_batch02_workforce_readiness_v1"
    assert payload["recompute_results"][0]["new_truth_package_id"] == payload["truth_package"]["truth_package_id"]
    assert payload["trace"]["trace_id"] == REPRESENTATIVE_TRACE_ID
    assert payload["trace"]["record_count"] >= 12
    assert payload["audit_records"]
    assert payload["tracking_events"]


def test_runtime_gates_cover_only_pipeline_contracts() -> None:
    payload = truth_pipeline_payload(force_refresh=True)
    gate_ids = {item["contract_id"] for item in payload["runtime_gates"]}

    assert gate_ids == set(PIPELINE_CONTRACT_IDS)
    assert all(item["runtime_gate_status"] == "passed" for item in payload["runtime_gates"])
    assert all(item["runtime_wired"] is True for item in payload["runtime_gates"])
    assert all(item["checks"]["durable_persistence"] for item in payload["runtime_gates"])
    assert all(item["checks"]["trace"] for item in payload["runtime_gates"])
    assert all(item["checks"]["audit"] for item in payload["runtime_gates"])


def test_failure_retry_and_dead_letter_fixtures_are_present() -> None:
    payload = truth_pipeline_payload(force_refresh=True)
    failures = payload["failures"]
    codes = {item["failure_code"] for item in failures}

    assert {
        "missing_required_field",
        "idempotency_conflict",
        "audit_write_failed",
        "source_not_ready",
        "stale_input",
        "oracle_dependency_blocked",
        "permission_denied",
        "downstream_unavailable",
    }.issubset(codes)
    assert any(item.get("retryable") for item in failures)
    assert any(item.get("dead_letter") for item in failures)
    for item in failures:
        assert item["contract_id"].startswith("CONTRACT-V1-")
        assert item["request_id"]
        assert item["correlation_id"]
        assert item["attempt_history"]
    for item in [record for record in failures if record.get("dead_letter")]:
        disposition = item["dead_letter_disposition"]
        assert disposition["original_request_id"]
        assert disposition["contract_id"] == item["contract_id"]
        assert disposition["failure_code"] == item["failure_code"]
        assert disposition["trace_id"] == REPRESENTATIVE_TRACE_ID


def test_pipeline_denies_unauthorized_actor() -> None:
    result = run_representative_pipeline({"user_id": "usr_batch02_client", "role": "client"})

    assert result["ok"] is False
    assert result["error"] == "permission_denied"


def test_truth_pipeline_records_resolve_without_global_app_startup() -> None:
    pipeline = truth_pipeline_payload(force_refresh=True)
    entity_id = pipeline["overview"]["representative_entity_id"]
    trace_id = pipeline["metadata"].get("trace_id") or REPRESENTATIVE_TRACE_ID
    package_id = pipeline["truth_package"]["truth_package_id"]

    assert entity_record(entity_id)
    assert entity_record("NOPE") is None
    assert trace_for(trace_id)["record_count"] >= 12
    assert truth_package_record(package_id)["truth_package_id"] == package_id
    assert pipeline["observability"]["received"] == 2
    assert pipeline["observability"]["dead_lettered"] >= 1
