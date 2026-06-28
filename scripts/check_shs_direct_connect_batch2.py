#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "docs/SHS_DIRECT_CONNECT_BATCH2_DIRECT_SOURCE_PROOF.md",
    "docs/SHS_DIRECT_CONNECT_BATCH2_DIRECT_SOURCE_PROOF.json",
    "src/data/directConnect/directSourceProofRecords.js",
    "src/data/directConnect/directSourceEvidenceRefs.js",
    "src/data/directConnect/directSourceCategories.js",
    "src/data/directConnect/directSourceProofStorage.js",
    "src/data/directConnect/directSourceProofSafety.js",
    "src/data/directConnect/directSourceProofMetrics.js",
    "src/pages/admin/direct-connect/DirectConnectProofCenterPage.jsx",
    "src/pages/admin/direct-connect/components/DirectSourceProofList.jsx",
    "src/pages/admin/direct-connect/components/DirectSourceProofDetail.jsx",
    "src/pages/admin/direct-connect/components/DirectSourceEvidencePanel.jsx",
    "src/pages/admin/direct-connect/components/DirectSourceReadinessPanel.jsx",
    "src/pages/admin/direct-connect/components/DirectSourceSafetyPanel.jsx",
    "src/pages/admin/direct-connect/components/DirectSourceCategoryPanel.jsx",
    "src/pages/admin/direct-connect/directConnectProofCenter.css",
]

APPROVED_CATEGORIES = [
    "client_supplied_document",
    "partner_attestation",
    "internal_shs_operational_record",
    "internal_shs_report",
    "public_agency_record",
    "public_dataset_reference",
    "manual_review_record",
    "system_export_reference",
    "audit_review_record",
    "governance_review_record",
]

DEFERRED_CATEGORIES = [
    "bank_account_connection",
    "financial_account_aggregation",
    "payment_processor_connection",
    "payroll_connection",
    "EHR_connection",
    "live_case_management_connection",
    "live_government_api_connection",
    "private_system_scraping",
]

REQUIRED_FALSE_TOKENS = [
    "safe_for_shf_public_surface: false",
    "public_approved: false",
    "truth_spine_claim_created: false",
    "shf_impact_data_mutated: false",
    "live_connection_enabled: false",
    "credential_required: false",
    "external_api_called: false",
]

FORBIDDEN_TRUE_PATTERNS = [
    "public_approved: true",
    "truth_spine_claim_created: true",
    "shf_impact_data_mutated: true",
    "live_connection_enabled: true",
    "credential_required: true",
    "external_api_called: true",
]

FORBIDDEN_ENDPOINT_TOKENS = [
    "/connect-bank",
    "/connect-account",
    "/oauth",
    "/token",
    "/sync",
    "/scrape",
    "/payment",
    "/live-fetch",
    "/external-api-call",
]

FORBIDDEN_LIVE_TOKENS = [
    "plaidToken",
    "finicityToken",
    "bankLogin",
    "bank_password",
    "client_secret",
    "access_token",
    "refresh_token",
    "stripeSecret",
    "squareSecret",
    "quickbooksSecret",
    "fetch(",
    "axios.",
]


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"FAIL: missing required file {rel}")
    return path.read_text(encoding="utf-8")


def main() -> int:
    failures: list[str] = []
    for rel in REQUIRED_FILES:
        path = ROOT / rel
        if not path.exists():
            failures.append(f"missing required file: {rel}")

    data: dict = {}
    json_path = ROOT / "docs/SHS_DIRECT_CONNECT_BATCH2_DIRECT_SOURCE_PROOF.json"
    if json_path.exists():
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            failures.append(f"invalid JSON: {exc}")

    if data.get("corrected_framing") != "direct_source_proof":
        failures.append("JSON corrected_framing must equal direct_source_proof")
    if data.get("batch2_complete") is not True:
        failures.append("JSON batch2_complete must be true")
    if len(data.get("approved_source_categories", [])) != 10:
        failures.append("JSON must list 10 approved source categories")
    if len(data.get("deferred_source_categories", [])) != 8:
        failures.append("JSON must list 8 deferred source categories")

    scanned = "\n".join(read(rel) for rel in REQUIRED_FILES if (ROOT / rel).exists())
    package_json = read("package.json")
    admin_routes = read("src/router/AdminRoutes.jsx")
    sidebar = read("src/components/admin/AdminSidebar.jsx")
    access = read("src/system/identity/hubAccessControl.js")

    for token in ["direct_source_proof", "Direct Connect Batch 2 is direct-source proof only"]:
        if token not in scanned:
            failures.append(f"missing corrected framing token: {token}")
    for category in APPROVED_CATEGORIES:
        if category not in scanned:
            failures.append(f"missing approved source category: {category}")
    for category in DEFERRED_CATEGORIES:
        if category not in scanned:
            failures.append(f"missing deferred source category: {category}")
    for token in REQUIRED_FALSE_TOKENS:
        if token not in scanned:
            failures.append(f"missing required false token: {token}")
    for token in FORBIDDEN_TRUE_PATTERNS:
        if token in scanned:
            failures.append(f"dangerous flag set true: {token}")
    for token in FORBIDDEN_LIVE_TOKENS:
        if token in scanned:
            failures.append(f"forbidden live integration or credential token present: {token}")
    for token in FORBIDDEN_ENDPOINT_TOKENS:
        if token in scanned:
            failures.append(f"forbidden Direct Connect endpoint token present: {token}")

    if "shfImpactData" in scanned:
        failures.append("Direct Connect Batch 2 must not reference SHF Impact Data Spine directly")
    if '"check:direct-connect-batch2": "python3 scripts/check_shs_direct_connect_batch2.py"' not in package_json:
        failures.append("package.json missing check:direct-connect-batch2 script")
    if "DirectConnectProofCenterPage" not in admin_routes or "/ops/direct-connect" not in admin_routes:
        failures.append("AdminRoutes missing Direct Connect Proof Center route")
    if "/ops/direct-connect" not in sidebar:
        failures.append("AdminSidebar missing /ops/direct-connect navigation")
    if '"/ops/direct-connect": ["shs_admin"]' not in access:
        failures.append("hubAccessControl missing shs_admin-only /ops/direct-connect access")

    if failures:
        print("FAIL: SHS Direct Connect Batch 2 direct-source proof checks failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("PASS: SHS Direct Connect Batch 2 direct-source proof checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
