from __future__ import annotations

"""
Comprehensive Truth Spine security test matrix (remediation pass).

Every test in this file runs against ISOLATED, disposable storage under a
pytest tmp_path - never the real services/shf-agent-fabric/db/truth/*.json
files. See the isolated_storage fixture and
test_storage_isolation_is_real below, which asserts this directly.
"""

import json

import pytest
from fastapi.testclient import TestClient

from auth.sessions import _SESSIONS
from services import truth_history_service, truth_spine_service
from main import app  # type: ignore

ORIGIN = "http://127.0.0.1:5174"

SHS_ADMIN = ("shs@demo.shs", "demo-password")
CLIENT_ADMIN = ("admin@demo.shs", "demo-password")
CLIENT = ("client@demo.shs", "demo-password")
CLIENT_OTHER_ORG = ("client@other-demo.shs", "demo-password")


@pytest.fixture()
def isolated_storage(tmp_path, monkeypatch):
    """Redirects every Truth Spine storage path to a throwaway directory
    for the duration of one test. This is real dependency injection via
    monkeypatch on the module-level path constants that every read/write
    function in truth_spine_service.py and truth_history_service.py
    resolves at call time - not a mock of behavior, the actual file I/O
    happens, just against disposable files."""
    truth_dir = tmp_path / "truth"
    monkeypatch.setattr(truth_spine_service, "TRUTH_DB_DIR", truth_dir)
    monkeypatch.setattr(truth_spine_service, "CLAIMS_PATH", truth_dir / "claims.json")
    monkeypatch.setattr(truth_spine_service, "SOURCES_PATH", truth_dir / "sources.json")
    monkeypatch.setattr(truth_spine_service, "FEDERATION_PATH", truth_dir / "federation_registry.json")
    monkeypatch.setattr(truth_spine_service, "AUDIT_LOG_PATH", tmp_path / "logs" / "truth.audit.log")
    monkeypatch.setattr(truth_history_service, "HISTORY_PATH", truth_dir / "history.jsonl")
    return truth_dir


@pytest.fixture(autouse=True)
def _clear_auth_state():
    _SESSIONS.clear()
    yield
    _SESSIONS.clear()


def _client() -> TestClient:
    return TestClient(app)


def _login(client: TestClient, creds=SHS_ADMIN) -> dict:
    email, password = creds
    response = client.post("/auth/login", json={"email": email, "password": password}, headers={"Origin": ORIGIN})
    assert response.status_code == 200, response.text
    return response.json()


def _headers(identity: dict) -> dict:
    return {"x-csrf-token": identity["csrf_token"]}


def _create_verified_source(client, identity, source_id="src_fixture", org_login=SHS_ADMIN):
    """Convenience: as SHS admin, create + verify one source so tests that
    need a ready-to-verify claim don't repeat the same four calls."""
    headers = _headers(identity)
    resp = client.post(
        "/truth/sources",
        json={"source_id": source_id, "source_type": "report", "title": "Fixture source", "uri": "local://fixture"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    resp = client.post(
        f"/truth/sources/{source_id}/verify",
        json={"verification_status": "verified", "reason": "fixture verification"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    return source_id


# =========================================================================
# Storage isolation proof (required by the task)
# =========================================================================

def test_storage_isolation_is_real(isolated_storage):
    real_claims_path = truth_spine_service.SERVICE_ROOT.parent.parent / "services" / "shf-agent-fabric" / "db" / "truth" / "claims.json"
    assert truth_spine_service.CLAIMS_PATH != real_claims_path
    assert "tmp" in str(truth_spine_service.CLAIMS_PATH).lower() or str(truth_spine_service.CLAIMS_PATH).startswith(str(isolated_storage))
    assert str(truth_spine_service.CLAIMS_PATH).startswith(str(isolated_storage))
    assert str(truth_history_service.HISTORY_PATH).startswith(str(isolated_storage))


# =========================================================================
# Authentication tests
# =========================================================================

def test_missing_credentials_rejected_on_protected_read(isolated_storage):
    client = _client()
    response = client.get("/truth/claims")
    assert response.status_code == 401


def test_missing_credentials_rejected_on_write(isolated_storage):
    client = _client()
    response = client.post("/truth/claims", json={"claim_text": "x"})
    assert response.status_code == 401


def test_invalid_credentials_rejected():
    client = _client()
    response = client.post("/auth/login", json={"email": "shs@demo.shs", "password": "wrong"}, headers={"Origin": ORIGIN})
    assert response.status_code == 401


def test_valid_identity_proceeds_to_authorization(isolated_storage):
    client = _client()
    identity = _login(client)
    response = client.get("/truth/claims", headers=_headers(identity))
    assert response.status_code == 200


def test_public_reads_require_no_credentials(isolated_storage):
    client = _client()
    response = client.get("/truth/public/claims")
    assert response.status_code == 200


# =========================================================================
# Authorization tests
# =========================================================================

def test_permission_missing_returns_403_not_401(isolated_storage):
    """A CLIENT role is authenticated but has no truth.claim.approve_public
    permission - approving must be 403 (forbidden), not 401 (unauthenticated)."""
    client = _client()
    identity = _login(client, CLIENT)
    source_id = _create_verified_source(client, _login(client, SHS_ADMIN))
    _SESSIONS.clear()
    identity = _login(client, CLIENT)
    headers = _headers(identity)
    create_resp = client.post(
        "/truth/claims",
        json={"claim_id": "claim_perm_test", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    assert create_resp.status_code == 200, create_resp.text
    approve_resp = client.post(
        "/truth/claims/claim_perm_test/approve-public",
        json={"reason": "attempt"},
        headers=headers,
    )
    assert approve_resp.status_code == 403


def test_correct_permission_allowed(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_perm_ok", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    approve_resp = client.post(
        "/truth/claims/claim_perm_ok/approve-public",
        json={"reason": "SHS admin approval"},
        headers=headers,
    )
    assert approve_resp.status_code == 200, approve_resp.text


def test_internal_approval_is_distinct_from_public_approval_and_is_audited(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity, source_id="src_internal_approval")
    headers = _headers(admin_identity)
    created = client.post(
        "/truth/claims",
        json={"claim_id": "claim_internal_approval", "claim_text": "referral created", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    assert created.status_code == 200, created.text

    approved = client.post(
        "/truth/claims/claim_internal_approval/approve-internal",
        json={"reason": "institutional review completed"},
        headers=headers,
    )
    assert approved.status_code == 200, approved.text
    claim = approved.json()["claim"]
    assert claim["internal_approval_status"] == "approved"
    assert claim["internal_approved_by"] == admin_identity["user_id"]
    assert claim["public_approved"] is False

    events = truth_history_service.list_history_for_entity("claim_internal_approval")
    assert any(event["event_type"] == "claim.internal_approved" for event in events)

    revoked = client.post(
        "/truth/claims/claim_internal_approval/revoke-internal",
        json={"reason": "review reopened"},
        headers=headers,
    )
    assert revoked.status_code == 200, revoked.text
    assert revoked.json()["claim"]["internal_approval_status"] == "revoked"
    assert revoked.json()["claim"]["public_approved"] is False
    events = truth_history_service.list_history_for_entity("claim_internal_approval")
    assert any(event["event_type"] == "claim.internal_approval_revoked" for event in events)


def test_internal_approval_requires_verified_source(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    created = client.post(
        "/truth/claims",
        json={"claim_id": "claim_internal_unverified", "claim_text": "referral created", "source_ids": ["missing-source"], "trace_coverage": 90},
        headers=headers,
    )
    assert created.status_code == 200, created.text
    response = client.post(
        "/truth/claims/claim_internal_unverified/approve-internal",
        json={"reason": "attempt"},
        headers=headers,
    )
    assert response.status_code == 409


def test_internal_eligibility_fails_closed_without_lineage_or_approval(isolated_storage):
    assert truth_spine_service.is_internal_institutionally_eligible({
        "verification_status": "verified",
        "public_approved": True,
        "internal_approval_status": "not_approved",
        "ownership_status": "scoped",
        "organization_id": "shs-core",
    }) is False


def test_service_actor_cannot_self_approve_internal_claim(isolated_storage):
    class ProducerService:
        user_id = "service:shs-api"
        role = "client"
        organization_id = "shs-core"
        principal_type = "service"

    actor = ProducerService()
    with pytest.raises(truth_spine_service.TruthAuthorityError):
        truth_spine_service.approve_internal("missing-claim", actor, "attempt")


def test_internal_approval_scope_is_enforced_for_other_organization(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity, source_id="src_internal_scope")
    headers = _headers(admin_identity)
    created = client.post(
        "/truth/claims",
        json={"claim_id": "claim_internal_scope", "claim_text": "referral created", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    assert created.status_code == 200, created.text

    class OtherOrgReviewer:
        user_id = "reviewer-other-org"
        role = "client_admin"
        organization_id = "other-org"

    with pytest.raises(truth_spine_service.TruthAuthorityError):
        truth_spine_service.approve_internal("claim_internal_scope", OtherOrgReviewer(), "attempt")


def test_internal_approval_resets_on_new_current_claim_version(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity, source_id="src_internal_version")
    headers = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_internal_version", "claim_text": "v1", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    approved = client.post(
        "/truth/claims/claim_internal_version/approve-internal",
        json={"reason": "approve v1"},
        headers=headers,
    )
    assert approved.status_code == 200, approved.text
    updated = client.patch(
        "/truth/claims/claim_internal_version",
        json={"claim_text": "v2"},
        headers=headers,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["claim"]["version"] == 2
    assert updated.json()["claim"]["internal_approval_status"] == "not_approved"
    versions = client.get("/truth/claims/claim_internal_version/versions", headers=headers).json()["versions"]
    assert versions[0]["internal_approval_status"] == "approved"
    assert versions[0]["superseded_by"] == "claim_internal_version@v2"


def test_read_permission_does_not_imply_approval_permission(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers_admin = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_read_not_approve", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers_admin,
    )
    _SESSIONS.clear()
    client_identity = _login(client, CLIENT)
    headers_client = _headers(client_identity)
    read_resp = client.get("/truth/claims/claim_read_not_approve", headers=headers_client)
    # CLIENT can read within their own scope (this claim is global/shs-owned
    # in this test, so a cross-org 404 is also an acceptable proof point -
    # the key assertion is that approval is separately gated regardless.
    approve_resp = client.post(
        "/truth/claims/claim_read_not_approve/approve-public",
        json={"reason": "attempt"},
        headers=headers_client,
    )
    assert approve_resp.status_code == 403


def test_create_permission_does_not_imply_verify_permission(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)
    headers = _headers(identity)
    create_resp = client.post(
        "/truth/sources",
        json={"source_id": "src_no_self_verify", "source_type": "manual", "title": "x", "uri": "local://x"},
        headers=headers,
    )
    assert create_resp.status_code == 200, create_resp.text
    verify_resp = client.post(
        "/truth/sources/src_no_self_verify/verify",
        json={"verification_status": "verified", "reason": "self-verification attempt"},
        headers=headers,
    )
    assert verify_resp.status_code == 403


def test_update_permission_does_not_imply_approval_permission(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers_admin = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_update_not_approve", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers_admin,
    )
    _SESSIONS.clear()
    client_admin_identity = _login(client, CLIENT_ADMIN)
    headers_client_admin = _headers(client_admin_identity)
    # CLIENT_ADMIN has truth.claim.update but (per auth/permissions.py) NOT
    # truth.claim.approve_public.
    approve_resp = client.post(
        "/truth/claims/claim_update_not_approve/approve-public",
        json={"reason": "attempt"},
        headers=headers_client_admin,
    )
    assert approve_resp.status_code == 403


def test_approval_permission_does_not_imply_global_cross_tenant_authority(isolated_storage):
    """Even a hypothetical org-scoped approver (not present in the current
    role map, but tested for defense-in-depth) is checked against
    check_organization_access - proven here via the service layer directly
    since no current role has approve_public without also being global."""
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers_admin = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={
            "claim_id": "claim_org_scope_test",
            "claim_text": "x",
            "source_ids": [source_id],
            "trace_coverage": 90,
            "requested_organization_id": "client-demo",
        },
        headers=headers_admin,
    )

    class FakeApproverFromOtherOrg:
        user_id = "fake_other_org_approver"
        role = "client_admin"
        organization_id = "client-other-demo"

    with pytest.raises(truth_spine_service.TruthAuthorityError):
        truth_spine_service.approve_public("claim_org_scope_test", FakeApproverFromOtherOrg(), "attempt")


def test_revoke_permission_tested_separately_from_approve(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_revoke_test", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    client.post("/truth/claims/claim_revoke_test/approve-public", json={"reason": "approve"}, headers=headers)
    revoke_resp = client.post("/truth/claims/claim_revoke_test/revoke-public", json={"reason": "revoke"}, headers=headers)
    assert revoke_resp.status_code == 200, revoke_resp.text
    assert revoke_resp.json()["claim"]["public_approved"] is False


# =========================================================================
# Tenant-isolation tests
# =========================================================================

def _create_org_claim(client, identity, claim_id, org_id, source_id):
    headers = _headers(identity)
    resp = client.post(
        "/truth/claims",
        json={
            "claim_id": claim_id,
            "claim_text": "org-scoped claim",
            "source_ids": [source_id],
            "trace_coverage": 90,
            "requested_organization_id": org_id,
        },
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["claim"]


def test_tenant_a_cannot_read_tenant_b_private_data(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    _create_org_claim(client, admin_identity, "claim_org_b_private", "client-other-demo", source_id)

    _SESSIONS.clear()
    client_a_identity = _login(client, CLIENT)  # organization_id = client-demo
    resp = client.get("/truth/claims/claim_org_b_private", headers=_headers(client_a_identity))
    assert resp.status_code == 404  # concealed, not merely forbidden


def test_tenant_a_cannot_update_tenant_b_data(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    _create_org_claim(client, admin_identity, "claim_org_b_update", "client-other-demo", source_id)

    _SESSIONS.clear()
    client_a_identity = _login(client, CLIENT)
    resp = client.patch(
        "/truth/claims/claim_org_b_update",
        json={"claim_text": "tampered"},
        headers=_headers(client_a_identity),
    )
    assert resp.status_code == 404


def test_tenant_a_cannot_approve_tenant_b_data(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    _create_org_claim(client, admin_identity, "claim_org_b_approve", "client-other-demo", source_id)

    _SESSIONS.clear()
    # CLIENT_ADMIN in org A does not even have approve_public, but we also
    # prove the org check independently at the service layer (see
    # test_approval_permission_does_not_imply_global_cross_tenant_authority).
    client_a_identity = _login(client, CLIENT_ADMIN)
    resp = client.post(
        "/truth/claims/claim_org_b_approve/approve-public",
        json={"reason": "attempt"},
        headers=_headers(client_a_identity),
    )
    assert resp.status_code in (403, 404)


def test_tenant_a_cannot_infer_hidden_tenant_b_record_existence(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    _create_org_claim(client, admin_identity, "claim_org_b_exists", "client-other-demo", source_id)

    _SESSIONS.clear()
    client_a_identity = _login(client, CLIENT)
    real_record = client.get("/truth/claims/claim_org_b_exists", headers=_headers(client_a_identity))
    fake_record = client.get("/truth/claims/claim_does_not_exist_at_all", headers=_headers(client_a_identity))
    assert real_record.status_code == fake_record.status_code == 404


def test_global_authority_works_only_where_intended(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    _create_org_claim(client, admin_identity, "claim_global_visible_to_admin", "client-other-demo", source_id)
    resp = client.get("/truth/claims/claim_global_visible_to_admin", headers=_headers(admin_identity))
    assert resp.status_code == 200


def test_missing_tenant_context_fails_closed(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)

    class NoOrgActor:
        user_id = "no_org_actor"
        role = "client"
        organization_id = None

    with pytest.raises(truth_spine_service.TruthAuthorityError):
        truth_spine_service.create_source({"source_id": "src_no_org"}, NoOrgActor())


# =========================================================================
# Source-verification tests
# =========================================================================

def test_creator_cannot_self_verify_without_verification_permission(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_ca_no_verify", "title": "x", "uri": "local://x"}, headers=headers)
    resp = client.post(
        "/truth/sources/src_ca_no_verify/verify",
        json={"verification_status": "verified", "reason": "trying"},
        headers=headers,
    )
    assert resp.status_code == 403


def test_verification_requires_reason(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_needs_reason", "title": "x", "uri": "local://x"}, headers=headers)
    resp = client.post(
        "/truth/sources/src_needs_reason/verify",
        json={"verification_status": "verified", "reason": ""},
        headers=headers,
    )
    assert resp.status_code == 422


def test_verification_actor_is_server_derived(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_actor_derived", "title": "x", "uri": "local://x"}, headers=headers)
    resp = client.post(
        "/truth/sources/src_actor_derived/verify",
        json={"verification_status": "verified", "reason": "check actor", "verified_by": "someone-else-entirely"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["source"]["verified_by"] == "demo_shs_admin"


def test_verification_history_is_appended(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_history_check", "title": "x", "uri": "local://x"}, headers=headers)
    client.post(
        "/truth/sources/src_history_check/verify",
        json={"verification_status": "verified", "reason": "history check"},
        headers=headers,
    )
    events = truth_history_service.list_history_for_entity("src_history_check")
    assert any(e["event_type"] == "source.created" for e in events)
    assert any(e["event_type"] == "source.verified" for e in events)


def test_invalid_verification_status_rejected(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_bad_status", "title": "x", "uri": "local://x"}, headers=headers)
    resp = client.post(
        "/truth/sources/src_bad_status/verify",
        json={"verification_status": "not_a_real_status", "reason": "x"},
        headers=headers,
    )
    assert resp.status_code == 409


def test_request_body_verification_field_cannot_bypass_verify_endpoint(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)
    headers = _headers(identity)
    resp = client.post(
        "/truth/sources",
        json={"source_id": "src_cant_self_declare", "title": "x", "uri": "local://x", "verification_status": "verified"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["source"]["verification_status"] == "unverified"


# =========================================================================
# Claim tests
# =========================================================================

def test_claim_creation_assigns_server_derived_ownership(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)
    headers = _headers(identity)
    resp = client.post(
        "/truth/claims",
        json={"claim_id": "claim_owner_derived", "claim_text": "x", "organization_id": "someone-elses-org"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["claim"]["organization_id"] == "client-demo"
    assert resp.json()["claim"]["created_by"] == "demo_client"


def test_request_body_cannot_assign_approval_authority_on_create(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)
    headers = _headers(identity)
    resp = client.post(
        "/truth/claims",
        json={"claim_id": "claim_no_self_approve", "claim_text": "x", "public_approved": True, "verification_status": "verified"},
        headers=headers,
    )
    assert resp.status_code == 200
    claim = resp.json()["claim"]
    assert claim["public_approved"] is False
    assert claim["verification_status"] != "verified" or claim["verification_status"] == "missing_source"


def test_draft_claims_excluded_from_public_reads(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)
    headers = _headers(identity)
    client.post("/truth/claims", json={"claim_id": "claim_draft_hidden", "claim_text": "x"}, headers=headers)
    resp = client.get("/truth/public/claims/claim_draft_hidden")
    assert resp.status_code == 404
    public_list = client.get("/truth/public/claims").json()["claims"]
    assert not any(c["claim_id"] == "claim_draft_hidden" for c in public_list)


def test_generic_update_cannot_approve_claims(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)
    headers = _headers(identity)
    client.post("/truth/claims", json={"claim_id": "claim_update_no_approve", "claim_text": "x"}, headers=headers)
    resp = client.patch(
        "/truth/claims/claim_update_no_approve",
        json={"claim_text": "still no approval", "public_approved": True},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["claim"]["public_approved"] is False


def test_approved_claims_cannot_be_silently_overwritten(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_no_silent_overwrite", "claim_text": "original text", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    client.post("/truth/claims/claim_no_silent_overwrite/approve-public", json={"reason": "approve original"}, headers=headers)

    resp = client.patch(
        "/truth/claims/claim_no_silent_overwrite",
        json={"claim_text": "TAMPERED TEXT"},
        headers=headers,
    )
    assert resp.status_code == 200
    new_claim = resp.json()["claim"]
    # A new, unapproved version was created rather than the approved one
    # being mutated in place.
    assert new_claim["version"] == 2
    assert new_claim["public_approved"] is False

    versions = client.get("/truth/claims/claim_no_silent_overwrite/versions", headers=headers).json()["versions"]
    v1 = next(v for v in versions if v["version"] == 1)
    assert v1["claim_text"] == "original text"
    assert v1["public_approved"] is True
    assert v1["superseded_by"] == "claim_no_silent_overwrite@v2"


def test_substantive_edit_creates_new_unapproved_version(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_substantive_edit", "claim_text": "v1 text", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    resp = client.patch("/truth/claims/claim_substantive_edit", json={"claim_text": "v2 text"}, headers=headers)
    assert resp.json()["claim"]["version"] == 2
    assert resp.json()["claim"]["public_approved"] is False


def test_previous_approved_version_remains_available_to_privileged_readers(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_history_preserved", "claim_text": "v1", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    client.post("/truth/claims/claim_history_preserved/approve-public", json={"reason": "approve v1"}, headers=headers)
    client.patch("/truth/claims/claim_history_preserved", json={"claim_text": "v2"}, headers=headers)

    versions = client.get("/truth/claims/claim_history_preserved/versions", headers=headers).json()["versions"]
    assert len(versions) == 2
    assert versions[0]["claim_text"] == "v1"
    assert versions[0]["public_approved"] is True


# =========================================================================
# Approval tests
# =========================================================================

def test_anonymous_approval_401(isolated_storage):
    client = _client()
    resp = client.post("/truth/claims/whatever/approve-public", json={"reason": "x"})
    assert resp.status_code == 401


def test_authenticated_unauthorized_approval_403(isolated_storage):
    client = _client()
    identity = _login(client, CLIENT)
    resp = client.post("/truth/claims/whatever/approve-public", json={"reason": "x"}, headers=_headers(identity))
    assert resp.status_code == 403


def test_unverified_source_approval_rejected(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_unverified_for_claim", "title": "x", "uri": "local://x"}, headers=headers)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_unverified_source", "claim_text": "x", "source_ids": ["src_unverified_for_claim"], "trace_coverage": 90},
        headers=headers,
    )
    resp = client.post("/truth/claims/claim_unverified_source/approve-public", json={"reason": "attempt"}, headers=headers)
    assert resp.status_code == 409


def test_approval_without_reason_rejected(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, identity)
    headers = _headers(identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_no_reason", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    resp = client.post("/truth/claims/claim_no_reason/approve-public", json={"reason": ""}, headers=headers)
    assert resp.status_code == 422


def test_valid_approval_records_actor_and_history(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, identity)
    headers = _headers(identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_approval_history", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    resp = client.post("/truth/claims/claim_approval_history/approve-public", json={"reason": "verified via export"}, headers=headers)
    claim = resp.json()["claim"]
    assert claim["approved_by"] == "demo_shs_admin"
    assert claim["approval_reason"] == "verified via export"
    events = truth_history_service.list_history_for_entity("claim_approval_history")
    assert any(e["event_type"] == "claim.public_approved" and e["actor_id"] == "demo_shs_admin" for e in events)


def test_repeated_approval_behaves_safely(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, identity)
    headers = _headers(identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_repeat_approve", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    first = client.post("/truth/claims/claim_repeat_approve/approve-public", json={"reason": "first"}, headers=headers)
    second = client.post("/truth/claims/claim_repeat_approve/approve-public", json={"reason": "second"}, headers=headers)
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["claim"]["public_approved"] is True


def test_revocation_requires_separate_permission(isolated_storage):
    client = _client()
    admin_identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, admin_identity)
    headers_admin = _headers(admin_identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_revoke_perm", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers_admin,
    )
    client.post("/truth/claims/claim_revoke_perm/approve-public", json={"reason": "approve"}, headers=headers_admin)

    _SESSIONS.clear()
    client_identity = _login(client, CLIENT)
    resp = client.post("/truth/claims/claim_revoke_perm/revoke-public", json={"reason": "attempt"}, headers=_headers(client_identity))
    assert resp.status_code == 403


def test_revocation_records_actor_and_reason(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, identity)
    headers = _headers(identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_revoke_records", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    client.post("/truth/claims/claim_revoke_records/approve-public", json={"reason": "approve"}, headers=headers)
    resp = client.post("/truth/claims/claim_revoke_records/revoke-public", json={"reason": "found an error"}, headers=headers)
    assert resp.json()["claim"]["public_approved"] is False
    events = truth_history_service.list_history_for_entity("claim_revoke_records")
    assert any(e["event_type"] == "claim.public_approval_revoked" and e["reason"] == "found an error" for e in events)


def test_revoked_claim_disappears_from_public_results(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, identity)
    headers = _headers(identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_revoke_public_visibility", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    client.post("/truth/claims/claim_revoke_public_visibility/approve-public", json={"reason": "approve"}, headers=headers)
    assert client.get("/truth/public/claims/claim_revoke_public_visibility").status_code == 200
    client.post("/truth/claims/claim_revoke_public_visibility/revoke-public", json={"reason": "revoke"}, headers=headers)
    assert client.get("/truth/public/claims/claim_revoke_public_visibility").status_code == 404


# =========================================================================
# Public-read tests
# =========================================================================

def test_only_safely_approved_current_versions_appear_publicly(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, identity)
    headers = _headers(identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_public_visible", "claim_text": "public fact", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    client.post("/truth/claims/claim_public_visible/approve-public", json={"reason": "approve"}, headers=headers)
    resp = client.get("/truth/public/claims/claim_public_visible")
    assert resp.status_code == 200
    assert resp.json()["claim"]["claim_id"] == "claim_public_visible"


def test_claims_from_unverified_sources_do_not_appear_publicly(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_still_unverified", "title": "x", "uri": "local://x"}, headers=headers)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_unverified_src_hidden", "claim_text": "x", "source_ids": ["src_still_unverified"], "trace_coverage": 90},
        headers=headers,
    )
    # Cannot even approve (would 409), so it can never appear publicly:
    resp = client.get("/truth/public/claims/claim_unverified_src_hidden")
    assert resp.status_code == 404


def test_private_source_details_do_not_appear_in_public_package(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    source_id = _create_verified_source(client, identity, source_id="src_private_detail")
    headers = _headers(identity)
    client.post(
        "/truth/claims",
        json={"claim_id": "claim_public_package", "claim_text": "x", "source_ids": [source_id], "trace_coverage": 90},
        headers=headers,
    )
    client.post("/truth/claims/claim_public_package/approve-public", json={"reason": "approve"}, headers=headers)
    resp = client.get("/truth/public/package/claim_public_package")
    assert resp.status_code == 200
    package = resp.json()["package"]
    for source in package["sources"]:
        assert "uri" not in source
        assert "verified_by" not in source


def test_missing_or_malformed_visibility_data_fails_closed(isolated_storage):
    assert truth_spine_service.is_publicly_visible({}) is False
    assert truth_spine_service.is_publicly_visible({"public_approved": True}) is False
    assert truth_spine_service.is_publicly_visible(
        {"public_approved": True, "verification_status": "verified", "ownership_status": "legacy_unscoped"}
    ) is False
    assert truth_spine_service.is_publicly_visible(None) is False


# =========================================================================
# History tests
# =========================================================================

def test_history_entries_cannot_be_updated_through_public_service_methods(isolated_storage):
    import inspect

    members = [name for name, _ in inspect.getmembers(truth_history_service, inspect.isfunction)]
    assert not any(name.startswith("update_") or name.startswith("delete_") for name in members)


def test_ordering_is_deterministic(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    headers = _headers(identity)
    client.post("/truth/sources", json={"source_id": "src_order_check", "title": "x", "uri": "local://x"}, headers=headers)
    client.post(
        "/truth/sources/src_order_check/verify",
        json={"verification_status": "verified", "reason": "order check"},
        headers=headers,
    )
    events = truth_history_service.list_history_for_entity("src_order_check")
    assert [e["event_type"] for e in events] == ["source.created", "source.verified"]


# =========================================================================
# Regression sanity (existing behavior for authorized callers still works)
# =========================================================================

def test_authorized_internal_read_still_works(isolated_storage):
    client = _client()
    identity = _login(client, SHS_ADMIN)
    resp = client.get("/truth/claims", headers=_headers(identity))
    assert resp.status_code == 200


def test_router_mounts_correctly(isolated_storage):
    paths = {route.path for route in app.router.routes if getattr(route, "path", "").startswith("/truth")}
    assert "/truth/public/claims" in paths
    assert "/truth/claims/{claim_id}/approve-public" in paths
