from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
import subprocess
import sys

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from fabric.startup_verify import verify_compliance_gate_g_or_die

router = APIRouter(tags=["health"])


def _repo_root() -> Path:
    # routers/health_routes.py -> routers/ -> services/shf-agent-fabric/
    return Path(__file__).resolve().parents[1]


def _tail(s: str, n: int = 1200) -> str:
    s = s or ""
    return s if len(s) <= n else s[-n:]


def _run_script(candidates: List[Path]) -> Dict[str, Any]:
    """
    Run the first existing script among candidates.
    Returns {ok, stdout_tail, stderr_tail, ran}.
    """
    for p in candidates:
        if p.exists() and p.is_file():
            proc = subprocess.run(
                [sys.executable, str(p)],
                cwd=str(_repo_root()),
                capture_output=True,
                text=True,
            )
            return {
                "ok": proc.returncode == 0,
                "ran": p.name,
                "error": None if proc.returncode == 0 else "health_check_failed",
            }
    return {
        "ok": False,
        "ran": None,
        "error": "health_check_script_missing",
    }


def _check_gate_g() -> Dict[str, Any]:
    try:
        verify_compliance_gate_g_or_die()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}"}


def _check_registry_contract() -> Dict[str, Any]:
    rr = _repo_root()
    scripts = rr / "scripts"
    candidates = [
        scripts / "verify_registry_contract.py",
        scripts / "check_registry_contract.py",
        scripts / "registry_contract_verify.py",
        scripts / "registry_contract_check.py",
    ]
    return _run_script(candidates)


def _check_runtime_enforcement_lock() -> Dict[str, Any]:
    rr = _repo_root()
    scripts = rr / "scripts"
    candidates = [
        scripts / "verify_runtime_enforcement_lock.py",
        scripts / "check_runtime_enforcement_lock.py",
        scripts / "runtime_enforcement_lock_verify.py",
        scripts / "runtime_enforcement_lock_check.py",
    ]
    return _run_script(candidates)


def _core_checks() -> Tuple[bool, Dict[str, Any]]:
    checks: Dict[str, Any] = {}
    checks["gate_g_startup"] = _check_gate_g()
    checks["registry_contract"] = _check_registry_contract()
    checks["runtime_enforcement_lock"] = _check_runtime_enforcement_lock()

    ok = all(bool(v.get("ok")) for v in checks.values())
    return ok, checks


@router.get("/health/live")
def health_live() -> Dict[str, Any]:
    # Liveness: process is up.
    return {"ok": True, "status": "live"}


@router.get("/health/ready")
def health_ready() -> JSONResponse:
    # Readiness: must pass core invariants.
    ok, checks = _core_checks()
    if ok:
        return JSONResponse(status_code=200, content={"ok": True, "status": "ready", "checks": checks})
    return JSONResponse(status_code=503, content={"ok": False, "status": "not_ready", "checks": checks})


@router.get("/health/degraded")
def health_degraded() -> Dict[str, Any]:
    """
    Degraded: soft failures (still responsive), but warns when invariants/tools drift.
    Always returns 200 (ok=True), and sets degraded True/False.
    """
    _, checks = _core_checks()
    warnings: List[str] = []

    # If any core check fails, we consider it degraded (but still "ok" from an API perspective).
    for k, v in checks.items():
        if not bool(v.get("ok")):
            err = v.get("error") or v.get("stderr_tail") or "unknown failure"
            warnings.append(f"{k}: {err}")

    if warnings:
        return {"ok": True, "status": "degraded", "degraded": True, "checks": checks, "warnings": warnings}

    return {"ok": True, "status": "healthy", "degraded": False, "checks": checks, "warnings": []}
