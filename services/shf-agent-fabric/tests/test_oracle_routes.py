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
    """This file's only Truth Spine usage is as fixture/setup data for an
    Oracle test (test_oracle_verified_truth_spine_claim_rules_supportable
    below) - Oracle routes/logic themselves are out of scope for the Truth
    Spine security remediation and are NOT modified here. Only the Truth
    Spine setup calls in that one test are updated to authenticate, exactly
    as tests/test_truth_routes.py was. See that file for the identical
    isolation rationale."""
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation_registry.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.audit.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")


def _client() -> TestClient:
    return TestClient(app)


def _truth_auth_headers(client: TestClient) -> dict:
    response = client.post("/auth/login", json={"email": "shs@demo.shs", "password": "demo-password"}, headers={"Origin": ORIGIN})
    assert response.status_code == 200, response.text
    return {"x-csrf-token": response.json()["csrf_token"]}


def test_oracle_health_and_openapi_routes_exist():
    client = _client()
    health = client.get("/oracle/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/oracle/health",
        "/oracle/cases",
        "/oracle/cases/{case_id}",
        "/oracle/cases/{case_id}/rule",
        "/oracle/rulings",
        "/oracle/rulings/{ruling_id}",
        "/oracle/cases/{case_id}/ruling",
    ):
        assert route in paths


def test_oracle_no_claim_case_rules_insufficient_evidence():
    client = _client()
    case_id = "oracle_case_test_no_claims"

    case_response = client.post(
        "/oracle/cases",
        json={
            "case_id": case_id,
            "case_type": "adjudication",
            "title": "No claim case",
            "question": "Can Oracle rule without Truth Spine claims?",
            "claim_ids": [],
            "requested_by": "tests",
        },
    )
    assert case_response.status_code == 200, case_response.text
    assert case_response.json()["case"]["claim_ids"] == []

    ruling_response = client.post(f"/oracle/cases/{case_id}/rule")
    assert ruling_response.status_code == 200, ruling_response.text
    ruling = ruling_response.json()["ruling"]
    assert ruling["decision"] == "insufficient_evidence"
    assert ruling["confidence"] <= 30
    assert ruling["claim_packages"] == []


def test_oracle_verified_truth_spine_claim_rules_supportable():
    client = _client()
    source_id = "src_test_oracle_verified"
    claim_id = "claim_test_oracle_supportable"
    case_id = "oracle_case_test_supportable"
    truth_headers = _truth_auth_headers(client)

    source_response = client.post(
        "/truth/sources",
        json={
            "source_id": source_id,
            "source_type": "report",
            "title": "Oracle verified source",
            "uri": "local://oracle-verified-source",
            "evidence_type": "csv",
        },
        headers=truth_headers,
    )
    assert source_response.status_code == 200, source_response.text

    verify_response = client.post(
        f"/truth/sources/{source_id}/verify",
        json={"verification_status": "verified", "reason": "Oracle test fixture verification."},
        headers=truth_headers,
    )
    assert verify_response.status_code == 200, verify_response.text

    claim_response = client.post(
        "/truth/claims",
        json={
            "claim_id": claim_id,
            "app_id": "shs",
            "project_id": "oracle_v1",
            "client_id": "internal",
            "program_id": "oracle_tests",
            "claim_type": "metric",
            "claim_text": "Oracle test attendance reached 50 participants.",
            "metric_name": "participants",
            "metric_value": 50,
            "source_ids": [source_id],
            "trace_coverage": 91,
        },
        headers=truth_headers,
    )
    assert claim_response.status_code == 200, claim_response.text
    claim = claim_response.json()["claim"]
    assert claim["verification_status"] == "verified"
    assert claim["report_ready"] is True

    case_response = client.post(
        "/oracle/cases",
        json={
            "case_id": case_id,
            "title": "Supportable claim case",
            "question": "Does verified Truth Spine evidence support this claim?",
            "claim_ids": [claim_id],
            "requested_by": "tests",
        },
    )
    assert case_response.status_code == 200, case_response.text

    ruling_response = client.post(f"/oracle/cases/{case_id}/rule")
    assert ruling_response.status_code == 200, ruling_response.text
    ruling = ruling_response.json()["ruling"]
    assert ruling["decision"] == "supportable"
    assert ruling["confidence"] >= 80
    assert ruling["claim_packages"][0]["claim_id"] == claim_id
    assert ruling["claim_packages"][0]["package_hash"]

    rulings_response = client.get("/oracle/rulings")
    assert rulings_response.status_code == 200, rulings_response.text
    assert any(item["ruling_id"] == ruling["ruling_id"] for item in rulings_response.json()["rulings"])

    case_ruling_response = client.get(f"/oracle/cases/{case_id}/ruling")
    assert case_ruling_response.status_code == 200, case_ruling_response.text
    assert case_ruling_response.json()["ruling"]["ruling_id"] == ruling["ruling_id"]


def test_oracle_unknown_case_returns_404():
    client = _client()
    response = client.get("/oracle/cases/oracle_case_missing")
    assert response.status_code == 404

    ruling_response = client.post("/oracle/cases/oracle_case_missing/rule")
    assert ruling_response.status_code == 404
