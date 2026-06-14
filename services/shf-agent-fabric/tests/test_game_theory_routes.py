from __future__ import annotations

import warnings

from fastapi.testclient import TestClient

from main import app  # type: ignore


def _client() -> TestClient:
    return TestClient(app)


def _create_scenario(client: TestClient, scenario_id: str, **overrides):
    payload = {
        "scenario_id": scenario_id,
        "scenario_type": "funding_loss",
        "title": f"Scenario {scenario_id}",
        "description": "Test strategic scenario.",
        "app_id": "shs",
        "program_id": "game_theory_tests",
        "client_id": "internal",
        "stakeholder_ids": ["funder", "partner"],
        "claim_ids": [],
        "oracle_case_ids": [],
        "severity": "medium",
        "time_horizon": "short_term",
        **overrides,
    }
    response = client.post("/game-theory/scenarios", json=payload)
    assert response.status_code == 200, response.text
    return response.json()["scenario"]


def _analyze(client: TestClient, scenario_id: str):
    response = client.post(f"/game-theory/scenarios/{scenario_id}/analyze")
    assert response.status_code == 200, response.text
    return response.json()["analysis"]


def test_game_theory_health_and_openapi_routes_exist():
    client = _client()
    health = client.get("/game-theory/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = app.openapi().get("paths", {})
    for route in (
        "/game-theory/health",
        "/game-theory/scenarios",
        "/game-theory/scenarios/{scenario_id}",
        "/game-theory/scenarios/{scenario_id}/analyze",
        "/game-theory/analyses",
        "/game-theory/analyses/{analysis_id}",
        "/game-theory/scenarios/{scenario_id}/analysis",
        "/game-theory/strategy-playbook",
        "/game-theory/audit-feed",
    ):
        assert route in paths


def test_game_theory_create_scenario_works():
    client = _client()
    scenario = _create_scenario(client, "gt_test_create")
    assert scenario["scenario_id"] == "gt_test_create"
    assert scenario["scenario_type"] == "funding_loss"

    response = client.get("/game-theory/scenarios/gt_test_create")
    assert response.status_code == 200, response.text
    assert response.json()["scenario"]["scenario_id"] == "gt_test_create"


def test_game_theory_low_severity_has_lower_risk_than_critical():
    client = _client()
    _create_scenario(client, "gt_test_low", scenario_type="custom", severity="low")
    _create_scenario(client, "gt_test_critical", scenario_type="custom", severity="critical")
    low = _analyze(client, "gt_test_low")
    critical = _analyze(client, "gt_test_critical")
    assert low["strategic_risk_score"] < critical["strategic_risk_score"]


def test_game_theory_funding_loss_increases_risk():
    client = _client()
    _create_scenario(client, "gt_test_loss", scenario_type="funding_loss", severity="medium")
    _create_scenario(client, "gt_test_custom", scenario_type="custom", severity="medium")
    loss = _analyze(client, "gt_test_loss")
    custom = _analyze(client, "gt_test_custom")
    assert loss["strategic_risk_score"] > custom["strategic_risk_score"]
    assert loss["funding_delta"] < 0


def test_game_theory_funding_gain_increases_cooperation_funding_and_adoption():
    client = _client()
    _create_scenario(client, "gt_test_gain", scenario_type="funding_gain", severity="medium")
    gain = _analyze(client, "gt_test_gain")
    assert gain["cooperation_score"] > 50
    assert gain["funding_delta"] > 0
    assert gain["adoption_delta"] > 0


def test_game_theory_analyses_list_and_scenario_analysis_include_created_analysis():
    client = _client()
    _create_scenario(client, "gt_test_list", scenario_type="partner_gain", severity="low")
    analysis = _analyze(client, "gt_test_list")

    analyses = client.get("/game-theory/analyses")
    assert analyses.status_code == 200, analyses.text
    assert any(item["analysis_id"] == analysis["analysis_id"] for item in analyses.json()["analyses"])

    scenario_analysis = client.get("/game-theory/scenarios/gt_test_list/analysis")
    assert scenario_analysis.status_code == 200, scenario_analysis.text
    assert scenario_analysis.json()["analysis"]["analysis_id"] == analysis["analysis_id"]


def test_game_theory_unknown_scenario_returns_404():
    client = _client()
    response = client.get("/game-theory/scenarios/gt_missing")
    assert response.status_code == 404

    analysis_response = client.post("/game-theory/scenarios/gt_missing/analyze")
    assert analysis_response.status_code == 404


def test_game_theory_strategy_playbook_returns_entries():
    client = _client()
    response = client.get("/game-theory/strategy-playbook")
    assert response.status_code == 200, response.text
    assert response.json()["ok"] is True
    assert len(response.json()["entries"]) >= 3


def test_game_theory_no_duplicate_route_prefix_exists():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        paths = list(app.openapi().get("paths", {}).keys())
    game_theory_paths = [path for path in paths if path.startswith("/game-theory/")]
    assert game_theory_paths
    assert not any(path.startswith("/gametheory/") or path.startswith("/game_theory/") for path in paths)

