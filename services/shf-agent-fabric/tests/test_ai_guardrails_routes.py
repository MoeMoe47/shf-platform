from __future__ import annotations

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _check_output(client: TestClient, **payload):
    response = client.post("/ai-guardrails/check-output", json=payload)
    assert response.status_code == 200, response.text
    return response.json()["decision"]


def test_ai_guardrails_health_returns_ok():
    client = _client()
    response = client.get("/ai-guardrails/health")
    assert response.status_code == 200, response.text
    assert response.json()["ok"] is True


def test_ai_guardrails_safe_draft_allowed():
    client = _client()
    decision = _check_output(
        client,
        app_id="shs",
        agent_id="agent_test_safe",
        user_id="tests",
        output_type="draft",
        requested_action="draft",
        output_text="Draft internal summary for operator review.",
        claim_ids=[],
    )
    assert decision["decision"] in {"allowed", "allowed_with_limits"}
    assert decision["truth_required"] is False


def test_ai_guardrails_verified_language_requires_truth_review_without_claims():
    client = _client()
    decision = _check_output(
        client,
        app_id="shs",
        agent_id="agent_test_truth",
        user_id="tests",
        output_type="summary",
        requested_action="draft",
        output_text="This is a verified and official claim.",
        claim_ids=[],
    )
    assert decision["decision"] == "requires_truth_review"
    assert decision["truth_required"] is True


def test_ai_guardrails_public_publish_without_public_truth_is_gated():
    client = _client()
    decision = _check_output(
        client,
        app_id="shs",
        agent_id="agent_test_publish",
        user_id="tests",
        output_type="public_copy",
        requested_action="publish public page",
        output_text="Publish this public-approved program result.",
        claim_ids=[],
    )
    assert decision["decision"] in {"blocked", "requires_truth_review"}
    assert decision["truth_required"] is True
    assert "public_publish" in decision["blocked_actions"]


def test_ai_guardrails_ruling_and_execute_require_infrastructure_layers():
    client = _client()
    ruling_decision = _check_output(
        client,
        app_id="shs",
        agent_id="agent_test_oracle",
        user_id="tests",
        output_type="decision",
        requested_action="decide and rule",
        output_text="The evidence supports this final ruling.",
        claim_ids=[],
    )
    assert ruling_decision["decision"] == "requires_oracle_review"
    assert ruling_decision["oracle_required"] is True

    execute_decision = _check_output(
        client,
        app_id="shs",
        agent_id="agent_test_alignment",
        user_id="tests",
        output_type="action",
        requested_action="execute intervention",
        output_text="Execute this action now.",
        claim_ids=[],
    )
    assert execute_decision["decision"] == "requires_alignment_approval"
    assert execute_decision["alignment_required"] is True


def test_ai_guardrails_decisions_list_includes_created_decision():
    client = _client()
    decision = _check_output(
        client,
        app_id="shs",
        agent_id="agent_test_list",
        user_id="tests",
        output_type="draft",
        requested_action="draft",
        output_text="Another internal draft.",
        claim_ids=[],
    )
    response = client.get("/ai-guardrails/decisions")
    assert response.status_code == 200, response.text
    assert any(item["decision_id"] == decision["decision_id"] for item in response.json()["decisions"])
