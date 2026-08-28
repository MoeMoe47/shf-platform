import importlib.util
from pathlib import Path

_SCRIPT = Path(__file__).resolve().parents[3] / "scripts" / "check_shf_reporting_census.py"
_SPEC = importlib.util.spec_from_file_location("shf_reporting_census_checker", _SCRIPT)
_MODULE = importlib.util.module_from_spec(_SPEC)
assert _SPEC and _SPEC.loader
_SPEC.loader.exec_module(_MODULE)
validate = _MODULE.validate

def test_reporting_census_has_no_unresolved_surfaces_and_valid_references():
    result = validate()
    assert result["surface_count"] == 30
    assert sum(result["classification_counts"].values()) == 30
    assert result["classification_counts"].get("BLOCKED", 0) == 0

def test_phase9_wave1_targeted_surfaces_have_safe_dispositions():
    registry = _MODULE._load(_MODULE.SURFACE_PATH)
    statuses = registry["wave1_safety_status"]
    assert len(statuses) == 11
    assert all(status in {"SAFE", "SAFE_DEMO", "SUPPRESSED", "DISABLED"} for status in statuses.values())
