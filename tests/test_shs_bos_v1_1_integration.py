import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "docs" / "SHS_BOS_V1_1_FULL_INTEGRATION_AUDIT.json"


def load_report():
    return json.loads(REPORT.read_text(encoding="utf-8"))


def test_integration_report_has_complete_matrix_and_ready_decision():
    report = load_report()
    matrix = report["integration_matrix"]
    assert report["final_decision"] == "V1_1_INTEGRATION_READY_WITH_OWNER_REVIEW"
    assert report["v1_1_integration_ready"] is True
    assert len(matrix) == 38
    assert {item["integration_id"] for item in matrix} == {f"INT-{i:02d}" for i in range(1, 39)}
    assert report["integration_summary"]["missing"] == 0
    assert report["integration_summary"]["blocked"] == 0
    assert not report["v1_1_blockers"]


def test_controlled_client_operations_scenario_remains_local_and_safe():
    scenario = load_report()["end_to_end_scenario"]
    assert scenario["name"] == "SHS BOS Controlled Client Operations Integration Scenario"
    assert scenario["result"] == "PASS"
    assert scenario["local_only"] is True
    assert scenario["production_mutation"] is False
    assert scenario["public_approval_mutation"] is False
    assert scenario["shf_impact_data_mutation"] is False
    assert scenario["external_delivery"] is False
    assert scenario["autonomous_execution"] is False
    assert len(scenario["steps"]) == 15
    assert all(step["status"] == "PASS" for step in scenario["steps"])


def test_route_identity_boundary_is_admin_only_for_internal_routes():
    report = load_report()
    routes = report["route_identity_boundary"]["routes"]
    assert len(routes) == 12
    for item in routes:
        assert item["shs_admin"] == "allowed"
        assert item["client_admin"] == "blocked_or_redirected"
        assert item["public"] == "blocked_or_redirected"


def test_safety_and_shs_shf_boundaries_hold():
    report = load_report()
    assert report["dangerous_flags"]["enabled_count"] == 0
    assert report["dangerous_flags"]["items"] == []
    assert report["shs_shf_boundary"]["result"] == "PASS"
    assert report["manual_governance_review"]["summary"]["failed"] == 0
    assert report["manual_governance_review"]["summary"]["blocked_by_environment"] == 0
    assert report["direct_connect_posture"]["result"] == "PASS"


def test_precommit_reliability_guards_are_covered():
    report = load_report()
    precommit = report["precommit_reliability"]
    assert precommit["result"] == "PASS"
    assert "shf-ledger-verify" in precommit["hooks"]
    assert "shf-registry-guard" in precommit["hooks"]
    assert precommit["server_restart_from_precommit"] is False
    assert precommit["http_verification_from_precommit"] is False


def test_full_integration_validator_passes():
    result = subprocess.run(
        ["python3", "scripts/check_shs_bos_v1_1_full_integration.py"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "PASS: SHS BOS V1.1 full integration audit validation OK" in result.stdout
