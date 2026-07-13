import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs" / "SHS_CRITICAL_STATE_PERSISTENCE_MIGRATION_V1.json"


def load_doc():
    return json.loads(DOC.read_text(encoding="utf-8"))


def test_six_primary_domains_are_migrated_and_repository_primary():
    doc = load_doc()
    domains = {item["domain"]: item for item in doc["migration_domains"]}
    assert set(domains) == {
        "orchestrator",
        "command_bus",
        "job_scheduler",
        "notification_fabric",
        "tracking_intelligence",
        "executive_command_center",
    }
    for domain in domains.values():
        assert domain["migration_stage"] == "repository_primary_with_fallback"
        assert domain["backup"]["status"] == "PASS"
        assert domain["verification"]["status"] == "PASS"
        assert domain["rollback"]["preview_status"] == "PASS"
        assert domain["dangerous_flags_enabled"] == 0


def test_legacy_inventory_and_deferred_domains_are_explicit():
    doc = load_doc()
    assert len(doc["legacy_storage_inventory"]) >= 10
    assert {item["domain"] for item in doc["deferred_domains"]} == {
        "event_bus",
        "system_registry",
        "agent_operational_records",
        "direct_connect_proof_records",
        "reports_state",
        "production_automation_v2_state",
    }
    assert all(item["status"] == "deferred_owner_review" for item in doc["deferred_domains"])


def test_safety_boundaries_and_database_adapter_remain_disabled():
    doc = load_doc()
    assert doc["dangerous_flags"]["enabled_count"] == 0
    assert doc["shs_shf_boundary"]["result"] == "PASS"
    assert doc["direct_connect_posture"]["result"] == "PASS"
    assert doc["future_database_adapter_path"]["database_adapter_enabled"] is False
    assert doc["compatibility_modes"]["legacy_keys_deleted"] is False
    assert doc["compatibility_modes"]["permanent_dual_write"] is False


def test_migration_scenario_coverage_is_documented():
    tests = load_doc()["tests"]
    required = {
        "empty_legacy_state",
        "valid_legacy_records",
        "duplicate_records",
        "unsafe_fields",
        "interrupted_migration",
        "verification_mismatch",
        "rollback_preview",
        "confirmed_rollback",
        "compatibility_fallback",
        "repository_primary_mode",
        "no_autonomous_execution",
        "no_external_effects",
        "repeated_migration",
        "version_history",
        "transaction_history",
    }
    assert required <= set(tests["scenario_results"])
    assert all(status == "PASS" for status in tests["scenario_results"].values())


def test_validator_passes():
    result = subprocess.run(
        ["python3", "scripts/check_shs_critical_state_persistence_migration.py"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "PASS: SHS Critical-State Persistence Migration V1 validation OK" in result.stdout
