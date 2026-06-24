from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


REQUIRED_AGENT_IDS = {
    "shs_sales_agent",
    "shs_project_agent",
    "shs_library_agent",
    "shs_qa_agent",
    "shs_clientops_agent",
    "shs_report_agent",
    "shs_governance_agent",
    "shs_executive_agent",
}


def _client() -> TestClient:
    return TestClient(app)


def test_agent_contract_bridge_openapi_routes_exist_and_get_only():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    expected = (
        "/agent-contract-bridge/health",
        "/agent-contract-bridge/summary",
        "/agent-contract-bridge/agents",
        "/agent-contract-bridge/alignment",
    )
    for route in expected:
        assert route in paths
        assert set(paths[route].keys()) == {"get"}


def test_agent_contract_bridge_health_summary_alignment_are_read_only():
    client = _client()
    health = client.get("/agent-contract-bridge/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True
    assert health.json()["execution_enabled"] is False

    summary = client.get("/agent-contract-bridge/summary").json()
    assert summary["ok"] is True
    assert summary["layer"] == "agent_contract_bridge"
    assert summary["canonical_agent_count"] == 8
    assert set(summary["matched_agents"]) == REQUIRED_AGENT_IDS
    assert summary["missing_backend_agents"] == []
    assert summary["dangerous_flags_enabled"] == []
    assert summary["execution_enabled"] is False
    assert summary["contracts_readable"] is True
    assert summary["alignment_status"] in {"aligned", "needs_review"}

    alignment = client.get("/agent-contract-bridge/alignment").json()
    assert alignment["execution_enabled"] is False
    assert alignment["dangerous_flags_enabled"] == []
    assert set(alignment["matched_agents"]) == REQUIRED_AGENT_IDS


def test_agent_contract_bridge_agents_contains_required_shs_contracts():
    client = _client()
    result = client.get("/agent-contract-bridge/agents").json()
    assert result["ok"] is True
    assert result["execution_enabled"] is False
    agent_ids = {
        agent.get("agent_id") or agent.get("agentId")
        for agent in result["agents"]
    }
    assert REQUIRED_AGENT_IDS.issubset(agent_ids)
