from __future__ import annotations

import warnings

import pytest
from fastapi.testclient import TestClient

from auth.sessions import _SESSIONS
from services import truth_history_service, truth_spine_service
from main import app  # type: ignore

ORIGIN = "http://127.0.0.1:5174"


@pytest.fixture(autouse=True)
def _clear_auth_state():
    _SESSIONS.clear()
    yield
    _SESSIONS.clear()


@pytest.fixture(autouse=True)
def _isolated_truth_storage(tmp_path, monkeypatch):
    """Truth Spine security remediation: this functional test suite used to
    write real claim/source/federation-system fixtures directly into the
    developer's persistent services/shf-agent-fabric/db/truth/*.json files
    on every run, with no cleanup - a real problem now that create_claim()
    rejects re-creating an existing claim_id (a second run of this file
    against unclean real storage would fail). Redirect all storage to a
    disposable tmp_path for every test in this file, exactly as
    test_truth_routes_security.py does."""
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation_registry.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.audit.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")


def _client() -> TestClient:
    return TestClient(app)


def _login(client: TestClient, email: str = "shs@demo.shs", password: str = "demo-password") -> dict:
    """These functional tests exercise the SHS-admin role (full Truth
    permission set) so the original functional assertions below continue to
    hold end to end. Authorization-specific behavior (permission
    boundaries, tenant isolation, reason requirements, etc.) is covered
    separately and more exhaustively in test_truth_routes_security.py -
    this file's job is to prove the existing functional flow still works
    now that it requires authentication, not to re-prove security
    properties already covered there."""
    response = client.post("/auth/login", json={"email": email, "password": password}, headers={"Origin": ORIGIN})
    assert response.status_code == 200, response.text
    return response.json()


def _csrf_headers(identity: dict) -> dict:
    return {"x-csrf-token": identity["csrf_token"]}


def test_truth_backend_imports_and_openapi_routes_exist():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/truth/health",
        "/truth/coverage",
        "/truth/drift",
        "/truth/federation",
        "/truth/federation/systems",
        "/truth/federation/systems/{system_id}",
        "/truth/claims",
        "/truth/claims/{claim_id}",
        "/truth/packages",
        "/truth/package/{claim_id}",
        "/truth/sources",
        "/truth/envelope/{claim_id}",
        "/truth/readiness/{claim_id}",
        "/truth/replay/{claim_id}",
        "/truth/public-approval/{claim_id}",
        "/truth/audit-feed",
        # Added by the Truth Spine security remediation:
        "/truth/public/claims",
        "/truth/public/claims/{claim_id}",
        "/truth/sources/{source_id}/verify",
        "/truth/claims/{claim_id}/approve-public",
        "/truth/claims/{claim_id}/revoke-public",
    ):
        assert route in paths


def test_truth_source_claim_envelope_and_readiness_flow():
    client = _client()
    identity = _login(client)
    headers = _csrf_headers(identity)
    source_id = "src_test_truth_verified"
    claim_id = "claim_test_truth_ready"

    source_response = client.post(
        "/truth/sources",
        json={
            "source_id": source_id,
            "source_type": "report",
            "title": "Verified attendance export",
            "uri": "local://verified-attendance-export",
            "evidence_type": "csv",
        },
        headers=headers,
    )
    assert source_response.status_code == 200, source_response.text
    assert source_response.json()["source"]["source_id"] == source_id
    # A newly created source can never be caller-verified at creation time -
    # verification is a separate, explicitly-authorized transition.
    assert source_response.json()["source"]["verification_status"] == "unverified"

    verify_response = client.post(
        f"/truth/sources/{source_id}/verify",
        json={"verification_status": "verified", "reason": "Reviewed attendance export against roster."},
        headers=headers,
    )
    assert verify_response.status_code == 200, verify_response.text
    assert verify_response.json()["source"]["verification_status"] == "verified"

    claim_response = client.post(
        "/truth/claims",
        json={
            "claim_id": claim_id,
            "app_id": "admin",
            "project_id": "project_truth_v1",
            "client_id": "client_truth_v1",
            "program_id": "program_truth_v1",
            "claim_type": "metric",
            "claim_text": "Program attendance reached 100 participants.",
            "metric_name": "participants",
            "metric_value": 100,
            "source_ids": [source_id],
            "trace_coverage": 90,
        },
        headers=headers,
    )
    assert claim_response.status_code == 200, claim_response.text
    claim = claim_response.json()["claim"]
    assert claim["verification_status"] == "verified"
    assert claim["trust_level"] == "verified"
    assert claim["report_ready"] is True

    envelope_response = client.get(f"/truth/envelope/{claim_id}", headers=headers)
    assert envelope_response.status_code == 200, envelope_response.text
    envelope = envelope_response.json()["envelope"]
    assert envelope["verification_status"] == "verified"
    assert envelope["report_ready"] is True

    readiness_response = client.get(f"/truth/readiness/{claim_id}", headers=headers)
    assert readiness_response.status_code == 200, readiness_response.text
    readiness = readiness_response.json()["readiness"]
    assert readiness["ready_for_reports"] is True

    package_response = client.get(f"/truth/package/{claim_id}", headers=headers)
    assert package_response.status_code == 200, package_response.text
    package = package_response.json()["package"]
    assert package["package_id"] == f"truth_pkg_{claim_id}"
    assert package["signature_status"] == "hash_signed_v1"
    assert package["display_scope"] == "internal"
    assert len(package["package_hash"]) == 64

    repeat_package_response = client.get(f"/truth/package/{claim_id}", headers=headers)
    assert repeat_package_response.status_code == 200, repeat_package_response.text
    assert repeat_package_response.json()["package"]["package_hash"] == package["package_hash"]

    packages_response = client.get("/truth/packages", headers=headers)
    assert packages_response.status_code == 200, packages_response.text
    assert any(item["claim_id"] == claim_id for item in packages_response.json()["packages"])

    replay_response = client.get(f"/truth/replay/{claim_id}", headers=headers)
    assert replay_response.status_code == 200, replay_response.text
    replay = replay_response.json()["replay"]
    assert replay["claim_id"] == claim_id
    assert replay["current_state"]["verification_status"] == "verified"
    assert any(event["event_type"] == "verification_evaluated" for event in replay["timeline"])

    federation_response = client.get("/truth/federation", headers=headers)
    assert federation_response.status_code == 200, federation_response.text
    federation = federation_response.json()
    assert federation["active_count"] >= 1
    assert any(system["system_id"] == "shs" for system in federation["systems"])

    system_response = client.post(
        "/truth/federation/systems",
        json={
            "system_id": "test_partner_truth",
            "display_name": "Test Partner Truth",
            "system_type": "partner",
            "owner": "Tests",
            "allowed_claim_types": ["metric"],
            "allowed_source_types": ["report"],
        },
        headers=headers,
    )
    assert system_response.status_code == 200, system_response.text
    assert system_response.json()["system"]["trust_mode"] == "review_required"

    get_system_response = client.get("/truth/federation/systems/test_partner_truth", headers=headers)
    assert get_system_response.status_code == 200, get_system_response.text
    assert get_system_response.json()["system"]["system_id"] == "test_partner_truth"

    coverage_response = client.get("/truth/coverage", headers=headers)
    assert coverage_response.status_code == 200, coverage_response.text
    coverage = coverage_response.json()
    assert "total_claims" in coverage
    assert "total_packages_available" in coverage
    assert "total_federated_systems" in coverage
    assert "active_federated_systems" in coverage
    assert "average_trace_coverage" in coverage
    assert "coverage_status" in coverage
    assert coverage["coverage_status"] in {"excellent", "good", "warning", "critical"}

    drift_response = client.get("/truth/drift", headers=headers)
    assert drift_response.status_code == 200, drift_response.text
    drift = drift_response.json()
    assert "total_findings" in drift
    assert isinstance(drift["severity_counts"], dict)
    assert isinstance(drift["findings"], list)


def test_truth_public_approval_blocks_unverified_claim():
    client = _client()
    identity = _login(client)
    headers = _csrf_headers(identity)
    claim_id = "claim_test_truth_unverified_public_block"

    claim_response = client.post(
        "/truth/claims",
        json={
            "claim_id": claim_id,
            "app_id": "admin",
            "claim_type": "fact",
            "claim_text": "Unverified claim should not be public.",
            "source_ids": [],
            "trace_coverage": 0,
        },
        headers=headers,
    )
    assert claim_response.status_code == 200, claim_response.text
    assert claim_response.json()["claim"]["verification_status"] == "missing_source"

    approval_response = client.patch(
        f"/truth/public-approval/{claim_id}",
        json={"public_approved": True, "reason": "Attempting approval of an unverified claim."},
        headers=headers,
    )
    # A blocked (still-invalid) transition is now reported as 409, not 200
    # with an approval_blocked:true body - see
    # docs/TRUTH_SPINE_SECURITY.md's error-response conventions.
    assert approval_response.status_code == 409, approval_response.text

    drift_response = client.get("/truth/drift", headers=headers)
    assert drift_response.status_code == 200, drift_response.text
    findings = drift_response.json()["findings"]
    assert any(
        finding.get("claim_id") == claim_id and finding.get("category") == "missing_source"
        for finding in findings
    )


def test_truth_drift_flags_unknown_federation_system():
    client = _client()
    identity = _login(client)
    headers = _csrf_headers(identity)
    source_id = "src_test_truth_unknown_source_system"
    claim_id = "claim_test_truth_unknown_federation"

    source_response = client.post(
        "/truth/sources",
        json={
            "source_id": source_id,
            "system_id": "unknown_source_system_for_tests",
            "source_type": "report",
            "title": "Unknown system source",
            "uri": "local://unknown-system-source",
            "evidence_type": "document",
        },
        headers=headers,
    )
    assert source_response.status_code == 200, source_response.text

    verify_response = client.post(
        f"/truth/sources/{source_id}/verify",
        json={"verification_status": "verified", "reason": "Test fixture verification."},
        headers=headers,
    )
    assert verify_response.status_code == 200, verify_response.text

    claim_response = client.post(
        "/truth/claims",
        json={
            "claim_id": claim_id,
            "app_id": "unknown_claim_system_for_tests",
            "claim_type": "metric",
            "claim_text": "Unknown system claim should be flagged.",
            "source_ids": [source_id],
            "trace_coverage": 88,
        },
        headers=headers,
    )
    assert claim_response.status_code == 200, claim_response.text

    drift_response = client.get("/truth/drift", headers=headers)
    assert drift_response.status_code == 200, drift_response.text
    findings = drift_response.json()["findings"]
    assert any(
        finding.get("claim_id") == claim_id and finding.get("category") == "unknown_federation_system"
        for finding in findings
    )
    assert any(
        finding.get("source_id") == source_id and finding.get("category") == "unknown_source_system"
        for finding in findings
    )
