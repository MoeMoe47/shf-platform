import os
import subprocess
import sys

def test_gate_g_startup_verifier_passes():
    env = dict(os.environ)
    env["PYTHONPATH"] = "services/shf-agent-fabric"

    code = r"""
from fabric.startup_verify import verify_compliance_gate_g_or_die
verify_compliance_gate_g_or_die()
print("OK")
"""
    p = subprocess.run([sys.executable, "-c", code], env=env, capture_output=True, text=True)
    assert p.returncode == 0, f"Gate G verifier failed:\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}"
