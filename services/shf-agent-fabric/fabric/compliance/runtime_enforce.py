from __future__ import annotations

from typing import Any, Dict, List, Optional

from .policy_resolver import PolicyResolver


def enforce_gate_g_on_startup(repo_root, businesses: List[Dict[str, Any]], apps: List[Dict[str, Any]], agents: Optional[List[Dict[str, Any]]] = None) -> bool:
    """
    Startup hard-fail if effective policies violate Gate G inheritance:
      Global → Business → App → Agent
    """
    resolver = PolicyResolver(repo_root=repo_root, businesses=businesses, apps=apps, agents=agents or [])

    # Verify business level (Global→Business)
    for b in businesses:
        if not isinstance(b, dict):
            continue
        bkey = resolver.business_key_of(b)
        resolver.resolve_effective_policy_for_business(bkey)

    # Verify app level (Global→Business→App)
    for a in apps:
        if not isinstance(a, dict):
            continue
        aid = a.get("appId") or a.get("id") or a.get("name")
        if not isinstance(aid, str) or not aid.strip():
            raise RuntimeError("[COMPLIANCE_BOOT_FAIL] app missing appId/id/name")
        resolver.resolve_effective_policy_for_app(aid.strip())

    # Verify agent level (Global→Business→App→Agent) if provided
    for ag in (agents or []):
        if not isinstance(ag, dict):
            continue
        gid = ag.get("agentId") or ag.get("id") or ag.get("name")
        if not isinstance(gid, str) or not gid.strip():
            raise RuntimeError("[COMPLIANCE_BOOT_FAIL] agent missing agentId/id/name")
        resolver.resolve_effective_policy_for_agent(gid.strip())

    return True
