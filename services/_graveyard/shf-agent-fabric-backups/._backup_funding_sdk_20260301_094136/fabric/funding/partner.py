from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import Request, HTTPException


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class FundingSurface:
    """
    Read-only partner integration surface.
    This file should contain ZERO business mutations.
    """
    service_name: str = "funding"
    schema_health: str = "AIM_HEALTH_V1"
    schema_caps: str = "AIM_CAPABILITIES_V1"
    schema_sdk: str = "AIM_SDK_V1"
    schema_examples: str = "AIM_EXAMPLES_V1"
    schema_schemas_index: str = "AIM_SCHEMAS_INDEX_V1"
    schema_postman: str = "AIM_POSTMAN_COLLECTION_V1"


SURFACE = FundingSurface()


def health_payload(app_version: Optional[str] = None) -> Dict[str, Any]:
    return {
        "schema_version": SURFACE.schema_health,
        "ok": True,
        "service": SURFACE.service_name,
        "version": app_version,
        "time_utc": _utc_now_iso(),
    }


def capabilities_payload(base_url: str) -> Dict[str, Any]:
    """
    High-signal “what can I do?” response partners can use to self-integrate.
    """
    return {
        "schema_version": SURFACE.schema_caps,
        "service": SURFACE.service_name,
        "base_url": base_url.rstrip("/"),
        "endpoints": [
            {"method": "GET", "path": "/api/funding/health", "purpose": "Liveness + version"},
            {"method": "GET", "path": "/api/funding/capabilities", "purpose": "Discover integration surface"},
            {"method": "GET", "path": "/api/funding/sdk", "purpose": "Copy/paste SDK snippets"},
            {"method": "GET", "path": "/api/funding/examples", "purpose": "Example payloads for /simulate"},
            {"method": "GET", "path": "/api/funding/schemas", "purpose": "Schema index (OpenAPI components)"},
            {"method": "GET", "path": "/api/funding/schemas/{name}", "purpose": "Fetch one schema by name"},
            {"method": "GET", "path": "/api/funding/postman", "purpose": "Postman collection JSON"},
            {"method": "GET", "path": "/api/funding/rulesets", "purpose": "Ruleset index (read-only)"},
            {"method": "GET", "path": "/api/funding/rulesets/{ruleset_id}", "purpose": "Ruleset detail (read-only)"},
            {"method": "GET", "path": "/api/funding/lock-triggers", "purpose": "Lock triggers index (read-only)"},
            {"method": "GET", "path": "/api/funding/lock-triggers/{ruleset_id}", "purpose": "Lock triggers detail (read-only)"},
            {"method": "POST", "path": "/api/funding/simulate", "purpose": "Run funding simulation (stateless calc)"},
        ],
        "notes": [
            "All endpoints are read-only except POST /simulate (stateless calculation; no persistence).",
            "Partners can fetch schemas to validate payloads client-side.",
        ],
    }


def sdk_payload(base_url: str) -> Dict[str, Any]:
    """
    “Gold standard” integration hints.
    Keep it dead simple: base URL + curl + python requests.
    """
    base = base_url.rstrip("/")
    return {
        "schema_version": SURFACE.schema_sdk,
        "base_url": base,
        "headers": {
            "content-type": "application/json"
        },
        "curl": {
            "health": f'curl -sS "{base}/api/funding/health" | python3 -m json.tool',
            "capabilities": f'curl -sS "{base}/api/funding/capabilities" | python3 -m json.tool',
            "rulesets": f'curl -sS "{base}/api/funding/rulesets" | python3 -m json.tool',
            "lock_triggers": f'curl -sS "{base}/api/funding/lock-triggers" | python3 -m json.tool',
            "schemas": f'curl -sS "{base}/api/funding/schemas" | python3 -m json.tool',
            "simulate": (
                f'curl -sS -X POST "{base}/api/funding/simulate" '
                f"-H 'content-type: application/json' "
                f"-d '{{\"ruleset_id\":\"rs_2026Q2_workforce_v1_0\",\"metrics\":{{\"participants_enrolled\":24,\"participants_completed\":19}}}}' "
                f"| python3 -m json.tool"
            ),
        },
        "python_requests": {
            "example": "\n".join([
                "import requests",
                "",
                f'BASE = "{base}"',
                "",
                "r = requests.get(f\"{BASE}/api/funding/capabilities\", timeout=10)",
                "r.raise_for_status()",
                "caps = r.json()",
                "print(caps[\"endpoints\"])",
                "",
                "payload = {",
                "  \"ruleset_id\": \"rs_2026Q2_workforce_v1_0\",",
                "  \"metrics\": {",
                "    \"participants_enrolled\": 24,",
                "    \"participants_completed\": 19,",
                "    \"attendance_rate\": 0.87,",
                "    \"job_placement_count\": 11,",
                "    \"verified_placement_rate\": 0.73,",
                "    \"certification_earned_count\": 8,",
                "    \"retention_3m_rate\": 0.62,",
                "    \"retention_6m_rate\": 0.48,",
                "    \"participant_opportunity_index\": 0.60",
                "  },",
                "  \"benchmarks\": {\"cost_per_job_placement_percentile\": 0.44},",
                "  \"watchtower\": {\"signals\": []}",
                "}",
                "",
                "r = requests.post(f\"{BASE}/api/funding/simulate\", json=payload, timeout=15)",
                "r.raise_for_status()",
                "print(r.json())",
            ])
        },
    }


def examples_payload() -> Dict[str, Any]:
    """
    Canonical examples partners can copy/paste.
    """
    return {
        "schema_version": SURFACE.schema_examples,
        "simulate": {
            "minimal_request": {
                "ruleset_id": "rs_2026Q2_workforce_v1_0",
                "metrics": {
                    "participants_enrolled": 24,
                    "participants_completed": 19
                }
            },
            "full_request": {
                "ruleset_id": "rs_2026Q2_workforce_v1_0",
                "metrics": {
                    "participants_enrolled": 24,
                    "participants_completed": 19,
                    "attendance_rate": 0.87,
                    "job_placement_count": 11,
                    "verified_placement_rate": 0.73,
                    "certification_earned_count": 8,
                    "retention_3m_rate": 0.62,
                    "retention_6m_rate": 0.48,
                    "participant_opportunity_index": 0.60
                },
                "benchmarks": {"cost_per_job_placement_percentile": 0.44},
                "watchtower": {"signals": []}
            }
        }
    }


def _openapi_components_schemas(req: Request) -> Dict[str, Any]:
    """
    Pull schemas from FastAPI's generated OpenAPI.
    This keeps the “schemas endpoint” always up-to-date.
    """
    o = req.app.openapi()
    comps = o.get("components", {})
    schemas = comps.get("schemas", {})
    if not isinstance(schemas, dict):
        return {}
    return schemas


def schemas_index(req: Request) -> Dict[str, Any]:
    schemas = _openapi_components_schemas(req)
    names = sorted(schemas.keys())
    return {
        "schema_version": SURFACE.schema_schemas_index,
        "count": len(names),
        "schemas": [{"name": n, "url": f"/api/funding/schemas/{n}"} for n in names],
    }


def schemas_get(req: Request, name: str) -> Dict[str, Any]:
    schemas = _openapi_components_schemas(req)
    if name not in schemas:
        raise HTTPException(status_code=404, detail=f"Schema not found: {name}")
    # return raw JSON Schema fragment
    return schemas[name]


def postman_collection(base_url: str) -> Dict[str, Any]:
    """
    Minimal Postman v2.1 collection that works immediately.
    """
    base = base_url.rstrip("/")
    return {
        "schema_version": SURFACE.schema_postman,
        "info": {
            "name": "SHF Funding API (Read-only + Simulate)",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "variable": [
            {"key": "baseUrl", "value": base}
        ],
        "item": [
            _pm_get("Health", "{{baseUrl}}/api/funding/health"),
            _pm_get("Capabilities", "{{baseUrl}}/api/funding/capabilities"),
            _pm_get("SDK", "{{baseUrl}}/api/funding/sdk"),
            _pm_get("Examples", "{{baseUrl}}/api/funding/examples"),
            _pm_get("Schemas Index", "{{baseUrl}}/api/funding/schemas"),
            _pm_get("Rulesets Index", "{{baseUrl}}/api/funding/rulesets"),
            _pm_get("Lock Triggers Index", "{{baseUrl}}/api/funding/lock-triggers"),
            _pm_post_json(
                "Simulate (example)",
                "{{baseUrl}}/api/funding/simulate",
                {
                    "ruleset_id": "rs_2026Q2_workforce_v1_0",
                    "metrics": {"participants_enrolled": 24, "participants_completed": 19},
                },
            ),
        ],
    }


def _pm_get(name: str, url: str) -> Dict[str, Any]:
    return {
        "name": name,
        "request": {
            "method": "GET",
            "header": [{"key": "content-type", "value": "application/json"}],
            "url": {"raw": url, "host": [url]},
        },
    }


def _pm_post_json(name: str, url: str, body_obj: Dict[str, Any]) -> Dict[str, Any]:
    import json as _json
    return {
        "name": name,
        "request": {
            "method": "POST",
            "header": [{"key": "content-type", "value": "application/json"}],
            "body": {"mode": "raw", "raw": _json.dumps(body_obj, indent=2)},
            "url": {"raw": url, "host": [url]},
        },
    }
