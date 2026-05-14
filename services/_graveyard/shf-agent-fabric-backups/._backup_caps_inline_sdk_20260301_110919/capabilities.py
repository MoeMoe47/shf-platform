from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List


SCHEMA_VERSION = "AIM_CAPABILITIES_V1"


def funding_capabilities() -> Dict[str, Any]:
    """
    Partner-facing, read-only: tells integrators what exists and how to use it.
    No secrets, no auth assumptions, and stable schema_version for contract binding.
    """
    now = datetime.now(timezone.utc).isoformat()

    endpoints: List[Dict[str, Any]] = [
        {
            "path": "/api/funding/discovery",
            "methods": ["GET"],
            "description": "Union index of discoverable funding artifacts (rulesets + lock triggers).",
        },
        {
            "path": "/api/funding/rulesets",
            "methods": ["GET"],
            "description": "Ruleset-only index (AIM_RULESET_V1 items).",
        },
        {
            "path": "/api/funding/rulesets/{ruleset_id}",
            "methods": ["GET"],
            "description": "Fetch a single ruleset JSON by id.",
        },
        {
            "path": "/api/funding/lock-triggers",
            "methods": ["GET"],
            "description": "Lock-trigger-only index (AIM_LOCK_TRIGGERS_V1 items).",
        },
        {
            "path": "/api/funding/lock-triggers/{ruleset_id}",
            "methods": ["GET"],
            "description": "Fetch a single lock-triggers JSON by id.",
        },
        {
            "path": "/api/funding/simulate",
            "methods": ["POST"],
            "description": "Run payout simulation for a cohort against a ruleset.",
        },
        {
            "path": "/api/funding/capabilities",
            "methods": ["GET"],
            "description": "This document (stable discovery contract).",
        },
    ]

    curl_examples: List[str] = [
        'curl -sS http://127.0.0.1:8001/api/funding/capabilities | python3 -m json.tool',
        'curl -sS http://127.0.0.1:8001/api/funding/discovery | python3 -m json.tool',
        'curl -sS http://127.0.0.1:8001/api/funding/rulesets | python3 -m json.tool',
        'curl -sS http://127.0.0.1:8001/api/funding/lock-triggers | python3 -m json.tool',
        # OpenAPI (safe parse, no SIGPIPE)
        'curl -fsS http://127.0.0.1:8001/openapi.json -o /tmp/shf_openapi.json && python3 -c \'import json; o=json.load(open("/tmp/shf_openapi.json")); print(*[p for p in sorted(o.get("paths",{})) if p.startswith("/api/funding/")], sep="\\n")\'',
    ]

    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": now,
        "service": {"name": "shf-agent-fabric", "component": "funding"},
        "contracts": {
            "discovery_index": "AIM_DISCOVERY_INDEX_V1",
            "discovery_item": "AIM_DISCOVERY_ITEM_V1",
            "ruleset_index": "AIM_RULESET_INDEX_V1",
            "ruleset": "AIM_RULESET_V1",
            "lock_triggers_index": "AIM_LOCK_TRIGGERS_INDEX_V1",
            "lock_triggers": "AIM_LOCK_TRIGGERS_V1",
            "simulate_result": "AIM_SIM_RESULT_V1",
        },
        "endpoints": endpoints,
        "examples": {"curl": curl_examples},
        "notes": [
            "All endpoints are read-only except /api/funding/simulate (compute-only).",
            "No secrets are exposed. This endpoint is safe to share with partners.",
            "Use /api/funding/discovery to list artifacts, then fetch by id.",
        ],
    }
