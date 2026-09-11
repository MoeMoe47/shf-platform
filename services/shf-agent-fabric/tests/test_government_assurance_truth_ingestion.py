from __future__ import annotations

from types import SimpleNamespace

from services import operational_event_service
from services.internal_service_identity import ALLOWED_SERVICE_EVENTS
from services.reporting_lineage_service import find_lineage_for_event


def _actor():
    return SimpleNamespace(
        principal_type="service",
        service_id="service:shs-api",
        organization_id="org-gpa",
        user_id="user-gpa",
        role="user",
    )


def _payload():
    return {
        "event_type": "government_assurance.truth_determination.accepted",
        "producer_id": "shs.government_assurance",
        "schema_version": "v1",
        "subject_type": "gpa_truth_determination",
        "subject_id": "determination-1",
        "organization_id": "org-gpa",
        "tenant_id": "tenant:org-gpa",
        "originating_actor_id": "user-gpa",
        "originating_actor_type": "user",
        "occurred_at": "2026-09-08T12:00:00+00:00",
        "idempotency_key": "gpa-truth-determination:determination-1:accepted",
        "correlation_id": "corr-gpa-1",
        "payload": {
            "determination_id": "determination-1",
            "truth_fact_id": "truth-1",
            "claim_reference": "claim-1",
            "verification_reference": "verification-1",
            "provenance_reference": "source-1",
            "truth_spine_authority": "shs-truth-spine-v1",
            "truth_spine_status": "PENDING_TRUTH_SPINE_INGESTION",
            "lifecycle_status": "accepted",
        },
    }


def test_gpa_determination_is_an_allowed_truth_spine_producer():
    assert ("shs.government_assurance", "government_assurance.truth_determination.accepted") in ALLOWED_SERVICE_EVENTS
    lineage = find_lineage_for_event("shs.government_assurance", "government_assurance.truth_determination.accepted")
    assert lineage is not None
    assert lineage["truth_eligibility"] == "TRUTH_ELIGIBLE"
    assert lineage["truth_claim_type"] == "government_assurance_determination"


def test_gpa_determination_payload_is_validated_by_the_existing_ingestion_contract():
    payload = _payload()
    operational_event_service.validate_operational_event(payload, _actor())

    payload["payload"]["truth_spine_status"] = "ACCEPTED"
    try:
        operational_event_service.validate_operational_event(payload, _actor())
    except operational_event_service.OperationalEventError as exc:
        assert exc.reason == "invalid_government_assurance_truth_determination_payload"
    else:
        raise AssertionError("invalid GPA Truth Spine status was accepted")
