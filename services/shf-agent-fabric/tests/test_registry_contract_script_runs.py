from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def _repo_root() -> Path:
    # tests/ -> shf-agent-fabric/ -> services/ -> repo root
    here = Path(__file__).resolve()
    # .../services/shf-agent-fabric/tests/test_*.py
    # parents[0]=tests, [1]=shf-agent-fabric, [2]=services, [3]=repo root
    return here.parents[3]


def test_verify_registry_contract_script_runs_ok():
    root = _repo_root()
    script = root / "services" / "shf-agent-fabric" / "scripts" / "verify_registry_contract.py"
    assert script.exists(), f"missing script: {script}"

    cmd = [sys.executable, str(script)]
    p = subprocess.run(cmd, cwd=str(root), capture_output=True, text=True)
    assert p.returncode == 0, (
        "registry contract failed:\n"
        f"STDOUT:\n{p.stdout}\n"
        f"STDERR:\n{p.stderr}"
    )
