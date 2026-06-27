#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "docs" / "SHS_DIRECT_CONNECT_LAYER_V1.md"
JSON_PATH = ROOT / "docs" / "SHS_DIRECT_CONNECT_LAYER_V1.json"

REQUIRED_KEYS = [
    "layer_name",
    "status",
    "parent_layer",
    "core_framing",
    "not_bank_account_connection_v1",
    "v1_priority_sources",
    "deferred_sensitive_sources",
    "direct_source_proof_definition",
    "purpose",
    "not_this",
    "architecture_position",
    "existing_repo_foundation",
    "v1_responsibilities",
    "data_models",
    "connection_status_states",
    "connector_source_categories",
    "data_trust_rules",
    "ui_placement_recommendations",
    "deferred_scope",
    "security_boundaries",
    "report_clientops_integration",
    "shf_boundary_rules",
    "future_batches",
    "verification_requirements",
]

REQUIRED_PHRASES = [
    "SHS Direct Connect Layer V1",
    "SHS Integration Fabric",
    "Direct-Source Proof Clarification",
    "Direct Connect does not mean bank account connection in V1",
    "Direct Connect means approved source-backed records",
    "source-trust layer",
    "approved records from client systems",
    "SHS systems",
    "files, forms, analytics, reports",
    "manual verified entries",
    "ClientOps records",
    "SHS internal operations",
    "approval workflows",
    "no live banking integration in V1",
    "banking and financial-account connection are deferred",
    "Tracking + Intelligence Layer",
    "SHF Data Approval Gateway",
    "ConnectorSource",
    "ConnectorConnection",
    "ConnectorFieldMapping",
    "ConnectorSyncRun",
    "ConnectorAuditEvent",
    "ConnectorApprovalStatus",
    "ReportSourceBinding",
    "Financial data must never become public impact data by default",
    "no credential storage in V1",
    "Direct Connect does not bypass SHF approval",
]


def main() -> int:
    failures: list[str] = []

    if not MD_PATH.exists():
        failures.append(f"missing file: {MD_PATH.relative_to(ROOT)}")
    if not JSON_PATH.exists():
        failures.append(f"missing file: {JSON_PATH.relative_to(ROOT)}")

    data = {}
    if JSON_PATH.exists():
        try:
            data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            failures.append(f"invalid JSON: {JSON_PATH.relative_to(ROOT)}: {exc}")

    for key in REQUIRED_KEYS:
        if key not in data:
            failures.append(f"JSON missing required key: {key}")

    if data.get("layer_name") != "SHS Direct Connect Layer V1":
        failures.append("JSON layer_name must equal SHS Direct Connect Layer V1")
    if data.get("parent_layer") != "SHS Integration Fabric":
        failures.append("JSON parent_layer must equal SHS Integration Fabric")
    if data.get("status") != "architecture_locked":
        failures.append("JSON status must equal architecture_locked")
    if data.get("core_framing") != "direct_source_proof":
        failures.append("JSON core_framing must equal direct_source_proof")
    if data.get("not_bank_account_connection_v1") is not True:
        failures.append("JSON not_bank_account_connection_v1 must be true")
    if not isinstance(data.get("v1_priority_sources"), list) or not data.get("v1_priority_sources"):
        failures.append("JSON v1_priority_sources must be a non-empty list")
    if not isinstance(data.get("deferred_sensitive_sources"), list) or not data.get("deferred_sensitive_sources"):
        failures.append("JSON deferred_sensitive_sources must be a non-empty list")
    if not isinstance(data.get("direct_source_proof_definition"), str) or not data.get("direct_source_proof_definition").strip():
        failures.append("JSON direct_source_proof_definition must be a non-empty string")

    if MD_PATH.exists():
        markdown = MD_PATH.read_text(encoding="utf-8")
        for phrase in REQUIRED_PHRASES:
            if phrase not in markdown:
                failures.append(f"markdown missing required phrase: {phrase}")

    if failures:
        print("FAIL: SHS Direct Connect Layer V1 checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: SHS Direct Connect Layer V1 architecture lock checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
