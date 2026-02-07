from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from fabric.layers.store import load_layer_registry
from fabric.layers.check_registry import POLICY_CHECKS, RISK_CHECKS, ALIGNMENT_CHECKS
from fabric.agent_store import is_layer_enabled, get_layer_disable_meta


def _enforced_ready(layer: dict[str, Any]) -> tuple[bool, dict[str, Any]]:
    enf = (layer.get("enforcement") or {})
    policy = list(enf.get("policy_checks") or [])
    risk = list(enf.get("risk_checks") or [])
    align = list(enf.get("alignment_checks") or [])

    missing_policy = [c for c in policy if c not in POLICY_CHECKS]
    missing_risk = [c for c in risk if c not in RISK_CHECKS]
    missing_align = [c for c in align if c not in ALIGNMENT_CHECKS]

    declared_any = bool(policy or risk or align)
    ok = declared_any and not (missing_policy or missing_risk or missing_align)

    return ok, {
        "declared_any": declared_any,
        "missing": {
            "policy_checks": missing_policy,
            "risk_checks": missing_risk,
            "alignment_checks": missing_align,
        },
        "declared": {
            "policy_checks": policy,
            "risk_checks": risk,
            "alignment_checks": align,
        },
    }


def assert_global_execution_allowed(route: str) -> None:
    """
    GLOBAL EXECUTION GATE (auditor one-line truth)

    Blocks execution when ANY required layer in system_invariants.global_gate_required_layers
    is either:
      - disabled via admin toggle (with persisted reason + gov_approval), OR
      - not enforced_ready (no declared checks OR missing registered checks)
    """
    reg = load_layer_registry()
    invariants = (reg.get("system_invariants") or {})

    required_layers = invariants.get("global_gate_required_layers") or []
    required_layers = [x for x in required_layers if isinstance(x, str)]

    # Default: if not configured, do NOT block everything; enforce nothing.
    if not required_layers:
        return

    idx: dict[str, dict[str, Any]] = {}
    for L in reg.get("layers", []):
        if isinstance(L, dict) and L.get("layer_key"):
            idx[str(L["layer_key"])] = L

    blockers: list[dict[str, Any]] = []

    for layer_key in required_layers:
        L = idx.get(layer_key)
        if not L:
            blockers.append(
                {
                    "layer": layer_key,
                    "reason": "missing_layer_definition",
                }
            )
            continue

        status = (L.get("status") or "active")
        if status != "active":
            blockers.append(
                {
                    "layer": layer_key,
                    "reason": "layer_not_active",
                    "meta": {"status": status},
                }
            )
            continue

        if not is_layer_enabled(layer_key):
            meta = get_layer_disable_meta(layer_key) or {}
            blockers.append(
                {
                    "layer": layer_key,
                    "reason": "layer_disabled",
                    "meta": meta,
                }
            )
            continue

        ok, details = _enforced_ready(L)
        if not ok:
            blockers.append(
                {
                    "layer": layer_key,
                    "reason": "layer_not_enforced_ready",
                    "details": details,
                }
            )

    if blockers:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Global execution gate blocked this request",
                "route": route,
                "blockers": blockers,
            },
        )
