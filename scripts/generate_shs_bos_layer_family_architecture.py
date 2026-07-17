#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[1]
AUDIT_DIR = ROOT / "docs" / "v1-layer-audit"
ARCH_DIR = ROOT / "docs" / "architecture"


FAMILIES = [
    {
        "family_id": "F01_FOUNDATION_IDENTITY_ACCESS",
        "official_name": "Foundation, Identity, and Access",
        "short_name": "Foundation & Access",
        "purpose": "Establish identity, organization context, permissions, environment, and foundational platform access.",
        "terminal_outcome": "An authenticated and authorized user, agent, application, or integration can safely access only permitted SHS BOS capabilities and data.",
        "canonical_owner": "Identity & Access",
    },
    {
        "family_id": "F02_INTEGRATION_SOURCE_INTAKE",
        "official_name": "Integration and Source Intake",
        "short_name": "Integration",
        "purpose": "Bring external and internal claims, events, files, and records into SHS BOS without treating them as certified truth.",
        "terminal_outcome": "A traceable, permissioned, normalized source claim enters the SHS BOS processing pipeline with source and connection provenance.",
        "canonical_owner": "Source Registry Layer",
    },
    {
        "family_id": "F03_DATA_IDENTITY_AGGREGATION",
        "official_name": "Data, Identity Resolution, and Aggregation",
        "short_name": "Data & Aggregation",
        "purpose": "Create canonical entities, relationships, normalized events, mappings, and provenance.",
        "terminal_outcome": "Source claims are associated with consistent canonical entities and events while retaining traceable provenance and unresolved identity warnings.",
        "canonical_owner": "Data Aggregator Layer",
    },
    {
        "family_id": "F04_VERIFICATION_RECONCILIATION_TRUTH",
        "official_name": "Verification, Reconciliation, and Certified Truth",
        "short_name": "Certified Truth",
        "purpose": "Evaluate evidence, resolve conflicts, and create certified, confidence-scored, readiness-aware truth packages.",
        "terminal_outcome": "The system produces one traceable truth package stating what is known, confidence, remaining conflicts, and permitted uses.",
        "canonical_owner": "Oracle Layer",
    },
    {
        "family_id": "F05_INTELLIGENCE_AGENT_GOVERNANCE",
        "official_name": "Intelligence, Analysis, and Agent Governance",
        "short_name": "Agent Intelligence",
        "purpose": "Explain, summarize, simulate, recommend, and translate certified truth while controlling AI behavior.",
        "terminal_outcome": "A permissioned user or system receives an audience-appropriate, Oracle-grounded explanation or recommendation with a trust envelope and audit record.",
        "canonical_owner": "AI / Agent Fabric",
    },
    {
        "family_id": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
        "official_name": "Workflow, Collaboration, and Notifications",
        "short_name": "Workflow",
        "purpose": "Move work between users, teams, systems, and approval stages.",
        "terminal_outcome": "A governed task or decision moves from initiation through assignment, approval, action, acknowledgement, and audit completion.",
        "canonical_owner": "Command Bus",
    },
    {
        "family_id": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
        "official_name": "Business Operations and Client Delivery",
        "short_name": "Client Delivery",
        "purpose": "Run SHS client acquisition, production, delivery, maintenance, and lifecycle operations.",
        "terminal_outcome": "A client moves from qualified opportunity through approved build, QA, release, ClientOps, reporting, maintenance, renewal, and measurable ROI.",
        "canonical_owner": "ClientOps",
    },
    {
        "family_id": "F08_REPORTING_PUBLICATION_OUTPUTS",
        "official_name": "Reporting, Publication, and Decision Outputs",
        "short_name": "Reporting",
        "purpose": "Convert certified truth and approved operational data into role-appropriate reports, exports, briefs, and institutional records.",
        "terminal_outcome": "An authorized audience receives an accurate, traceable, appropriately disclosed report or decision output based on certified or approved truth.",
        "canonical_owner": "Reports Layer",
    },
    {
        "family_id": "F09_TRACKING_OBSERVABILITY_INTELLIGENCE",
        "official_name": "Tracking, Observability, and Operational Intelligence",
        "short_name": "Tracking",
        "purpose": "Track operational events, usage, system condition, workflow movement, risks, failures, revenue signals, and impact signals.",
        "terminal_outcome": "Leadership and operators can see what happened, what changed, what is blocked, what failed, and what requires action.",
        "canonical_owner": "Tracking and Intelligence Layer",
    },
    {
        "family_id": "F10_GOVERNANCE_SECURITY_RELEASE",
        "official_name": "Governance, Security, Compliance, and Release",
        "short_name": "Governance",
        "purpose": "Protect architecture, system behavior, data, releases, and institutional accountability.",
        "terminal_outcome": "Architecture and releases move forward only when ownership, security, testing, documentation, and anti-drift requirements are satisfied.",
        "canonical_owner": "Governance Layer",
    },
    {
        "family_id": "F11_COMMERCIALIZATION_ENTITLEMENTS",
        "official_name": "Commercialization and Entitlements",
        "short_name": "Commercialization",
        "purpose": "Turn SHS BOS into a deployable and governable commercial platform.",
        "terminal_outcome": "A client has a clearly defined product package, authorized capabilities, support level, commercial terms, renewal state, and measurable service value.",
        "canonical_owner": "SHS Sales Layer and ClientOps",
    },
    {
        "family_id": "F12_SHF_PROGRAM_IMPACT_INTEGRATION",
        "official_name": "SHF Program and Impact Integration",
        "short_name": "SHF Integration",
        "purpose": "Connect SHF program activities, evidence, outcomes, and approved impact into SHS BOS infrastructure without confusing organizational ownership.",
        "terminal_outcome": "SHF program activity becomes secure, verified, traceable, reportable impact while SHF retains mission/program ownership and SHS retains infrastructure ownership.",
        "canonical_owner": "SHS to SHF Data Flow Boundary",
    },
]


FAMILY_BY_LAYER = {
    "SHS-LAYER-001": "F01_FOUNDATION_IDENTITY_ACCESS",
    "SHS-LAYER-002": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
    "SHS-LAYER-003": "F12_SHF_PROGRAM_IMPACT_INTEGRATION",
    "SHS-LAYER-004": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-005": "F01_FOUNDATION_IDENTITY_ACCESS",
    "SHS-LAYER-006": "F02_INTEGRATION_SOURCE_INTAKE",
    "SHS-LAYER-007": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
    "SHS-LAYER-008": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
    "SHS-LAYER-009": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
    "SHS-LAYER-010": "F02_INTEGRATION_SOURCE_INTAKE",
    "SHS-LAYER-011": "F02_INTEGRATION_SOURCE_INTAKE",
    "SHS-LAYER-012": "F02_INTEGRATION_SOURCE_INTAKE",
    "SHS-LAYER-013": "F02_INTEGRATION_SOURCE_INTAKE",
    "SHS-LAYER-014": "F02_INTEGRATION_SOURCE_INTAKE",
    "SHS-LAYER-015": "F03_DATA_IDENTITY_AGGREGATION",
    "SHS-LAYER-016": "F03_DATA_IDENTITY_AGGREGATION",
    "SHS-LAYER-017": "F03_DATA_IDENTITY_AGGREGATION",
    "SHS-LAYER-018": "F04_VERIFICATION_RECONCILIATION_TRUTH",
    "SHS-LAYER-019": "F04_VERIFICATION_RECONCILIATION_TRUTH",
    "SHS-LAYER-020": "F02_INTEGRATION_SOURCE_INTAKE",
    "SHS-LAYER-021": "F04_VERIFICATION_RECONCILIATION_TRUTH",
    "SHS-LAYER-022": "F04_VERIFICATION_RECONCILIATION_TRUTH",
    "SHS-LAYER-023": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-024": "F05_INTELLIGENCE_AGENT_GOVERNANCE",
    "SHS-LAYER-025": "F05_INTELLIGENCE_AGENT_GOVERNANCE",
    "SHS-LAYER-026": "F05_INTELLIGENCE_AGENT_GOVERNANCE",
    "SHS-LAYER-027": "F05_INTELLIGENCE_AGENT_GOVERNANCE",
    "SHS-LAYER-028": "F08_REPORTING_PUBLICATION_OUTPUTS",
    "SHS-LAYER-029": "F08_REPORTING_PUBLICATION_OUTPUTS",
    "SHS-LAYER-030": "F03_DATA_IDENTITY_AGGREGATION",
    "SHS-LAYER-031": "F08_REPORTING_PUBLICATION_OUTPUTS",
    "SHS-LAYER-032": "F09_TRACKING_OBSERVABILITY_INTELLIGENCE",
    "SHS-LAYER-033": "F09_TRACKING_OBSERVABILITY_INTELLIGENCE",
    "SHS-LAYER-034": "F05_INTELLIGENCE_AGENT_GOVERNANCE",
    "SHS-LAYER-035": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-036": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-037": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-038": "F01_FOUNDATION_IDENTITY_ACCESS",
    "SHS-LAYER-039": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-040": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
    "SHS-LAYER-041": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-042": "F09_TRACKING_OBSERVABILITY_INTELLIGENCE",
    "SHS-LAYER-043": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
    "SHS-LAYER-044": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
    "SHS-LAYER-045": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
    "SHS-LAYER-046": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
    "SHS-LAYER-047": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
    "SHS-LAYER-048": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
    "SHS-LAYER-049": "F07_BUSINESS_OPERATIONS_CLIENT_DELIVERY",
    "SHS-LAYER-050": "F12_SHF_PROGRAM_IMPACT_INTEGRATION",
    "SHS-LAYER-051": "F12_SHF_PROGRAM_IMPACT_INTEGRATION",
    "SHS-LAYER-052": "F12_SHF_PROGRAM_IMPACT_INTEGRATION",
    "SHS-LAYER-053": "F05_INTELLIGENCE_AGENT_GOVERNANCE",
    "SHS-LAYER-054": "F11_COMMERCIALIZATION_ENTITLEMENTS",
    "SHS-LAYER-055": "F08_REPORTING_PUBLICATION_OUTPUTS",
    "SHS-LAYER-056": "F10_GOVERNANCE_SECURITY_RELEASE",
    "SHS-LAYER-057": "F11_COMMERCIALIZATION_ENTITLEMENTS",
    "SHS-LAYER-058": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
    "SHS-LAYER-059": "F11_COMMERCIALIZATION_ENTITLEMENTS",
    "SHS-LAYER-060": "F10_GOVERNANCE_SECURITY_RELEASE",
}


CLASSIFICATION_MAP = {
    "official_layer": "official_layer",
    "candidate_layer": "decision_required",
    "subsystem": "subsystem",
    "shared_platform_service": "shared_platform_service",
    "business_surface": "business_surface",
    "cross_cutting_control": "cross_cutting_control",
}

BATCH_00_DECISIONS = {
    "SHS-LAYER-007": {
        "final_classification": "official_layer",
        "final_name": "Command Bus",
        "final_family_id": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
        "v1_disposition": "mandatory_v1_support",
        "canonical_owner_layer_id": "SHS-LAYER-007",
        "authoritative_state_owner": "Command Bus",
        "alias": "Workflow command request authority",
        "decision_rationale": "Implemented command schemas, validation, approval preview, local queue/history persistence, safety policy, admin page, and validation scripts prove a durable execution-request authority. It remains preview/dry-run only for V1 and does not execute production actions.",
        "evidence_confidence": "high",
    },
    "SHS-LAYER-008": {
        "final_classification": "shared_platform_service",
        "final_name": "Job Scheduler",
        "final_family_id": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
        "v1_disposition": "mandatory_v1_support",
        "canonical_owner_layer_id": "SHS-LAYER-007",
        "authoritative_state_owner": "Command Bus",
        "consumer_layer_ids": ["SHS-LAYER-007", "SHS-LAYER-009", "SHS-LAYER-033", "SHS-LAYER-042"],
        "alias": "Local scheduler preview service",
        "decision_rationale": "Scheduler modules provide reusable local job preview, queue, retry, and history capability. They do not own a separate business decision, operational chain, or production execution authority, so the service is consumed under Command Bus and Workflow governance.",
        "evidence_confidence": "high",
    },
    "SHS-LAYER-012": {
        "final_classification": "subsystem",
        "final_name": "Direct Connect Direct-Source Proof Subsystem",
        "final_family_id": "F02_INTEGRATION_SOURCE_INTAKE",
        "v1_disposition": "mandatory_v1_support",
        "canonical_owner_layer_id": "SHS-LAYER-013",
        "authoritative_state_owner": "Source Registry Layer",
        "alias": "Direct Connect Layer",
        "decision_rationale": "Direct Connect is implemented as direct-source proof, connector metadata, local/mock records, and approval-boundary UI. It does not provide live sync, credentials, external connector execution, or independent truth authority in V1; Source Registry owns source identity and intake eligibility.",
        "evidence_confidence": "high",
    },
    "SHS-LAYER-040": {
        "final_classification": "business_surface",
        "final_name": "System Orchestrator Surface",
        "final_family_id": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
        "v1_disposition": "mandatory_v1_support",
        "canonical_owner_layer_id": "SHS-LAYER-007",
        "authoritative_state_owner": "Command Bus",
        "exposes_layer_ids": ["SHS-LAYER-007", "SHS-LAYER-025", "SHS-LAYER-028", "SHS-LAYER-041", "SHS-LAYER-042", "SHS-LAYER-047", "SHS-LAYER-048"],
        "alias": "System Orchestrator",
        "decision_rationale": "The orchestrator page and repositories coordinate local request and plan previews across existing owners. Safety copy explicitly blocks execution, production mutation, publishing, SHF data mutation, external delivery, warehouse writes, and auth mutation; it is a coordinating surface rather than a separate authority.",
        "evidence_confidence": "high",
    },
    "SHS-LAYER-057": {
        "final_classification": "merge_into_existing_layer",
        "final_name": "Commercialization, Billing, and Entitlements Responsibilities",
        "final_family_id": "F11_COMMERCIALIZATION_ENTITLEMENTS",
        "v1_disposition": "mandatory_v1_support",
        "canonical_owner_layer_id": "SHS-LAYER-043",
        "authoritative_state_owner": "SHS Sales Layer, Identity & Access, ClientOps, and Tracking and Intelligence",
        "merged_into_layer_ids": ["SHS-LAYER-043", "SHS-LAYER-001", "SHS-LAYER-048", "SHS-LAYER-042"],
        "alias": "Commercialization / Billing / Entitlements",
        "decision_rationale": "Repository evidence is registry/dead-end/documentation only. Entitlement access belongs to Identity and Access, sales/package terms belong to SHS Sales, renewal/client lifecycle belongs to ClientOps, and usage/revenue signals belong to Tracking and Intelligence. Keeping a separate mandatory V1 layer would create duplicate authority without runtime evidence.",
        "evidence_confidence": "medium",
    },
    "SHS-LAYER-058": {
        "final_classification": "subsystem",
        "final_name": "Support and Improvement Workflow Subsystem",
        "final_family_id": "F06_WORKFLOW_COLLABORATION_NOTIFICATIONS",
        "v1_disposition": "mandatory_v1_support",
        "canonical_owner_layer_id": "SHS-LAYER-048",
        "authoritative_state_owner": "ClientOps",
        "alias": "Support and Improvement Workflow",
        "decision_rationale": "Support and improvement has route and registry evidence but no independent durable authority. It is a ClientOps support/change-flow subsystem that uses Command Bus, QA, Release Readiness, and Tracking rather than owning a separate layer decision.",
        "evidence_confidence": "medium",
    },
    "SHS-LAYER-059": {
        "final_classification": "deferred_post_v1",
        "final_name": "Search and Discovery",
        "final_family_id": "F11_COMMERCIALIZATION_ENTITLEMENTS",
        "v1_disposition": "post_v1",
        "canonical_owner_layer_id": "SHS-LAYER-042",
        "authoritative_state_owner": "Tracking and Intelligence",
        "alias": "Search and Discovery",
        "decision_rationale": "Search appears as generic UI affordances and registry mention only. It has no dedicated durable state, contracts, operational chain, or downstream authority for mandatory V1, so it is deferred until post-V1 product/search design.",
        "evidence_confidence": "medium",
    },
}


CONTRACT_SPECS = [
    ("CONTRACT-V1-001", "Identity and Access to API Gateway", "SHS-LAYER-001", "SHS-LAYER-005"),
    ("CONTRACT-V1-002", "API Gateway and Direct Connect to Source Intake", "SHS-LAYER-005", "SHS-LAYER-013"),
    ("CONTRACT-V1-003", "Source Intake to Aggregation", "SHS-LAYER-013", "SHS-LAYER-015"),
    ("CONTRACT-V1-004", "Aggregation to Canonical Entity Resolution", "SHS-LAYER-015", "SHS-LAYER-016"),
    ("CONTRACT-V1-005", "Canonical Entity Resolution to Verification", "SHS-LAYER-016", "SHS-LAYER-018"),
    ("CONTRACT-V1-006", "Verification to Reconciliation", "SHS-LAYER-018", "SHS-LAYER-021"),
    ("CONTRACT-V1-007", "Reconciliation to Oracle", "SHS-LAYER-021", "SHS-LAYER-022"),
    ("CONTRACT-V1-008", "Aggregation and Verification to Oracle Truth Package", "SHS-LAYER-017", "SHS-LAYER-022"),
    ("CONTRACT-V1-009", "Oracle to Truth Package Repository", "SHS-LAYER-022", "SHS-LAYER-021"),
    ("CONTRACT-V1-010", "Oracle to Reporting", "SHS-LAYER-022", "SHS-LAYER-028"),
    ("CONTRACT-V1-011", "Oracle to Agent Fabric", "SHS-LAYER-022", "SHS-LAYER-025"),
    ("CONTRACT-V1-012", "Oracle to Operational Surfaces", "SHS-LAYER-022", "SHS-LAYER-041"),
    ("CONTRACT-V1-013", "Knowledge Layer to Agent Fabric", "SHS-LAYER-027", "SHS-LAYER-025"),
    ("CONTRACT-V1-014", "Alignment Layer to Agent Fabric Execution", "SHS-LAYER-024", "SHS-LAYER-025"),
    ("CONTRACT-V1-015", "Agent Fabric to Audit and Tracking", "SHS-LAYER-025", "SHS-LAYER-032"),
    ("CONTRACT-V1-016", "Workflow Engine to Notification Layer", "SHS-LAYER-007", "SHS-LAYER-009"),
    ("CONTRACT-V1-017", "User Action to Action Event", "SHS-LAYER-041", "SHS-LAYER-006"),
    ("CONTRACT-V1-018", "Action Event to Oracle Recompute", "SHS-LAYER-006", "SHS-LAYER-022"),
    ("CONTRACT-V1-019", "Sales to Production", "SHS-LAYER-043", "SHS-LAYER-044"),
    ("CONTRACT-V1-020", "Production to QA", "SHS-LAYER-044", "SHS-LAYER-047"),
    ("CONTRACT-V1-021", "QA to Release Readiness", "SHS-LAYER-047", "SHS-LAYER-029"),
    ("CONTRACT-V1-022", "Release to ClientOps", "SHS-LAYER-029", "SHS-LAYER-048"),
    ("CONTRACT-V1-023", "ClientOps to Reporting", "SHS-LAYER-048", "SHS-LAYER-028"),
    ("CONTRACT-V1-024", "ClientOps Renewal and Upgrade State to Tracking", "SHS-LAYER-048", "SHS-LAYER-042"),
    ("CONTRACT-V1-025", "Reporting to Tracking and Intelligence", "SHS-LAYER-028", "SHS-LAYER-042"),
    ("CONTRACT-V1-026", "Source Intake Direct-Source Proof to Aggregation Intake", "SHS-LAYER-013", "SHS-LAYER-015"),
    ("CONTRACT-V1-027", "Source Intake Failure to Error Queue and Retry", "SHS-LAYER-013", "SHS-LAYER-006"),
    ("CONTRACT-V1-028", "Tracking and Intelligence to Executive Command Center", "SHS-LAYER-042", "SHS-LAYER-041"),
    ("CONTRACT-V1-029", "Governance Checks to Release Readiness", "SHS-LAYER-035", "SHS-LAYER-029"),
    ("CONTRACT-V1-030", "SHF Program Data to SHS Intake", "SHS-LAYER-052", "SHS-LAYER-013"),
    ("CONTRACT-V1-031", "SHS Certified Outcome to SHF Impact Data Spine", "SHS-LAYER-022", "SHS-LAYER-003"),
    ("CONTRACT-V1-032", "SHF Approved Impact to Funder and Public Reporting", "SHS-LAYER-003", "SHS-LAYER-028"),
    ("CONTRACT-V1-033", "Identity Entitlements to API Gateway Access", "SHS-LAYER-001", "SHS-LAYER-005"),
    ("CONTRACT-V1-034", "Commercial Terms to Renewal and ClientOps", "SHS-LAYER-043", "SHS-LAYER-048"),
    ("CONTRACT-V1-035", "ClientOps Support Issue to QA Change Request", "SHS-LAYER-048", "SHS-LAYER-047"),
]


RESPONSIBILITY_OWNERS = [
    ("identity", "SHS-LAYER-001"),
    ("authentication", "SHS-LAYER-001"),
    ("authorization", "SHS-LAYER-001"),
    ("tenant scope", "SHS-LAYER-001"),
    ("client scope", "SHS-LAYER-001"),
    ("connector definitions", "SHS-LAYER-013"),
    ("integration credentials", "SHS-LAYER-001"),
    ("source claims", "SHS-LAYER-013"),
    ("canonical entity identity", "SHS-LAYER-016"),
    ("relationship identity", "SHS-LAYER-016"),
    ("evidence sufficiency", "SHS-LAYER-018"),
    ("source trust", "SHS-LAYER-021"),
    ("contradiction state", "SHS-LAYER-021"),
    ("source precedence", "SHS-LAYER-021"),
    ("final truth status", "SHS-LAYER-022"),
    ("confidence", "SHS-LAYER-022"),
    ("readiness", "SHS-LAYER-029"),
    ("publication eligibility", "SHS-LAYER-031"),
    ("audience rendering", "SHS-LAYER-028"),
    ("AI capability control", "SHS-LAYER-024"),
    ("workflow state", "SHS-LAYER-007"),
    ("task assignment", "SHS-LAYER-007"),
    ("notifications", "SHS-LAYER-009"),
    ("operational event history", "SHS-LAYER-042"),
    ("system health", "SHS-LAYER-033"),
    ("report assembly", "SHS-LAYER-028"),
    ("report publication", "SHS-LAYER-031"),
    ("client delivery state", "SHS-LAYER-048"),
    ("QA state", "SHS-LAYER-047"),
    ("release state", "SHS-LAYER-029"),
    ("ClientOps state", "SHS-LAYER-048"),
    ("support state", "SHS-LAYER-048"),
    ("entitlement state", "SHS-LAYER-001"),
    ("billing state", "SHS-LAYER-043"),
    ("renewal state", "SHS-LAYER-048"),
    ("impact evidence", "SHS-LAYER-003"),
    ("architecture registry", "SHS-LAYER-039"),
    ("architecture integrity", "SHS-LAYER-021"),
    ("V1 certification visibility", "SHS-LAYER-041"),
]


CHAINS = [
    ("CHAIN-A-UNIFIED-TRUTH", "Unified Truth", ["SHS-LAYER-002", "SHS-LAYER-005", "SHS-LAYER-010", "SHS-LAYER-013", "SHS-LAYER-014", "SHS-LAYER-015", "SHS-LAYER-016", "SHS-LAYER-017", "SHS-LAYER-018", "SHS-LAYER-019", "SHS-LAYER-030", "SHS-LAYER-021", "SHS-LAYER-022", "SHS-LAYER-028", "SHS-LAYER-006", "SHS-LAYER-042"]),
    ("CHAIN-B-CLIENT-DELIVERY", "Client Delivery", ["SHS-LAYER-043", "SHS-LAYER-044", "SHS-LAYER-046", "SHS-LAYER-047", "SHS-LAYER-029", "SHS-LAYER-048", "SHS-LAYER-028", "SHS-LAYER-042"]),
    ("CHAIN-C-DIRECT-CONNECT", "Direct Connect", ["SHS-LAYER-013", "SHS-LAYER-011", "SHS-LAYER-015", "SHS-LAYER-021", "SHS-LAYER-033", "SHS-LAYER-009", "SHS-LAYER-032"]),
    ("CHAIN-D-AGENT-INTELLIGENCE", "Agent Intelligence", ["SHS-LAYER-001", "SHS-LAYER-024", "SHS-LAYER-022", "SHS-LAYER-027", "SHS-LAYER-025", "SHS-LAYER-032", "SHS-LAYER-042"]),
    ("CHAIN-E-REPORTING", "Reporting", ["SHS-LAYER-022", "SHS-LAYER-029", "SHS-LAYER-031", "SHS-LAYER-028", "SHS-LAYER-042", "SHS-LAYER-006"]),
    ("CHAIN-F-GOVERNANCE-RELEASE", "Governance and Release", ["SHS-LAYER-004", "SHS-LAYER-023", "SHS-LAYER-035", "SHS-LAYER-037", "SHS-LAYER-039", "SHS-LAYER-021", "SHS-LAYER-036", "SHS-LAYER-047", "SHS-LAYER-029", "SHS-LAYER-033", "SHS-LAYER-056", "SHS-LAYER-060"]),
    ("CHAIN-G-SUPPORT-IMPROVEMENT", "Support and Improvement", ["SHS-LAYER-048", "SHS-LAYER-007", "SHS-LAYER-044", "SHS-LAYER-047", "SHS-LAYER-029", "SHS-LAYER-046"]),
    ("CHAIN-H-TRACKING-INTELLIGENCE", "Tracking and Intelligence", ["SHS-LAYER-043", "SHS-LAYER-044", "SHS-LAYER-047", "SHS-LAYER-029", "SHS-LAYER-048", "SHS-LAYER-028", "SHS-LAYER-042", "SHS-LAYER-041"]),
    ("CHAIN-I-COMMERCIALIZATION", "Commercialization", ["SHS-LAYER-043", "SHS-LAYER-001", "SHS-LAYER-048", "SHS-LAYER-042", "SHS-LAYER-041"]),
    ("CHAIN-J-SHF-IMPACT-INTEGRATION", "SHF Impact Integration", ["SHS-LAYER-052", "SHS-LAYER-003", "SHS-LAYER-013", "SHS-LAYER-018", "SHS-LAYER-022", "SHS-LAYER-050", "SHS-LAYER-028", "SHS-LAYER-051"]),
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def write(path: Path, text: str) -> None:
    path.write_text(text.strip() + "\n", encoding="utf-8")


def listify(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def md_table(headers: list[str], rows: list[list[object]]) -> str:
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(str(cell).replace("\n", " ") for cell in row) + " |")
    return "\n".join(lines)


def status_bucket(status: str | None) -> str:
    value = str(status or "").lower()
    if "blocked" in value or "missing" in value:
        return "blocked"
    if "mock" in value or "partial" in value:
        return "partial"
    if "closed" in value:
        return "closed"
    return "review"


def build() -> dict:
    ARCH_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()
    inventory = load_json(AUDIT_DIR / "SHS_BOS_V1_MASTER_LAYER_INVENTORY.json")["layers"]
    rec = load_json(AUDIT_DIR / "SHS_BOS_V1_RECOMMENDED_OFFICIAL_LAYER_REGISTRY.json")["official_registry"]
    evidence_matrix = load_json(AUDIT_DIR / "SHS_BOS_V1_LAYER_EVIDENCE_MATRIX.json")["layers"]
    connections = load_json(AUDIT_DIR / "SHS_BOS_V1_LAYER_CONNECTION_MATRIX.json")["connections"]
    audit_chains = load_json(AUDIT_DIR / "SHS_BOS_V1_OPERATIONAL_CHAIN_AUDIT.json")["chains"]
    dead_ends = load_json(AUDIT_DIR / "SHS_BOS_V1_ORPHAN_AND_DEAD_END_REGISTRY.json")["orphans"]
    layer_by_id = {item["layer_id"]: item for item in inventory}
    evidence_by_id = {item["layer_id"]: item for item in evidence_matrix}
    connection_by_pair = {(item["upstream_layer_id"], item["downstream_layer_id"]): item for item in connections}
    dead_by_layer = {}
    for item in dead_ends:
        dead_by_layer.setdefault(item.get("layer_id"), []).append(item)

    family_ids = {item["family_id"] for item in FAMILIES}
    layer_records = []
    contract_ids_by_layer = {item["layer_id"]: {"input": [], "output": []} for item in inventory}
    chain_ids_by_layer = {item["layer_id"]: [] for item in inventory}
    upstream_by_layer = {item["layer_id"]: set() for item in inventory}
    downstream_by_layer = {item["layer_id"]: set() for item in inventory}
    for connection in connections:
        upstream_by_layer.setdefault(connection["downstream_layer_id"], set()).add(connection["upstream_layer_id"])
        downstream_by_layer.setdefault(connection["upstream_layer_id"], set()).add(connection["downstream_layer_id"])

    contracts = []
    for cid, name, upstream, downstream in CONTRACT_SPECS:
        source_connection = connection_by_pair.get((upstream, downstream))
        status = "implemented_or_partially_wired" if source_connection and source_connection.get("implementation_exists") else "specified_missing_runtime"
        if source_connection and source_connection.get("connection_status") == "fully_connected":
            status = "implemented"
        if upstream not in layer_by_id or downstream not in layer_by_id:
            status = "invalid_reference"
        remaining = []
        if not source_connection:
            remaining.append("No exact connection-matrix row; specification created as closure work.")
        elif source_connection.get("blocks_v1"):
            remaining.extend(listify(source_connection.get("required_v1_work")) or listify(source_connection.get("known_gaps")))
        contract = {
            "contract_id": cid,
            "official_name": name,
            "version": "v1",
            "upstream_layer_id": upstream,
            "downstream_layer_id": downstream,
            "purpose": source_connection.get("connection_purpose") if source_connection else f"Governed transition from {layer_by_id.get(upstream, {}).get('official_name')} to {layer_by_id.get(downstream, {}).get('official_name')}.",
            "transport": "internal_api_or_event_contract",
            "request_or_event_schema": "governed_payload_v1",
            "response_or_output_schema": "governed_result_v1",
            "required_fields": ["trace_id", "request_id", "actor_id", "timestamp", "contract_version"],
            "optional_fields": ["organization_id", "client_id", "program_id", "truth_package_id", "publication_mode"],
            "identifier_fields": ["entity_id", "entity_type", "source_id", "source_record_id"],
            "trace_fields": ["trace_id", "request_id", "event_id", "parent_event_id", "workflow_id"],
            "provenance_fields": ["source_id", "source_record_id", "evidence_id", "repository", "file_path"],
            "security_requirements": ["authenticated_actor", "authorized_scope", "no_public_bypass"],
            "permission_requirements": ["layer_specific_permission_or_shs_admin"],
            "validation_rules": ["required_ids_present", "contract_version_supported", "source_provenance_preserved"],
            "failure_codes": ["missing_required_field", "permission_denied", "invalid_contract_version", "blocked_by_policy", "source_not_ready"],
            "retry_rules": "Retry only idempotent reads/previews; mutation retries require idempotency key and audit record.",
            "idempotency_rules": "Use trace_id plus source_record_id or request_id for repeat-safe processing.",
            "persistence_expectations": "Producer preserves source trace; consumer persists only if it owns authoritative state.",
            "audit_requirements": ["trace_id", "actor_id", "decision_or_status", "blockers", "evidence"],
            "freshness_or_staleness_rules": "Consumers must surface stale, mock, missing, or sample input rather than upgrading readiness.",
            "consumer_behavior": "Reject or mark blocked when required provenance, permission, or trace fields are absent.",
            "producer_behavior": "Emit governed payload with evidence, traceability, and explicit readiness/limitation state.",
            "tests": ["schema_validation", "permission_boundary", "trace_propagation", "failure_path"],
            "status": status,
            "runtime_wired": bool(source_connection and source_connection.get("runtime_wired")),
            "trace_propagated": bool(source_connection and source_connection.get("trace_id_propagated")),
            "security_enforced": bool(source_connection and source_connection.get("security_enforced")),
            "audit_supported": bool(source_connection and source_connection.get("audit_supported")),
            "tests_present": bool(source_connection and source_connection.get("tests_present")),
            "v1_blocker": bool(source_connection and source_connection.get("blocks_v1")) or status != "implemented",
            "evidence": source_connection.get("evidence", []) if source_connection else [],
            "remaining_v1_work": remaining,
        }
        contracts.append(contract)
        if upstream in contract_ids_by_layer:
            contract_ids_by_layer[upstream]["output"].append(cid)
        if downstream in contract_ids_by_layer:
            contract_ids_by_layer[downstream]["input"].append(cid)

    operational_chains = []
    contract_lookup = {(c["upstream_layer_id"], c["downstream_layer_id"]): c["contract_id"] for c in contracts}
    for chain_id, name, layer_ids in CHAINS:
        transition_contracts = []
        broken = []
        for upstream, downstream in zip(layer_ids, layer_ids[1:]):
            contract_id = contract_lookup.get((upstream, downstream))
            if contract_id:
                transition_contracts.append(contract_id)
            else:
                broken.append(f"{upstream}->{downstream}: missing explicit V1 contract")
        blockers = [d["orphan_id"] for lid in layer_ids for d in dead_by_layer.get(lid, []) if d.get("blocks_v1")]
        families = sorted({FAMILY_BY_LAYER[lid] for lid in layer_ids if lid in FAMILY_BY_LAYER})
        status = "blocked" if blockers or broken else "closed"
        chain = {
            "chain_id": chain_id,
            "official_name": name,
            "owner": "Executive Command Center visibility; source layers own execution",
            "purpose": f"Formal operating chain for {name}.",
            "start_condition": "Governed input, action, or architecture event enters the first owning layer.",
            "terminal_outcome": next(item["terminal_outcome"] for item in FAMILIES if item["family_id"] in families[-1:]) if families else "Documented terminal outcome required.",
            "mandatory_steps": layer_ids,
            "optional_steps": [],
            "layer_ownership_per_step": [{"layer_id": lid, "owner": layer_by_id.get(lid, {}).get("system_owner", "decision_required")} for lid in layer_ids],
            "contract_ids": transition_contracts,
            "persistence_per_step": [{"layer_id": lid, "persistence": layer_by_id.get(lid, {}).get("persistence_type", "NOT_FOUND")} for lid in layer_ids],
            "trace_propagation": "trace_id, request_id, entity_id, actor_id, timestamp, contract_version where applicable",
            "security_boundary": "Identity, permission, privacy, ownership, and publication controls stay with source-specific authorities.",
            "failure_path": "Block, quarantine, owner-review, retry, or closure-plan item based on contract failure code.",
            "retry_or_recovery_path": "Retry only when idempotent and authorized; otherwise route to owner review.",
            "tracking_event": "operational_chain_status_changed",
            "test_requirements": ["schema contract test", "trace propagation test", "blocked path test"],
            "current_status": status,
            "family_ids": families,
            "broken_transitions": broken,
            "contracts_missing": len(broken),
            "persistence_breaks": [lid for lid in layer_ids if str(layer_by_id.get(lid, {}).get("persistence_type", "")).lower() in {"localstorage", "browser_localstorage", "in_memory"}],
            "feedback_breaks": [] if chain_id in {"CHAIN-A-UNIFIED-TRUTH", "CHAIN-H-TRACKING-INTELLIGENCE"} else ["feedback loop not fully proven end to end"],
            "v1_blockers": blockers + broken,
            "acceptance_criteria": ["all mandatory steps have valid contracts", "no V1 blockers remain", "terminal outcome is produced and tracked"],
        }
        operational_chains.append(chain)
        for lid in layer_ids:
            chain_ids_by_layer.setdefault(lid, []).append(chain_id)

    for item in inventory:
        layer_id = item["layer_id"]
        decision = BATCH_00_DECISIONS.get(layer_id, {})
        classification = CLASSIFICATION_MAP.get(item.get("architectural_type"), "decision_required")
        classification = decision.get("final_classification", classification)
        downstream = sorted(downstream_by_layer.get(layer_id, set()) or set(item.get("downstream_consumers") or []))
        upstream = sorted(upstream_by_layer.get(layer_id, set()) or set(item.get("upstream_dependencies") or []))
        owner_id = decision.get("canonical_owner_layer_id")
        if not owner_id:
            owner_id = (
                "SHS-LAYER-025" if classification == "subsystem"
                else ("SHS-LAYER-035" if classification in {"business_surface", "cross_cutting_control"} else ("SHS-LAYER-001" if classification == "shared_platform_service" else None))
            )
        exposes_layer_ids = decision.get("exposes_layer_ids")
        if exposes_layer_ids is None:
            exposes_layer_ids = ["SHS-LAYER-021", "SHS-LAYER-022", "SHS-LAYER-028", "SHS-LAYER-033", "SHS-LAYER-039", "SHS-LAYER-042"] if classification == "business_surface" else []
        layer_records.append({
            "layer_id": layer_id,
            "official_name": decision.get("final_name", item["official_name"]),
            "alternate_names": sorted(set(item.get("alternate_names", []) + ([decision["alias"]] if decision.get("alias") else []))),
            "primary_family_id": decision.get("final_family_id", FAMILY_BY_LAYER[layer_id]),
            "secondary_family_ids": [],
            "classification": classification,
            "owning_official_layer_id": owner_id,
            "exposes_layer_ids": exposes_layer_ids,
            "consumer_layer_ids": decision.get("consumer_layer_ids", ["SHS-LAYER-001", "SHS-LAYER-005", "SHS-LAYER-041"] if classification == "shared_platform_service" else []),
            "merged_into_layer_ids": decision.get("merged_into_layer_ids", []),
            "governed_family_ids": sorted(FAMILY_BY_LAYER.values()) if classification == "cross_cutting_control" else [],
            "v1_requirement": decision.get("v1_disposition", item.get("v1_requirement")),
            "v1_priority": item.get("v1_priority"),
            "purpose": item.get("purpose") or item.get("business_value") or "Purpose requires owner review.",
            "exclusive_responsibility": decision.get("decision_rationale") or item.get("purpose") or item.get("terminal_business_outcome") or "Exclusive responsibility requires owner review.",
            "responsibilities_not_owned": listify(item.get("notes")) + listify(item.get("duplication_or_overlap")) + (["Package C proposes this classification from Package B evidence; owner review remains downstream."] if decision and classification != "official_layer" else []),
            "terminal_outcome": item.get("terminal_business_outcome") or "Terminal outcome requires owner review.",
            "system_owner": item.get("system_owner") or item.get("authoritative_state_owner") or item.get("repository_owner"),
            "repository_owner": item.get("repository_owner"),
            "authoritative_state": decision.get("authoritative_state_owner") or item.get("authoritative_state_owner") or item.get("persistence_locations") or "owner_review_closed",
            "authoritative_state_location": item.get("persistence_locations") or [],
            "input_contract_ids": contract_ids_by_layer.get(layer_id, {}).get("input", []),
            "output_contract_ids": contract_ids_by_layer.get(layer_id, {}).get("output", []),
            "upstream_layer_ids": upstream,
            "downstream_layer_ids": downstream,
            "shared_service_ids": ["SHS-LAYER-038"] if layer_id != "SHS-LAYER-038" else [],
            "business_surface_ids": ["SHS-LAYER-041"] if layer_id != "SHS-LAYER-041" and item.get("v1_requirement") != "post_v1" else [],
            "cross_cutting_control_ids": ["SHS-LAYER-021", "SHS-LAYER-035", "SHS-LAYER-039"],
            "operational_chain_ids": chain_ids_by_layer.get(layer_id, []),
            "security_owner": "SHS-LAYER-036" if layer_id != "SHS-LAYER-036" else layer_id,
            "audit_owner": "SHS-LAYER-032" if layer_id != "SHS-LAYER-032" else layer_id,
            "persistence_type": item.get("persistence_type") or "NOT_FOUND",
            "runtime_entry_points": item.get("entry_points", []),
            "routes": item.get("routes", []),
            "events_produced": item.get("events_produced", []),
            "events_consumed": item.get("events_consumed", []),
            "failure_path": item.get("known_risks") or "owner-review failure path required",
            "retry_or_recovery_path": "documented retry/recovery required" if status_bucket(item.get("closure_status")) != "closed" else "closed with V1 limitations",
            "monitoring_path": item.get("tracking_dependencies") or item.get("validation_scripts") or [],
            "tests": item.get("tests", []),
            "acceptance_criteria": item.get("v1_acceptance_criteria", []),
            "completion_status": item.get("overall_status"),
            "closure_status": item.get("closure_status"),
            "known_gaps": item.get("known_gaps", []),
            "blocking_connections": item.get("blocking_connections", []),
            "dead_end_ids": [d["orphan_id"] for d in dead_by_layer.get(layer_id, [])],
            "duplicate_or_overlap_ids": item.get("duplication_or_overlap", []),
            "recommended_v1_work": item.get("remaining_v1_work", []),
            "batch_00_decision": decision or None,
            "migration_notes": decision.get("decision_rationale") if decision else "",
            "evidence_confidence": decision.get("evidence_confidence", ""),
            "evidence": evidence_by_id.get(layer_id, {}).get("evidence", item.get("evidence", [])),
        })

    layers_by_family = {family["family_id"]: [] for family in FAMILIES}
    for record in layer_records:
        layers_by_family[record["primary_family_id"]].append(record)
    layer_record_by_id = {record["layer_id"]: record for record in layer_records}

    family_registry = []
    for family in FAMILIES:
        records = layers_by_family[family["family_id"]]
        completions = [int(record.get("completion_status") != "not_found") and int(layer_by_id[record["layer_id"]].get("estimated_completion_percent") or 0) for record in records]
        broken_contracts = [contract for contract in contracts if (contract["upstream_layer_id"] in {r["layer_id"] for r in records} or contract["downstream_layer_id"] in {r["layer_id"] for r in records}) and contract["v1_blocker"]]
        family_registry.append({
            **family,
            "layer_ids": [r["layer_id"] for r in records if r["classification"] == "official_layer"],
            "subsystem_ids": [r["layer_id"] for r in records if r["classification"] == "subsystem"],
            "shared_service_ids": [r["layer_id"] for r in records if r["classification"] == "shared_platform_service"],
            "business_surface_ids": [r["layer_id"] for r in records if r["classification"] == "business_surface"],
            "cross_cutting_control_ids": [r["layer_id"] for r in records if r["classification"] == "cross_cutting_control"],
            "decision_required_ids": [r["layer_id"] for r in records if r["classification"] == "decision_required"],
            "upstream_family_ids": [],
            "downstream_family_ids": [],
            "operational_chain_ids": sorted({cid for r in records for cid in r["operational_chain_ids"]}),
            "mandatory_contract_ids": sorted({contract["contract_id"] for contract in contracts if contract["upstream_layer_id"] in {r["layer_id"] for r in records} or contract["downstream_layer_id"] in {r["layer_id"] for r in records}}),
            "v1_requirement": "mandatory_or_supporting",
            "completion_percent": round(sum(completions) / len(completions), 1) if completions else 0,
            "closure_status": "blocked" if any(r["dead_end_ids"] for r in records) or broken_contracts else "owner_review",
            "official_layer_count": len([r for r in records if r["classification"] == "official_layer"]),
            "subsystem_count": len([r for r in records if r["classification"] == "subsystem"]),
            "v1_mandatory_count": len([r for r in records if str(r["v1_requirement"]).startswith("mandatory")]),
            "closed_layer_count": len([r for r in records if r["closure_status"] == "closed_with_v1_limitations"]),
            "partially_connected_count": len([r for r in records if "partial" in str(r["closure_status"])]),
            "dead_end_count": sum(len(r["dead_end_ids"]) for r in records),
            "broken_contract_count": len(broken_contracts),
            "blocking_chain_count": len([chain for chain in operational_chains if chain["current_status"] == "blocked" and family["family_id"] in chain["family_ids"]]),
            "certification_eligible": False if broken_contracts or any(r["dead_end_ids"] for r in records) else True,
            "certification_block_reasons": [f"{len(broken_contracts)} broken contracts"] if broken_contracts else [],
            "evidence": [{"source": "SHS_BOS_V1_MASTER_LAYER_INVENTORY.json"}],
        })

    ownership = []
    for responsibility, owner in RESPONSIBILITY_OWNERS:
        owner_record = layer_record_by_id.get(owner, {})
        frontend_only = owner in {"SHS-LAYER-041"}
        browser_only = any("localStorage" in str(value) for value in owner_record.get("authoritative_state_location", []))
        owner_classification = owner_record.get("classification", "owner_review_closed")
        ownership.append({
            "responsibility_id": responsibility.replace(" ", "_"),
            "responsibility": responsibility,
            "canonical_owner_layer_id": owner,
            "canonical_owner_name": owner_record.get("official_name", "owner_review_closed"),
            "owner_classification": owner_classification,
            "state_owner_layer_id": owner,
            "state_name": responsibility,
            "conflict_status": "frontend_visibility_only" if frontend_only else "resolved",
            "frontend_only_authority": frontend_only,
            "browser_only_authority": browser_only,
            "localStorage_only_authority": browser_only,
            "documentation_only_authority": owner_record.get("closure_status") == "documentation_only",
            "recommended_canonical_owner": owner,
            "notes": "Executive Command Center may display but not own underlying authority." if frontend_only else "",
        })

    closure_batches = []
    all_chain_blockers = sorted({blocker for chain in operational_chains for blocker in chain["v1_blockers"]} | {item["orphan_id"] for item in dead_ends})
    for index, title in enumerate([
        "Architecture normalization",
        "Identity, persistence, and contract foundations",
        "Unified Truth Pipeline closure",
        "Agent and knowledge grounding",
        "Client delivery closure",
        "Direct Connect closure",
        "Reporting and publication closure",
        "Tracking and observability closure",
        "SHF impact integration closure",
        "Commercialization closure",
        "Governance and V1 certification",
    ]):
        related = operational_chains[max(0, min(index - 1, len(operational_chains) - 1))]
        closure_batches.append({
            "batch_id": f"BATCH-{index:02d}",
            "priority": "P0" if index in {0, 1, 2, 8, 9, 10} else "P1",
            "title": title,
            "chain_ids": [related["chain_id"]] if index else [chain["chain_id"] for chain in operational_chains],
            "family_ids": related["family_ids"] if index else [family["family_id"] for family in family_registry],
            "layer_ids": related["mandatory_steps"] if index else [r["layer_id"] for r in layer_records],
            "contract_ids": related["contract_ids"],
            "blocker_ids": all_chain_blockers if index == 0 else related["v1_blockers"],
            "exact_work": "Close missing contracts, state ownership, trace propagation, persistence, tests, and runtime wiring for this batch.",
            "prerequisites": ["Batch 0 architecture decisions"] if index else [],
            "acceptance_criteria": related["acceptance_criteria"],
            "terminal_outcome": related["terminal_outcome"] if index else "One authoritative architecture map with no unresolved duplicate ownership for mandatory V1 responsibilities.",
            "parallelization_eligible": index not in {0, 1, 2, 10},
        })

    consolidation = []
    for record in layer_records:
        if record["classification"] in {"decision_required", "subsystem", "business_surface", "shared_platform_service", "cross_cutting_control"} or record["duplicate_or_overlap_ids"]:
            consolidation.append({
                "decision_id": f"CONSOLIDATION-{len(consolidation)+1:03d}",
                "affected_ids": [record["layer_id"]],
                "current_names": [record["official_name"]],
                "current_responsibilities": record["exclusive_responsibility"],
                "overlap": record["duplicate_or_overlap_ids"],
                "canonical_owner": record["system_owner"],
                "migration_risk": "medium" if record["classification"] == "decision_required" else "low",
                "route_impact": record["routes"],
                "data_impact": record["authoritative_state_location"],
                "test_impact": record["tests"],
                "documentation_impact": "Document canonical classification and owner.",
                "v1_disposition": "decision_required" if record["classification"] == "decision_required" else "retain_with_classification",
                "code_changes_needed_now": False,
            })

    package = {
        "metadata": {
            "generated_at": generated_at,
            "source_audit_dir": str(AUDIT_DIR),
            "official_layer_count": len([r for r in layer_records if r["classification"] == "official_layer"]),
            "family_count": len(family_registry),
            "subsystem_count": len([r for r in layer_records if r["classification"] == "subsystem"]),
            "shared_service_count": len([r for r in layer_records if r["classification"] == "shared_platform_service"]),
            "business_surface_count": len([r for r in layer_records if r["classification"] == "business_surface"]),
            "cross_cutting_control_count": len([r for r in layer_records if r["classification"] == "cross_cutting_control"]),
            "decision_required_count": len([r for r in layer_records if r["classification"] == "decision_required"]),
            "contract_count": len(contracts),
            "chain_count": len(operational_chains),
        },
        "families": family_registry,
        "layers": layer_records,
        "ownership": ownership,
        "contracts": contracts,
        "chains": operational_chains,
        "closure_batches": closure_batches,
        "consolidation_decisions": consolidation,
    }
    return package


def write_artifacts(package: dict) -> None:
    meta = package["metadata"]
    dump_json(ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.json", {"metadata": meta, "families": package["families"], "layers": package["layers"]})
    dump_json(ARCH_DIR / "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.json", {"metadata": meta, "ownership": package["ownership"]})
    dump_json(ARCH_DIR / "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.json", {"metadata": meta, "contracts": package["contracts"], "traceability_standard": TRACEABILITY_STANDARD})
    dump_json(ARCH_DIR / "SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.json", {"metadata": meta, "chains": package["chains"]})
    dump_json(ARCH_DIR / "SHS_BOS_LAYER_INTEGRATION_CLOSURE_PLAN_V1.json", {"metadata": meta, "closure_batches": package["closure_batches"]})
    dump_json(ARCH_DIR / "SHS_BOS_LAYER_CONSOLIDATION_DECISIONS_V1.json", {"metadata": meta, "consolidation_decisions": package["consolidation_decisions"]})

    write_family_md(package)
    write_ownership_md(package)
    write_contract_md(package)
    write_chain_md(package)
    write_closure_md(package)
    write_consolidation_md(package)
    write_architecture_md(package)
    write_qa_md(package)
    write_summary_md(package)


TRACEABILITY_STANDARD = {
    "standard_fields": ["trace_id", "request_id", "event_id", "entity_id", "entity_type", "organization_id", "client_id", "program_id", "source_id", "source_record_id", "actor_id", "actor_type", "timestamp", "contract_version", "workflow_id", "parent_event_id", "publication_mode", "truth_package_id"],
    "required_for_all_contracts": ["trace_id", "request_id", "actor_id", "timestamp", "contract_version"],
    "required_when_applicable": {
        "client work": ["client_id"],
        "SHF program work": ["program_id"],
        "published outputs": ["publication_mode"],
        "truth consumers": ["truth_package_id"],
        "source intake": ["source_id", "source_record_id"],
        "workflow": ["workflow_id", "parent_event_id"],
    },
}


def write_family_md(package: dict) -> None:
    rows = [[f["family_id"], f["official_name"], f["official_layer_count"], f["v1_mandatory_count"], f["completion_percent"], f["broken_contract_count"], f["dead_end_count"], f["certification_eligible"]] for f in package["families"]]
    text = "# SHS BOS Official Layer Family Registry V1\n\n" + md_table(["Family", "Name", "Official Layers", "Mandatory", "Completion", "Broken Contracts", "Dead Ends", "Eligible"], rows)
    text += "\n\n## Layer Registry\n\n"
    text += md_table(["Layer", "Name", "Family", "Classification", "V1", "Completion", "Closure"], [[r["layer_id"], r["official_name"], r["primary_family_id"], r["classification"], r["v1_requirement"], r["completion_status"], r["closure_status"]] for r in package["layers"]])
    write(ARCH_DIR / "SHS_BOS_OFFICIAL_LAYER_FAMILY_REGISTRY_V1.md", text)


def write_ownership_md(package: dict) -> None:
    text = "# SHS BOS Layer Ownership Matrix V1\n\n" + md_table(["Responsibility", "Owner", "Conflict", "Frontend-only", "Browser-only"], [[r["responsibility"], r["canonical_owner_name"], r["conflict_status"], r["frontend_only_authority"], r["browser_only_authority"]] for r in package["ownership"]])
    write(ARCH_DIR / "SHS_BOS_LAYER_OWNERSHIP_MATRIX_V1.md", text)


def write_contract_md(package: dict) -> None:
    text = "# SHS BOS Layer Contract Registry V1\n\n" + md_table(["Contract", "Name", "Upstream", "Downstream", "Status", "V1 Blocker"], [[c["contract_id"], c["official_name"], c["upstream_layer_id"], c["downstream_layer_id"], c["status"], c["v1_blocker"]] for c in package["contracts"]])
    text += "\n\n## Traceability Standard\n\nRequired for all contracts: " + ", ".join(TRACEABILITY_STANDARD["required_for_all_contracts"]) + "."
    write(ARCH_DIR / "SHS_BOS_LAYER_CONTRACT_REGISTRY_V1.md", text)


def write_chain_md(package: dict) -> None:
    text = "# SHS BOS Operational Chain Registry V1\n\n" + md_table(["Chain", "Name", "Status", "Contracts Missing", "Blockers"], [[c["chain_id"], c["official_name"], c["current_status"], c["contracts_missing"], len(c["v1_blockers"])] for c in package["chains"]])
    for chain in package["chains"]:
        text += f"\n\n## {chain['official_name']}\n\nTerminal outcome: {chain['terminal_outcome']}\n\nSteps: " + " -> ".join(chain["mandatory_steps"]) + "\n"
    write(ARCH_DIR / "SHS_BOS_OPERATIONAL_CHAIN_REGISTRY_V1.md", text)


def write_closure_md(package: dict) -> None:
    text = "# SHS BOS Layer Integration Closure Plan V1\n\n" + md_table(["Batch", "Priority", "Title", "Chains", "Parallel"], [[b["batch_id"], b["priority"], b["title"], ", ".join(b["chain_ids"]), b["parallelization_eligible"]] for b in package["closure_batches"]])
    write(ARCH_DIR / "SHS_BOS_LAYER_INTEGRATION_CLOSURE_PLAN_V1.md", text)


def write_consolidation_md(package: dict) -> None:
    text = "# SHS BOS Layer Consolidation Decisions V1\n\n" + md_table(["Decision", "Affected", "Disposition", "Owner", "Code Now"], [[d["decision_id"], ", ".join(d["affected_ids"]), d["v1_disposition"], d["canonical_owner"], d["code_changes_needed_now"]] for d in package["consolidation_decisions"]])
    write(ARCH_DIR / "SHS_BOS_LAYER_CONSOLIDATION_DECISIONS_V1.md", text)


def write_architecture_md(package: dict) -> None:
    family_edges = "\n".join([f'  {package["families"][i]["family_id"]}["{package["families"][i]["short_name"]}"] --> {package["families"][i+1]["family_id"]}["{package["families"][i+1]["short_name"]}"]' for i in range(len(package["families"]) - 1)])
    text = dedent(f"""
    # SHS BOS Layer Family Architecture V1

    This document locks the layer-family architecture around the existing Master Layer Registry and the SHS BOS V1 audit evidence. It does not create a new registry authority, truth engine, or command surface.

    ## Operating Law

    Every official SHS BOS layer must receive a valid governed input, perform one clearly owned responsibility, persist or transmit a governed output, serve a real downstream consumer, and contribute to a complete operational, decision, reporting, client, governance, revenue, or impact outcome.

    ## Family Overview

    ```mermaid
    flowchart LR
    {family_edges}
    ```

    ## Unified Truth Pipeline

    ```mermaid
    flowchart LR
      Source["Source Registry"] --> Aggregation["Aggregation"]
      Aggregation --> Normalization["Canonical Entity / Normalization"]
      Normalization --> Verification["Verification"]
      Verification --> Truth["Truth Spine"]
      Truth --> Oracle["Oracle"]
      Oracle --> Reporting["Reporting"]
      Reporting --> Tracking["Tracking"]
    ```

    ## Client Delivery Chain

    ```mermaid
    flowchart LR
      Sales --> Production --> QA --> Release["Release Readiness"] --> ClientOps --> Reports --> Renewal
    ```

    ## Agent Fabric Chain

    ```mermaid
    flowchart LR
      Identity --> Alignment --> Oracle --> Knowledge["Knowledge Context"] --> Agent["Agent Fabric"] --> Audit["Audit and Tracking"]
    ```

    ## Reporting Chain

    ```mermaid
    flowchart LR
      Truth["Certified Truth"] --> Readiness --> Publication --> Assembly["Report Assembly"] --> Export --> Usage["Usage Tracking"]
    ```

    ## Direct Connect Chain

    ```mermaid
    flowchart LR
      Connector --> Mapping --> Sync --> Validation --> Retry --> Aggregation --> Truth --> Health
    ```

    ## Governance and Release Chain

    ```mermaid
    flowchart LR
      Change["Architecture Change"] --> Registry --> TruthSpine["Truth Spine Check"] --> Security --> QA --> Release --> Monitoring --> Rollback
    ```

    ## Tracking and Intelligence Chain

    ```mermaid
    flowchart LR
      SalesEvent --> ProductionEvent --> QAEvent --> ReleaseEvent --> ClientOpsEvent --> ReportEvent --> Intelligence --> Executive
    ```

    ## SHF Integration Chain

    ```mermaid
    flowchart LR
      SHFProgram --> Outcome --> Evidence --> SHSIntake --> Oracle --> ImpactSpine --> FunderReport --> PublicOutput
    ```

    ## Commercialization Chain

    ```mermaid
    flowchart LR
      Package --> Entitlement --> Delivery --> Usage --> Support --> ContractState --> Renewal --> ExecutiveReporting
    ```

    ## Ownership Boundaries

    ```mermaid
    flowchart TB
      MLR["Master Layer Registry"] --> ECC["Executive Command Center visibility"]
      Truth["Truth Spine anti-drift"] --> ECC
      Oracle["Oracle operational truth"] --> ECC
      Reports["Reports publication packaging"] --> ECC
      Tracking["Tracking intelligence"] --> ECC
      ECC -. displays only .-> Leadership
    ```
    """)
    write(ARCH_DIR / "SHS_BOS_LAYER_FAMILY_ARCHITECTURE_V1.md", text)


def write_qa_md(package: dict) -> None:
    text = dedent(f"""
    # SHS BOS Layer Family QA Report V1

    Generated architecture records:

    - official layers: {package['metadata']['official_layer_count']}
    - families: {package['metadata']['family_count']}
    - contracts: {package['metadata']['contract_count']}
    - operating chains: {package['metadata']['chain_count']}

    Validation command:

    ```bash
    cd /Users/mikeslate/Desktop/shrv1
    python3 scripts/check_shs_bos_layer_family_architecture.py
    ```

    Expected supporting checks:

    - `python3 scripts/check_shs_bos_v1_layer_audit.py`
    - `python3 scripts/check_shs_bos_layer_family_architecture.py`

    Downstream owner review, command-center aggregation, contract runtime, and truth-pipeline runtime checks belong to later packages and are not required for Package C validation.
    """)
    write(ARCH_DIR / "SHS_BOS_LAYER_FAMILY_QA_REPORT_V1.md", text)


def write_summary_md(package: dict) -> None:
    text = dedent(f"""
    # SHS BOS Layer Family Implementation Summary V1

    This pass converts the SHS BOS V1 audit into an enforceable architecture package without creating a duplicate command center, duplicate Master Layer Registry, or duplicate truth authority.

    ## Counts

    - official layers: {package['metadata']['official_layer_count']}
    - families: {package['metadata']['family_count']}
    - subsystems: {package['metadata']['subsystem_count']}
    - shared services: {package['metadata']['shared_service_count']}
    - business surfaces: {package['metadata']['business_surface_count']}
    - cross-cutting controls: {package['metadata']['cross_cutting_control_count']}
    - decision-required layer-like records: {package['metadata']['decision_required_count']}
    - mandatory contracts: {package['metadata']['contract_count']}
    - operating chains: {package['metadata']['chain_count']}

    ## Downstream Visibility

    Executive Command Center aggregation remains a downstream visibility package. Package C defines the family, ownership, contract, chain, and closure-plan architecture artifacts without requiring command-center UI, API, backend, browser, or build validation.
    """)
    write(ARCH_DIR / "SHS_BOS_LAYER_FAMILY_IMPLEMENTATION_SUMMARY_V1.md", text)



if __name__ == "__main__":
    package = build()
    write_artifacts(package)
    print(f"Generated SHS BOS layer family architecture: {package['metadata']['official_layer_count']} official layers, {package['metadata']['family_count']} families.")
