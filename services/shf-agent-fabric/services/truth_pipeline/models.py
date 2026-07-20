from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

PIPELINE_SCHEMA_VERSION = "shs.truth_pipeline.v1"
TRUTH_PACKAGE_SCHEMA_VERSION = "shs.truth_package.v1"
REPRESENTATIVE_TRACE_ID = "trc_02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
REPRESENTATIVE_REQUEST_ID = "req_02bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
REPRESENTATIVE_CORRELATION_ID = "corr_batch_02_unified_truth"
REPRESENTATIVE_ORGANIZATION_ID = "org_shs_batch_02"
REPRESENTATIVE_CLIENT_ID = "client_demo_truth_pipeline"
REPRESENTATIVE_PROGRAM_ID = "program_demo_workforce_readiness"
REPRESENTATIVE_ENTITY_ID = "entity_batch02_program_workforce_readiness"

PIPELINE_CONTRACT_IDS = [
    "CONTRACT-V1-003",
    "CONTRACT-V1-004",
    "CONTRACT-V1-005",
    "CONTRACT-V1-006",
    "CONTRACT-V1-007",
    "CONTRACT-V1-008",
    "CONTRACT-V1-009",
    "CONTRACT-V1-010",
    "CONTRACT-V1-028",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def stable_id(prefix: str, value: Any, length: int = 16) -> str:
    digest = hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()[:length]
    return f"{prefix}_{digest}"


def trace_context(causation_id: str, event_id: str = "") -> dict[str, Any]:
    return {
        "trace_id": REPRESENTATIVE_TRACE_ID,
        "request_id": REPRESENTATIVE_REQUEST_ID,
        "correlation_id": REPRESENTATIVE_CORRELATION_ID,
        "causation_id": causation_id,
        "event_id": event_id or stable_id("evt", causation_id),
        "parent_event_id": "",
        "contract_version": "v1",
        "pipeline_schema_version": PIPELINE_SCHEMA_VERSION,
    }


def permission_context(actor_id: str = "usr_batch02_shs_admin") -> dict[str, Any]:
    return {
        "actor_id": actor_id,
        "actor_type": "human_operator",
        "role": "shs_admin",
        "organization_id": REPRESENTATIVE_ORGANIZATION_ID,
        "client_id": REPRESENTATIVE_CLIENT_ID,
        "program_id": REPRESENTATIVE_PROGRAM_ID,
        "permissions": [
            "bos.identity.read",
            "bos.registry.read",
            "bos.governance.read",
            "bos.reports.read",
            "bos.tracking.read",
        ],
    }


def representative_fixture() -> dict[str, Any]:
    received = "2026-07-14T04:00:00+00:00"
    common = {
        "organization_id": REPRESENTATIVE_ORGANIZATION_ID,
        "client_id": REPRESENTATIVE_CLIENT_ID,
        "program_id": REPRESENTATIVE_PROGRAM_ID,
        "subject_reference": {
            "subject_type": "program_metric",
            "program_name": "Demo Workforce Readiness",
            "metric_name": "participants_ready_for_placement",
        },
        "permission_context": permission_context(),
        "contract_version": "v1",
    }
    return {
        "fixture_id": "BATCH02_SAFE_DEMO_WORKFORCE_READINESS",
        "private_production_data": False,
        "selection_reason": "Synthetic two-source program metric demonstrates source identity, canonical entity resolution, evidence review, minor contradiction resolution, Oracle certification, reporting readiness, action, recompute, and tracking without private participant data.",
        "source_claims": [
            {
                **common,
                "claim_id": "claim_batch02_source_a",
                "claim_type": "program_metric",
                "source_id": "source_batch02_operator_report",
                "source_record_id": "operator-report-row-001",
                "claim_data": {"metric_name": "participants_ready_for_placement", "metric_value": 42, "unit": "count"},
                "source_timestamp": "2026-07-13T20:00:00+00:00",
                "received_timestamp": received,
                "provenance": {"source_type": "operator_record", "owner": "Data Operations", "evidence_ref": "evidence_batch02_operator_report"},
                "trace_context": trace_context("intake-source-a", "evt_batch02_intake_a"),
            },
            {
                **common,
                "claim_id": "claim_batch02_source_b",
                "claim_type": "program_metric",
                "source_id": "source_batch02_partner_csv",
                "source_record_id": "partner-csv-row-001",
                "claim_data": {"metric_name": "participants_ready_for_placement", "metric_value": 41, "unit": "count"},
                "source_timestamp": "2026-07-13T21:00:00+00:00",
                "received_timestamp": received,
                "provenance": {"source_type": "partner_feed", "owner": "Data Operations", "evidence_ref": "evidence_batch02_partner_csv"},
                "trace_context": trace_context("intake-source-b", "evt_batch02_intake_b"),
            },
        ],
        "evidence": [
            {"evidence_id": "evidence_batch02_operator_report", "source_id": "source_batch02_operator_report", "trust_tier": "standard", "sufficient": True},
            {"evidence_id": "evidence_batch02_partner_csv", "source_id": "source_batch02_partner_csv", "trust_tier": "high", "sufficient": True},
        ],
    }

