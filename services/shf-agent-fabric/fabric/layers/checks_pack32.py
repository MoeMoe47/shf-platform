"""
Minimum 32-layer check pack.
Goal: every layer has at least 1 policy/risk/alignment check registered
so enforcement coverage can be proven and enforced.

These are intentionally minimal but auditable + fail-closed hooks.
"""

from __future__ import annotations
from typing import Any, Dict

from fabric.layers.check_registry import (
    register_policy_check,
    register_risk_check,
    register_alignment_check,
)

def _ok(detail: str = "ok", **extra):
    out = {"ok": True, "detail": detail}
    out.update(extra)
    return out

def _no(detail: str, **extra):
    out = {"ok": False, "detail": detail}
    out.update(extra)
    return out

# --- L01 Identity & Access Control ---
@register_policy_check("policy.l01.agent_id_present")
def p_l01_agent_id_present(ctx: Dict[str, Any]) -> Dict[str, Any]:
    agent = (ctx or {}).get("agent") or {}
    if agent.get("agentId"):
        return _ok()
    return _no("agent.agentId required")

@register_risk_check("risk.l01.input_size_max_64kb")
def r_l01_input_size(ctx: Dict[str, Any]) -> Dict[str, Any]:
    raw = (ctx or {}).get("input_raw") or ""
    if isinstance(raw, str) and len(raw.encode("utf-8")) <= 64 * 1024:
        return _ok()
    return _no("input exceeds 64kb limit")

@register_alignment_check("align.l01.mode_on_required")
def a_l01_mode_on(ctx: Dict[str, Any]) -> Dict[str, Any]:
    mode = (ctx or {}).get("mode")
    if mode == "ON":
        return _ok()
    return _no("FABRIC_MODE must be ON")

# --- Generic minimal pattern for L02-L32 ---
# For now: one policy check requires ctx.route, one risk check blocks obvious secrets,
# one alignment check requires ctx.request_id.

@register_policy_check("policy.core.route_required")
def p_core_route_required(ctx: Dict[str, Any]) -> Dict[str, Any]:
    route = (ctx or {}).get("route")
    if route:
        return _ok(route=route)
    return _no("ctx.route required")

@register_risk_check("risk.core.no_secrets_in_input")
def r_core_no_secrets(ctx: Dict[str, Any]) -> Dict[str, Any]:
    text = (ctx or {}).get("input_text") or ""
    if not isinstance(text, str):
        return _ok()
    suspects = ["api_key", "secret", "password", "BEGIN PRIVATE KEY", "x-admin-key"]
    hit = next((s for s in suspects if s.lower() in text.lower()), None)
    if hit:
        return _no("possible secret detected", hit=hit)
    return _ok()

@register_alignment_check("align.core.request_id_required")
def a_core_request_id(ctx: Dict[str, Any]) -> Dict[str, Any]:
    rid = (ctx or {}).get("request_id")
    if rid:
        return _ok(request_id=rid)
    return _no("request_id required")
