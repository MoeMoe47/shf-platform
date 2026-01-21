from __future__ import annotations
from .models import AlignRequest, AppManifest, SAFE_CAPS_DEFAULT

SAFE_CAPS = set(SAFE_CAPS_DEFAULT)

def l25_decide(app: AppManifest, req: AlignRequest) -> tuple[str, list[str]]:
    limits: list[str] = []
    state = app.swarm.state
    if state == "OFF":
        return "blocked: swarm disabled for this app (L25 OFF)", limits
    for a in req.requested_agents:
        if a in app.swarm.blocked_agents:
            return f"blocked: agent '{a}' blocked for app", limits
        if app.swarm.allowed_agents and a not in app.swarm.allowed_agents:
            return f"blocked: agent '{a}' not allowlisted for app", limits
    for c in req.requested_capabilities:
        if c in app.swarm.blocked_capabilities:
            return f"blocked: capability '{c}' blocked for app", limits
        if app.swarm.allowed_capabilities and c not in app.swarm.allowed_capabilities:
            return f"blocked: capability '{c}' not allowlisted for app", limits
    if state == "LIMITED":
        bad = [c for c in req.requested_capabilities if c not in SAFE_CAPS]
        if bad:
            return f"blocked: LIMITED mode allows only safe capabilities; blocked {bad}", limits
        limits.append("limited_mode:safe_caps_only")
    if req.risk_level == "high" and state != "ON":
        return "blocked: high-risk request requires app state ON", limits
    return "allowed", limits
