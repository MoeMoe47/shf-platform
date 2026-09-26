from __future__ import annotations

"""
AFCC-2A.2 read projections for the Command Center lanes that were admin-key only.

Each projection calls the existing Fabric read logic (the same functions behind
/admin/agents/summary/*, /admin/layers/gate/status and /runs/recent) and
returns ONLY the fields the Command Center uses. The admin routes are unchanged
and still require X-Admin-Key; these projections are reachable only through the
AFCC read router (routers/command_read_routes.py), which never mutates.
"""

import re
from typing import Any, Dict, List

RUNS_WINDOW = 25  # fixed server-side; not taken from the request

_SAFE_SOURCE = re.compile(r"^contracts/[\w./-]+\.json$")


def _str(value: Any) -> str | None:
    return value if isinstance(value, str) and value.strip() else None


def _num(value: Any) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None


def _bool(value: Any) -> bool | None:
    return value if isinstance(value, bool) else None


def _str_list(value: Any) -> List[str]:
    return [v for v in value if isinstance(v, str)] if isinstance(value, list) else []


def _dicts(value: Any) -> List[Dict[str, Any]]:
    return [v for v in value if isinstance(v, dict)] if isinstance(value, list) else []


def _safe_source(value: Any) -> str | None:
    text = _str(value)
    return text if text and _SAFE_SOURCE.match(text) and ".." not in text else None


def agents_health_projection() -> Dict[str, Any]:
    from routers.admin_agents_routes import admin_agent_health_summary_safe

    raw = admin_agent_health_summary_safe()
    summary = raw.get("summary") if isinstance(raw.get("summary"), dict) else {}
    return {
        "state": "AVAILABLE",
        "ok": _bool(raw.get("ok")),
        "source": _safe_source(raw.get("source")),
        "summary": {k: _num(summary.get(k)) for k in ("total", "ready", "warning", "approval_required")},
        "agents": [
            {
                "agent_id": _str(row.get("agent_id")) or _str(row.get("agentId")),
                "name": _str(row.get("name")),
                "layer": _str(row.get("layer")),
                "lifecycle": _str(row.get("lifecycle")),
                "enabled": _bool(row.get("enabled")),
                "status": _str(row.get("status")),
                "missing": _str_list(row.get("missing")),
            }
            for row in _dicts(raw.get("agents"))
        ],
    }


def agents_readiness_projection() -> Dict[str, Any]:
    from routers.admin_agents_routes import admin_agent_execution_readiness

    raw = admin_agent_execution_readiness()
    summary = raw.get("summary") if isinstance(raw.get("summary"), dict) else {}
    return {
        "state": "AVAILABLE",
        "ok": _bool(raw.get("ok")),
        "source": _safe_source(raw.get("source")),
        "summary": {k: _num(summary.get(k)) for k in ("total", "auto_ready", "approval_required", "blocked")},
        "agents": [
            {
                "agent_id": _str(row.get("agent_id")) or _str(row.get("agentId")),
                "name": _str(row.get("name")),
                "execution_status": _str(row.get("execution_status")),
                "can_auto_execute": _bool(row.get("can_auto_execute")),
                "humanApproval": _bool(row.get("humanApproval")),
                "blockers": _str_list(row.get("blockers")),
                "warnings": _str_list(row.get("warnings")),
                "recommended_next_step": _str(row.get("recommended_next_step")),
            }
            for row in _dicts(raw.get("agents"))
        ],
    }


def gate_projection() -> Dict[str, Any]:
    from routers.admin_layers_routes import gate_status

    raw = gate_status()
    return {
        "state": "AVAILABLE",
        "gate_pass": _bool(raw.get("gate_pass")),
        "auditor_one_liner": _str(raw.get("auditor_one_liner")),
        "gate_required_layers": _str_list(raw.get("gate_required_layers")),
        "gate_blockers": [
            {"layer": _str(b.get("layer")), "reason": _str(b.get("reason"))} for b in _dicts(raw.get("gate_blockers"))
        ],
    }


_RUN_FIELDS = (
    "runId", "planId", "agentName", "agentId", "layer", "kind", "outcome", "message", "ts", "requestId",
    "snapshotSha256", "actor", "actorId", "initiatedBy", "organization_id", "organizationId", "model",
    "provider", "work_order_id", "workOrderId", "run_state", "runState",
)


def runs_recent_projection() -> Dict[str, Any]:
    from routers.runs_routes import read_recent_run_events

    events = []
    for event in read_recent_run_events(RUNS_WINDOW):
        if not isinstance(event, dict):
            continue
        row = {k: event[k] for k in _RUN_FIELDS if isinstance(event.get(k), str) and event[k].strip()}
        if isinstance(event.get("artifacts"), list):
            # Artifact ids and hashes only; server file paths are never projected.
            row["artifacts"] = [
                {"artifactId": _str(a.get("artifactId")), "sha256": _str(a.get("sha256"))} for a in _dicts(event["artifacts"])
            ]
        events.append(row)
    return {"state": "AVAILABLE", "window": RUNS_WINDOW, "events": events}
