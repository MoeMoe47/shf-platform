"""
Minimum viable enforcement checks (Phase 2).
These are safe, low-risk checks that prove wiring end-to-end.
"""

from __future__ import annotations

from typing import Any, Dict

from fabric.layers.check_registry import (
    register_policy_check,
    register_risk_check,
    register_alignment_check,
)


# ----------------------------
# POLICY (L01/L05 starter)
# ----------------------------

@register_policy_check("policy.identity.layer_key_present")
def policy_layer_key_present(ctx: Dict[str, Any]) -> Dict[str, Any]:
    agent = (ctx.get("agent") or {}) if isinstance(ctx.get("agent"), dict) else {}
    layer = (agent.get("layer") or "").strip()
    ok = bool(layer)
    return {"ok": ok, "detail": "agent.layer must be present", "layer": layer}


@register_policy_check("policy.identity.agent_id_present")
def policy_agent_id_present(ctx: Dict[str, Any]) -> Dict[str, Any]:
    agent = (ctx.get("agent") or {}) if isinstance(ctx.get("agent"), dict) else {}
    agent_id = (agent.get("agentId") or "").strip()
    ok = bool(agent_id)
    return {"ok": ok, "detail": "agent.agentId must be present", "agentId": agent_id}


# ----------------------------
# RISK (L02/L04 starter)
# ----------------------------

@register_risk_check("risk.payload.max_input_kb_64")
def risk_payload_size(ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Hard cap on input size to reduce abuse / DoS / runaway logs.
    Uses a conservative 64KB limit for the public /run stub.
    """
    raw = ctx.get("input")
    # rough sizing without JSON dumps dependency explosion
    s = str(raw)
    kb = len(s.encode("utf-8")) / 1024.0
    ok = kb <= 64.0
    return {"ok": ok, "detail": "input must be <= 64KB", "kb": round(kb, 2), "limit_kb": 64.0}


@register_risk_check("risk.payload.no_secrets_in_input")
def risk_no_obvious_secrets(ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Very lightweight heuristic to prevent obvious secrets from being put into input.
    (Does not try to be perfect; it's a guardrail.)
    """
    raw = str(ctx.get("input", ""))
    needles = ["BEGIN PRIVATE KEY", "api_key", "ADMIN_API_KEY", "password=", "Authorization:"]
    hits = [n for n in needles if n.lower() in raw.lower()]
    ok = len(hits) == 0
    return {"ok": ok, "detail": "avoid obvious secrets in input", "hits": hits}


# ----------------------------
# ALIGNMENT (L05 starter)
# ----------------------------

@register_alignment_check("align.execution.mode_on_required")
def align_mode_on_required(ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Placeholder alignment gate.
    If you want, we can later read runtime_state.get_mode() here,
    but for minimum pack we just assert ctx declares an execution route.
    """
    route = str(ctx.get("route", "")).strip()
    ok = bool(route)
    return {"ok": ok, "detail": "ctx.route must be present for audit traceability", "route": route}
