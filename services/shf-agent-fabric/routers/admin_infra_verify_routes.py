from __future__ import annotations

from fastapi import APIRouter, Response, status

router = APIRouter(prefix="/admin/infra", tags=["admin-infra"])

@router.get("/verify")
def admin_infra_verify():
    """
    Infra verification endpoint.

    Runs (in-process, no server needed):
      - Registry contract verifier
      - Runtime enforcement lock verifier
      - Gate G startup verifier

    Returns JSON with per-check status + details.
    """
    results: dict = {"ok": True, "checks": {}}

    # 1) Registry contract
    try:
        import subprocess
        import sys
        p = subprocess.run(
            [sys.executable, "services/shf-agent-fabric/scripts/verify_registry_contract.py"],
            capture_output=True,
            text=True,
        )
        results["checks"]["registry_contract"] = {
            "ok": p.returncode == 0,
            "stdout_tail": (p.stdout or "")[-2000:],
            "stderr_tail": (p.stderr or "")[-2000:],
        }
        if p.returncode != 0:
            results["ok"] = False
    except Exception as e:
        results["checks"]["registry_contract"] = {"ok": False, "error": repr(e)}
        results["ok"] = False

    # 2) Runtime enforcement lock
    try:
        import subprocess
        import sys
        p = subprocess.run(
            [sys.executable, "services/shf-agent-fabric/scripts/verify_runtime_enforcement_lock.py"],
            capture_output=True,
            text=True,
        )
        results["checks"]["runtime_enforcement_lock"] = {
            "ok": p.returncode == 0,
            "stdout_tail": (p.stdout or "")[-2000:],
            "stderr_tail": (p.stderr or "")[-2000:],
        }
        if p.returncode != 0:
            results["ok"] = False
    except Exception as e:
        results["checks"]["runtime_enforcement_lock"] = {"ok": False, "error": repr(e)}
        results["ok"] = False

    # 3) Gate G startup verifier
    try:
        # Ensure import path works
        from fabric.startup_verify import verify_compliance_gate_g_or_die
        verify_compliance_gate_g_or_die()
        results["checks"]["gate_g_startup"] = {"ok": True}
    except Exception as e:
        results["checks"]["gate_g_startup"] = {"ok": False, "error": repr(e)}
        results["ok"] = False

    if not results["ok"]:
        return Response(
            content=str(results),
            media_type="application/json",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return results
