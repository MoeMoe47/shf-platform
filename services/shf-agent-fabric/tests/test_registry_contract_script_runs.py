import subprocess
import sys

def test_verify_registry_contract_script_runs_ok():
    cmd = [sys.executable, "services/shf-agent-fabric/scripts/verify_registry_contract.py"]
    p = subprocess.run(cmd, capture_output=True, text=True)
    assert p.returncode == 0, f"registry contract failed:\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}"
