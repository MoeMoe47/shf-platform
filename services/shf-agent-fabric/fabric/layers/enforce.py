from __future__ import annotations

from typing import Any, Dict, List, Tuple
from fastapi import HTTPException

from fabric.layers.store import load_layer_registry
from fabric.layers.check_registry import run_layer_checks


def _get_layer_by_key(layer_key: str) -> dict:
    reg = load_layer_registry()
    layers = reg.get("layers", []) or []
    for L in layers:
        if (L.get("layer_key") or "").strip() == layer_key:
            return L
    raise HTTPException(status_code=403, detail=f"Layer not declared in registry: {layer_key}")


def enforce_layer(layer_key: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enforces checks declared for the given layer_key.
    - Blocks if layer missing (registry is source of truth)
    - Runs checks via run_layer_checks
    """
    L = _get_layer_by_key(layer_key)

    if L.get("status") != "active":
        raise HTTPException(status_code=403, detail=f"Layer not active: {layer_key}")

    if not bool(L.get("enforcement_required", True)):
        return {"ok": True, "skipped": True, "reason": "enforcement_required=false", "layer": layer_key}

    enf = L.get("enforcement", {}) or {}
    policy = enf.get("policy_checks", []) or []
    risk = enf.get("risk_checks", []) or []
    align = enf.get("alignment_checks", []) or []

    # Top-1% integrity: if a layer is required but has no checks, it is NOT enforceable.
    if not (policy or risk or align):
        raise HTTPException(status_code=403, detail=f"Layer has no declared checks: {layer_key}")

    res = run_layer_checks(policy, risk, align, ctx)

    if not res.get("ok", False):
        fail_behavior = (enf.get("fail_behavior") or "halt").lower()
        if fail_behavior == "halt":
            raise HTTPException(status_code=403, detail={"blocked_by_layer": layer_key, "results": res})
        # fallback: treat as halt anyway (safest)
        raise HTTPException(status_code=403, detail={"blocked_by_layer": layer_key, "results": res})

    return {"ok": True, "layer": layer_key, "results": res}
