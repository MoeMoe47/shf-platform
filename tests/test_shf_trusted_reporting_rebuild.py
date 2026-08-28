from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "docs" / "SHF_TRUSTED_REPORTING_REBUILD_REGISTRY.v1.json"
CHECKER = ROOT / "scripts" / "check_shf_trusted_reporting_rebuild.py"


def test_rebuild_registry_checker_passes():
    result = subprocess.run([sys.executable, str(CHECKER)], cwd=ROOT, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stdout + result.stderr
    payload = json.loads(result.stdout)
    assert payload["ok"] is True
    assert payload["entry_count"] >= 1


def test_rebuild_registry_rejects_duplicate_ids_and_unsafe_delete(tmp_path):
    document = json.loads(REGISTRY.read_text(encoding="utf-8"))
    document["entries"] = [document["entries"][0], {**document["entries"][0], "category": "DELETE", "status": "SAFE_TO_DELETE", "replacement": None, "delete_eligibility": "not_applicable"}]
    candidate = tmp_path / "invalid.json"
    candidate.write_text(json.dumps(document), encoding="utf-8")
    result = subprocess.run([sys.executable, str(CHECKER), "--registry", str(candidate)], cwd=ROOT, capture_output=True, text=True, check=False)
    assert result.returncode == 1
    errors = json.loads(result.stdout)["errors"]
    assert any(error.startswith("duplicate_id:") for error in errors)
    assert any(error.endswith("_delete_gate_required") for error in errors)
