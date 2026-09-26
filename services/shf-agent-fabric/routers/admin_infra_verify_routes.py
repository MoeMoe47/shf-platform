from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

from fastapi import APIRouter, Depends

from fabric.admin_auth import require_admin_key
from fabric.command.verification_results import record_verification_result

# Privileged verification ACTION. The Command Center reads the recorded result
# through /api/v1-command-center/agent-fabric/infrastructure instead.
router = APIRouter(prefix="/admin/infra", tags=["admin", "infra"], dependencies=[Depends(require_admin_key)])


def _repo_root_from_here() -> Path:
    # routers/admin_infra_verify_routes.py -> routers -> services/shf-agent-fabric
    return Path(__file__).resolve().parents[1]


def _tail(s: str, n: int = 1400) -> str:
    s = s or ""
    if len(s) <= n:
        return s
    return s[-n:]


def _run(cmd: List[str], *, cwd: Path) -> Tuple[bool, str, str]:
    # Scripts import `fabric.*`, so the service root must be importable.
    env = {**os.environ, "PYTHONPATH": os.pathsep.join(filter(None, [str(cwd), os.environ.get("PYTHONPATH", "")]))}
    p = subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        capture_output=True,
        env=env,
    )
    ok = (p.returncode == 0)
    return ok, (p.stdout or ""), (p.stderr or "")


@router.get("/verify")
def admin_infra_verify() -> Dict[str, Any]:
    """
    Stable contract v1:
      {
        "ok": bool,
        "contract": "v1",
        "ts": <unix seconds>,
        "checks": [
          {"name": "...", "ok": bool, "stdout_tail": "...", "stderr_tail": "..."}
        ]
      }
    """
    repo_root = _repo_root_from_here()
    checks: List[Dict[str, Any]] = []

    # 1) Registry contract
    ok, out, err = _run(
        [sys.executable, "scripts/verify_registry_contract.py"],
        cwd=repo_root,
    )
    checks.append(
        {
            "name": "registry_contract",
            "ok": ok,
            "stdout_tail": _tail(out),
            "stderr_tail": _tail(err),
        }
    )

    # 2) Runtime enforcement lock
    ok, out, err = _run(
        [sys.executable, "scripts/verify_runtime_enforcement_lock.py"],
        cwd=repo_root,
    )
    checks.append(
        {
            "name": "runtime_enforcement_lock",
            "ok": ok,
            "stdout_tail": _tail(out),
            "stderr_tail": _tail(err),
        }
    )

    # 3) Gate G (in-process)
    gate_ok = True
    gate_err = ""
    try:
        from fabric.startup_verify import verify_compliance_gate_g_or_die

        verify_compliance_gate_g_or_die()
    except Exception as e:
        gate_ok = False
        gate_err = f"{type(e).__name__}: {e}"

    checks.append(
        {
            "name": "gate_g_startup",
            "ok": gate_ok,
            "stdout_tail": "",
            "stderr_tail": _tail(gate_err),
        }
    )

    # 4) Watchtower snapshot store usability (write + read + hash validation)
    ok, out, err = _run(
        [sys.executable, "scripts/verify_watchtower_snapshot_store.py"],
        cwd=repo_root,
    )
    checks.append(
        {
            "name": "watchtower_snapshot_store_usability",
            "ok": ok,
            "stdout_tail": _tail(out),
            "stderr_tail": _tail(err),
        }
    )

    
    # 4) Watchtower attestation (HMAC) verification (contract-safe: check item only)
    att_ok, att_out, att_err = _run(
        [sys.executable, "scripts/verify_watchtower_attestation.py"],
        cwd=repo_root,
    )
    checks.append(
        {
            "name": "watchtower_attestation",
            "ok": att_ok,
            "stdout_tail": _tail(att_out),
            "stderr_tail": _tail(att_err),
        }
    )


    overall_ok = all(c.get("ok") is True for c in checks)

    record_verification_result(
        "infrastructure",
        [{"name": c["name"], "ok": c.get("ok"), "reason_code": "CHECK_FAILED"} for c in checks],
        trigger="admin_infra_verify",
    )

    return {
        "ok": overall_ok,
        "contract": "v1",
        "ts": int(time.time()),
        "checks": checks,
    }
