from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def funding_capabilities() -> Dict[str, Any]:
    """
    Partner-facing read-only discovery contract. Safe to share.
    """
    endpoints: List[Dict[str, Any]] = [
        {"path": "/api/funding/capabilities", "methods": ["GET"], "description": "This document."},
                        {"path": "/api/funding/changelog", "methods": ["GET"], "description": "Human-readable changelog for partner integrations."},
{"path": "/api/funding/version", "methods": ["GET"], "description": "Stable version contract for partners (safe to pin)."},
{"path": "/api/funding/health", "methods": ["GET"], "description": "Funding component health + contract versions."},
        {"path": "/api/funding/examples", "methods": ["GET"], "description": "Canonical example payload(s) for integration."},
        {"path": "/api/funding/schemas", "methods": ["GET"], "description": "JSON Schema-ish contracts for partners."},
        {"path": "/api/funding/postman", "methods": ["GET"], "description": "Postman collection for funding integration."},

        {"path": "/api/funding/discovery", "methods": ["GET"], "description": "Union list: rulesets + lock-triggers (discoverable artifacts)."},
        {"path": "/api/funding/rulesets", "methods": ["GET"], "description": "Ruleset-only index (AIM_RULESET_V1)."},
        {"path": "/api/funding/rulesets/{ruleset_id}", "methods": ["GET"], "description": "Fetch a single ruleset JSON by id."},
        {"path": "/api/funding/lock-triggers", "methods": ["GET"], "description": "Lock-triggers-only index (AIM_LOCK_TRIGGERS_V1)."},
        {"path": "/api/funding/lock-triggers/{ruleset_id}", "methods": ["GET"], "description": "Fetch a single lock-triggers JSON by id."},
        {"path": "/api/funding/simulate", "methods": ["POST"], "description": "Compute payout simulation against a ruleset."},
    ]

    curl_examples: List[str] = [
        "curl -sS http://127.0.0.1:8001/api/funding/capabilities | python3 -m json.tool",
        "curl -sS http://127.0.0.1:8001/api/funding/health | python3 -m json.tool",
        "curl -sS http://127.0.0.1:8001/api/funding/examples | python3 -m json.tool",
        "curl -sS http://127.0.0.1:8001/api/funding/discovery | python3 -m json.tool",
        "curl -sS http://127.0.0.1:8001/api/funding/rulesets | python3 -m json.tool",
        "curl -sS http://127.0.0.1:8001/api/funding/lock-triggers | python3 -m json.tool",
        # OpenAPI parse (safe: download then parse)
        "curl -fsS http://127.0.0.1:8001/openapi.json -o /tmp/shf_openapi.json && python3 -c 'import json; o=json.load(open(\"/tmp/shf_openapi.json\")); print(*[p for p in sorted(o.get(\"paths\",{})) if p.startswith(\"/api/funding/\")], sep=\"\\n\")'",
    ]

    return {
        "schema_version": "AIM_CAPABILITIES_V1",
        "generated_at": _utc_now(),
        "service": {"name": "shf-agent-fabric", "component": "funding"},
        "contracts": {
            "postman_collection": "AIM_POSTMAN_COLLECTION_V1",
            "schemas": "AIM_FUNDING_SCHEMAS_V1",
            "capabilities": "AIM_CAPABILITIES_V1",
            "health": "AIM_FUNDING_HEALTH_V1",
            "examples": "AIM_FUNDING_EXAMPLES_V1",
            "discovery_index": "AIM_DISCOVERY_INDEX_V1",
            "discovery_item": "AIM_DISCOVERY_ITEM_V1",
            "ruleset_index": "AIM_RULESET_INDEX_V1",
            "ruleset": "AIM_RULESET_V1",
            "lock_triggers_index": "AIM_LOCK_TRIGGERS_INDEX_V1",
            "lock_triggers": "AIM_LOCK_TRIGGERS_V1",
            "simulate_result": "AIM_SIM_RESULT_V1",
        },
        {"path": "/api/funding/sdk", "methods": ["GET"], "description": "Partner quickstart SDK (curl + python requests examples)."},
        "endpoints": endpoints,
        "examples": {"curl": curl_examples},
        "notes": [
            "Read-only discovery endpoints enable partners to self-integrate without dashboards.",
            "No secrets are exposed here; this is safe to share externally.",
        ],
    }


def funding_health() -> Dict[str, Any]:
    return {
        "schema_version": "AIM_FUNDING_HEALTH_V1",
        "ok": True,
        "checked_at": _utc_now(),
        "contracts": {
            "AIM_DISCOVERY_INDEX_V1": True,
            "AIM_RULESET_INDEX_V1": True,
            "AIM_LOCK_TRIGGERS_INDEX_V1": True,
            "AIM_SIM_RESULT_V1": True,
        },
        "notes": [
            "This is component-level health (funding).",
            "Use /docs or /openapi.json for full API surface.",
        ],
    }


def funding_examples() -> Dict[str, Any]:
    """
    Canonical example payloads that partners can copy/paste to integrate quickly.
    Keep these stable and versioned.
    """
    simulate_example = {
        "ruleset_id": "rs_2026Q2_workforce_v1_0",
        "ruleset_version": "1.0",
        "cohort": {
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

    curl = [
        "curl -sS http://127.0.0.1:8001/api/funding/examples | python3 -m json.tool",
        "curl -sS http://127.0.0.1:8001/api/funding/rulesets | python3 -m json.tool",
        "curl -sS http://127.0.0.1:8001/api/funding/lock-triggers | python3 -m json.tool",
        # If you already have /api/funding/simulate wired, partners can POST this:
        "curl -sS -X POST http://127.0.0.1:8001/api/funding/simulate -H 'content-type: application/json' -d @/tmp/shf_simulate_example.json | python3 -m json.tool",
    ]

    return {
        "schema_version": "AIM_FUNDING_EXAMPLES_V1",
        "generated_at": _utc_now(),
        "simulate": {
            "request_schema_hint": "POST /api/funding/simulate",
            "example_request": simulate_example,
        },
        "curl": curl,
        "notes": [
            "Partners should use /api/funding/discovery first to learn available ruleset ids.",
            "Then GET the specific ruleset JSON, then POST /simulate with their cohort metrics.",
        ],
    }


def funding_schemas() -> Dict[str, Any]:
    """
    Lightweight JSON-Schema-style contracts.
    These are NOT your full OpenAPI spec; they are partner-friendly payload guides.
    """
    simulate_request_schema = {
        "type": "object",
        "required": ["ruleset_id", "cohort"],
        "properties": {
            "ruleset_id": {"type": "string", "examples": ["rs_2026Q2_workforce_v1_0"]},
            "ruleset_version": {"type": ["string", "null"], "examples": ["1.0"]},
            "cohort": {
                "type": "object",
                "required": ["participants_enrolled", "participants_completed"],
                "properties": {
                    "participants_enrolled": {"type": "number", "examples": [24]},
                    "participants_completed": {"type": "number", "examples": [19]},
                    "attendance_rate": {"type": "number", "examples": [0.87]},
                    "job_placement_count": {"type": "number", "examples": [11]},
                    "verified_placement_rate": {"type": "number", "examples": [0.73]},
                    "certification_earned_count": {"type": "number", "examples": [8]},
                    "retention_3m_rate": {"type": "number", "examples": [0.62]},
                    "retention_6m_rate": {"type": "number", "examples": [0.48]},
                    "participant_opportunity_index": {"type": "number", "examples": [0.60]},
                },
            },
            "benchmarks": {
                "type": "object",
                "properties": {
                    "cost_per_job_placement_percentile": {"type": "number", "examples": [0.44]}
                },
            },
            "watchtower": {
                "type": "object",
                "properties": {
                    "signals": {"type": "array", "items": {"type": "object"}, "examples": [[]]}
                },
            },
        },
    }

    simulate_result_schema = {
        "type": "object",
        "required": ["schema_version", "ruleset_id", "payout_breakdown", "totals"],
        "properties": {
            "schema_version": {"type": "string", "examples": ["AIM_SIM_RESULT_V1"]},
            "ruleset_id": {"type": "string"},
            "ruleset_version": {"type": ["string", "null"]},
            "freeze": {
                "type": "object",
                "properties": {
                    "triggered": {"type": "boolean"},
                    "reason": {"type": ["string", "null"]},
                },
            },
            "payout_breakdown": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "rule_id": {"type": "string"},
                        "pay_type": {"type": "string", "examples": ["base", "bonus", "penalty"]},
                        "units": {"type": "number"},
                        "rate": {"type": "number"},
                        "gross": {"type": "number"},
                        "cap_applied": {"type": "boolean"},
                        "net": {"type": "number"},
                    },
                },
            },
            "multipliers_applied": {
                "type": "object",
                "properties": {
                    "total_multiplier": {"type": "number"},
                    "guardrail_penalty_multiplier": {"type": "number"},
                },
            },
            "totals": {
                "type": "object",
                "properties": {
                    "gross_payment": {"type": "number"},
                    "final_payment": {"type": "number"},
                    "cap_applied": {"type": "boolean"},
                    "cohort_cap": {"type": "number"},
                    "participant_cap": {"type": "number"},
                },
            },
        },
    }

    discovery_item_schema = {
        "type": "object",
        "required": ["schema_version", "kind", "ruleset_id", "filename"],
        "properties": {
            "schema_version": {"type": "string", "examples": ["AIM_DISCOVERY_ITEM_V1"]},
            "kind": {"type": "string", "examples": ["ruleset", "lock_triggers"]},
            "ruleset_id": {"type": "string"},
            "ruleset_version": {"type": ["string", "null"]},
            "status": {"type": ["string", "null"], "examples": ["active"]},
            "program_category": {"type": ["string", "null"]},
            "scope": {"type": ["string", "null"]},
            "metric_standard": {"type": ["string", "null"]},
            "effective_start": {"type": ["string", "null"], "examples": ["2026-04-01"]},
            "effective_end": {"type": ["string", "null"], "examples": ["2026-06-30"]},
            "filename": {"type": "string"},
        },
    }

    return {
        "schema_version": "AIM_FUNDING_SCHEMAS_V1",
        "generated_at": _utc_now(),
        "schemas": {
            "simulate_request": simulate_request_schema,
            "simulate_result": simulate_result_schema,
            "discovery_item": discovery_item_schema,
        },
        "notes": [
            "These are partner-friendly 'shape' docs. Full truth is still OpenAPI at /openapi.json.",
            "Keep these stable; partners will code against them.",
        ],
    }


def funding_postman_collection(base_url: str = "http://127.0.0.1:8001") -> Dict[str, Any]:
    """
    Postman Collection (v2.1) for partner self-integration.
    Partners can import this JSON directly into Postman.
    """
    collection = {
        "info": {
            "name": "SHF Funding API (Partner Integration)",
            "_postman_id": "shf-funding-partner-collection",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            "description": "Read-only discovery + simulate endpoint for SHF Outcome Funding Engine (partners).",
        },
        "variable": [
            {"key": "base_url", "value": base_url},
            {"key": "ruleset_id", "value": "rs_2026Q2_workforce_v1_0"},
        ],
        "item": [
            {
                "name": "Health",
                "item": [
                    {
                        "name": "GET /api/funding/health",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/health", "host": ["{{base_url}}"], "path": ["api", "funding", "health"]},
                        },
                    }
                ],
            },
            {
                "name": "Capabilities",
                "item": [
                    {
                        "name": "GET /api/funding/capabilities",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/capabilities", "host": ["{{base_url}}"], "path": ["api", "funding", "capabilities"]},
                        },
                    }
                ],
            },
            {
                "name": "Discovery",
                "item": [
                    {
                        "name": "GET /api/funding/discovery",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/discovery", "host": ["{{base_url}}"], "path": ["api", "funding", "discovery"]},
                        },
                    },
                    {
                        "name": "GET /api/funding/rulesets",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/rulesets", "host": ["{{base_url}}"], "path": ["api", "funding", "rulesets"]},
                        },
                    },
                    {
                        "name": "GET /api/funding/rulesets/:ruleset_id",
                        "request": {
                            "method": "GET",
                            "url": {
                                "raw": "{{base_url}}/api/funding/rulesets/{{ruleset_id}}",
                                "host": ["{{base_url}}"],
                                "path": ["api", "funding", "rulesets", "{{ruleset_id}}"],
                            },
                        },
                    },
                    {
                        "name": "GET /api/funding/lock-triggers",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/lock-triggers", "host": ["{{base_url}}"], "path": ["api", "funding", "lock-triggers"]},
                        },
                    },
                    {
                        "name": "GET /api/funding/lock-triggers/:ruleset_id",
                        "request": {
                            "method": "GET",
                            "url": {
                                "raw": "{{base_url}}/api/funding/lock-triggers/{{ruleset_id}}",
                                "host": ["{{base_url}}"],
                                "path": ["api", "funding", "lock-triggers", "{{ruleset_id}}"],
                            },
                        },
                    },
                ],
            },
            {
                "name": "Contracts",
                "item": [
                    {
                        "name": "GET /api/funding/schemas",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/schemas", "host": ["{{base_url}}"], "path": ["api", "funding", "schemas"]},
                        },
                    },
                    {
                        "name": "GET /api/funding/examples",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/examples", "host": ["{{base_url}}"], "path": ["api", "funding", "examples"]},
                        },
                    },
                ],
            },
            {
                "name": "Simulate",
                "item": [
                    {
                        "name": "POST /api/funding/simulate",
                        "request": {
                            "method": "POST",
                            "header": [{"key": "content-type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": """{
  "ruleset_id": "{{ruleset_id}}",
  "cohort": {
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
  "benchmarks": { "cost_per_job_placement_percentile": 0.44 },
  "watchtower": { "signals": [] }
}""",
                            },
                            "url": {"raw": "{{base_url}}/api/funding/simulate", "host": ["{{base_url}}"], "path": ["api", "funding", "simulate"]},
                        },
                    }
                ],
            },
            {
                "name": "Postman Export",
                "item": [
                    {
                        "name": "GET /api/funding/postman",
                        "request": {
                            "method": "GET",
                            "url": {"raw": "{{base_url}}/api/funding/postman", "host": ["{{base_url}}"], "path": ["api", "funding", "postman"]},
                        },
                    }
                ],
            },
        ],
    }

    return {
        "schema_version": "AIM_POSTMAN_COLLECTION_V1",
        "generated_at": _utc_now(),
        "collection": collection,
        "import_steps": [
            "Copy the JSON at collection into Postman: Import → Raw text → Paste → Continue.",
            "Set variables: base_url, ruleset_id.",
            "Run discovery endpoints, then simulate.",
        ],
    }
def funding_version() -> Dict[str, Any]:
    """
    Partner-stable version contract.
    Keep shape stable. Partners can pin logic on these fields.
    """
    return {
        "schema_version": "AIM_VERSION_V1",
        "service": {"name": "shf-agent-fabric", "component": "funding"},
        # SemVer-ish string for partner integrations (not tied to git sha).
        "api_version": "1.0.0",
        # Date stamp for humans / release notes.
        "released_utc": "2026-03-01",
        "stability": "stable",
        "notes": [
            "This is the canonical funding partner surface version.",
            "Do not remove fields; only add new optional fields."
        ],
    }


def funding_changelog() -> Dict[str, Any]:
    """
    Partner-facing changelog. Keep concise, stable, and audit-friendly.
    """
    return {
        "schema_version": "AIM_CHANGELOG_V1",
        "service": {"name": "shf-agent-fabric", "component": "funding"},
        "current_api_version": "1.0.0",
        "entries": [
            {
                "date_utc": "2026-03-01",
                "version": "1.0.0",
                "changes": [
                    "Canonical partner surface established: health, capabilities, discovery, rulesets, lock-triggers, schemas, simulate.",
                    "Added /api/funding/postman for Postman import (read-only).",
                    "Added /api/funding/sdk for curl + python requests quickstart.",
                    "Archived legacy funding_partner_pack implementation to ._deprecated_funding_pack (not imported).",
                ],
                "breaking": False,
            }
        ],
        "rules": [
            "Entries are append-only.",
            "Mark breaking=True only when partner action is required.",
        ],
    }
