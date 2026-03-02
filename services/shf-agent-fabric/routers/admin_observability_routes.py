from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse

# Core invariants (already enforced at import/startup elsewhere, but we probe again here)
from fabric.startup_verify import verify_compliance_gate_g_or_die

# Reuse the same scripts/logic as health core checks
from routers.health_routes import _core_checks  # type: ignore

# Watchtower probes (should exist because tests import them)
from fabric.watchtower.alerts import build_watchtower_alerts  # type: ignore
from fabric.watchtower.aggregator import compute_watchtower_rows  # type: ignore

# LOO registry/meta checks
from fabric.loo.adapter_registry import PROGRAM_ADAPTERS, PROGRAM_ADAPTER_META  # type: ignore
from fabric.loo.adapter_meta_parity import assert_adapter_meta_parity  # type: ignore


router = APIRouter(prefix="/admin/observability", tags=["admin", "observability"])

CONTRACT_VERSION = "v1"


def _probe_watchtower() -> Dict[str, Any]:
    """
    "Push Watchtower deeper" begins with a deterministic compute probe:
    - build_watchtower_alerts()
    - compute_watchtower_rows()
    We don't care about content here, only that compute succeeds and returns the expected types.
    """
    try:
        alerts = build_watchtower_alerts()
        rows = compute_watchtower_rows()
        return {
            "ok": True,
            "alerts_type": type(alerts).__name__,
            "rows_type": type(rows).__name__,
            "alerts_len": (len(alerts) if hasattr(alerts, "__len__") else None),
            "rows_len": (len(rows) if hasattr(rows, "__len__") else None),
        }
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}


def _probe_loo_meta_parity() -> Dict[str, Any]:
    try:
        assert_adapter_meta_parity(PROGRAM_ADAPTERS, PROGRAM_ADAPTER_META)
        return {"ok": True, "adapter_count": len(PROGRAM_ADAPTERS), "meta_count": len(PROGRAM_ADAPTER_META)}
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}


@router.get("/verify")
def verify_observability() -> JSONResponse:
    """
    Stable Observability Contract (v1)
    - ok/status/checks ALWAYS present
    - checks is a dict of named probes
    """
    # Gate G is locked to hard-pass at import time, but probe again.
    try:
        verify_compliance_gate_g_or_die()
        gate_ok = True
    except Exception:
        gate_ok = False

    core_ok, core_checks = _core_checks()
    wt = _probe_watchtower()
    loo = _probe_loo_meta_parity()

    checks: Dict[str, Any] = {
        "contract": {"ok": True, "version": CONTRACT_VERSION},
        "gate_g_probe": {"ok": gate_ok},
        "core": {"ok": core_ok, "checks": core_checks},
        "watchtower_probe": wt,
        "loo_meta_parity_probe": loo,
    }

    ok = all(bool(v.get("ok")) for v in checks.values() if isinstance(v, dict))
    status = "healthy" if ok else "degraded"

    payload = {"ok": ok, "status": status, "checks": checks, "version": CONTRACT_VERSION}
    code = 200 if ok else 503
    return JSONResponse(status_code=code, content=payload)
