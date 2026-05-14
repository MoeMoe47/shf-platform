from __future__ import annotations

from typing import Any, Dict, List, Optional
import json
import os
from datetime import datetime, timezone

# We reuse your existing discovery/rulesets loader logic
from fabric.funding.rulesets import (
    list_rulesets,           # returns RULESET index
    list_lock_triggers,      # returns LOCK TRIGGERS index
    read_ruleset,            # reads a ruleset by id
    read_lock_triggers,      # reads lock triggers by id
    list_discovery,          # combined discovery (kinds)
)

SCHEMA_VERSION_CAPS = "AIM_CAPABILITIES_V1"
SCHEMA_VERSION_SCHEMAS = "AIM_SCHEMAS_INDEX_V1"
SCHEMA_VERSION_SDK = "AIM_SDK_V1"
SCHEMA_VERSION_POSTMAN = "AIM_POSTMAN_COLLECTION_V1"

def _utc_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

def _base_urls(base_url: str) -> Dict[str, str]:
    return {
        "health": f"{base_url}/api/funding/health",
        "capabilities": f"{base_url}/api/funding/capabilities",
        "discovery": f"{base_url}/api/funding/discovery",
        "rulesets": f"{base_url}/api/funding/rulesets",
        "lock_triggers": f"{base_url}/api/funding/lock-triggers",
        "simulate": f"{base_url}/api/funding/simulate",
        "schemas": f"{base_url}/api/funding/schemas",
        "sdk": f"{base_url}/api/funding/sdk",
        "postman": f"{base_url}/api/funding/postman",
    }

def funding_health() -> Dict[str, Any]:
    # Minimal, stable machine-check. No secrets.
    return {
        "ok": True,
        "schema_version": "AIM_HEALTH_V1",
        "ts_utc": _utc_iso(),
    }

def capabilities(base_url: str) -> Dict[str, Any]:
    urls = _base_urls(base_url)

    # Read-only discovery signals for partners
    rs_idx = list_rulesets()
    lt_idx = list_lock_triggers()
    disc = list_discovery()

    # Provide one “gold standard” example input aligned with your simulate contract
    simulate_example = {
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
            "participant_opportunity_index": 0.60,
        },
        "benchmarks": {
            "cost_per_job_placement_percentile": 0.44
        },
        "watchtower": {
            "signals": []
        }
    }

    return {
        "schema_version": SCHEMA_VERSION_CAPS,
        "ts_utc": _utc_iso(),
        "service": "shf-agent-fabric",
        "funding_engine": {
            "name": "Outcome Funding Engine",
            "module": "Game Theory Optimization Layer (Adaptive Incentives)",
            "read_only_partner_surface": True,
        },
        "endpoints": urls,
        "inventory": {
            "rulesets_count": int(rs_idx.get("count", 0) or 0),
            "lock_triggers_count": int(lt_idx.get("count", 0) or 0),
            "discovery_count": int(disc.get("count", 0) or 0),
        },
        "examples": {
            "simulate_request": simulate_example,
            "curl_simulate": f"""curl -sS {urls['simulate']} \\
  -H 'content-type: application/json' \\
  -d '{json.dumps(simulate_example)}' | python3 -m json.tool""",
        },
        "notes": [
            "All endpoints are read-only except /simulate (POST).",
            "Rulesets and lock-triggers are published for partner self-integration.",
            "Use /schemas to fetch JSON Schemas for validation.",
        ],
    }

def schemas_index(base_url: str) -> Dict[str, Any]:
    urls = _base_urls(base_url)
    # We publish schemas as simple JSON documents (stable, partner-friendly).
    # These are “interface contracts” not internal Python model dumps.
    items = [
        {
            "name": "AIM_RULESET_V1",
            "url": f"{urls['schemas']}/AIM_RULESET_V1",
            "description": "Ruleset contract: rates, caps, multipliers, effective dates.",
        },
        {
            "name": "AIM_LOCK_TRIGGERS_V1",
            "url": f"{urls['schemas']}/AIM_LOCK_TRIGGERS_V1",
            "description": "Freeze/lock triggers + enforcement guardrails.",
        },
        {
            "name": "AIM_SIM_REQUEST_V1",
            "url": f"{urls['schemas']}/AIM_SIM_REQUEST_V1",
            "description": "POST /simulate input schema.",
        },
        {
            "name": "AIM_SIM_RESULT_V1",
            "url": f"{urls['schemas']}/AIM_SIM_RESULT_V1",
            "description": "POST /simulate output schema.",
        },
        {
            "name": "AIM_DISCOVERY_INDEX_V1",
            "url": f"{urls['schemas']}/AIM_DISCOVERY_INDEX_V1",
            "description": "Discovery payload schema.",
        },
    ]
    return {
        "schema_version": SCHEMA_VERSION_SCHEMAS,
        "ts_utc": _utc_iso(),
        "count": len(items),
        "items": items,
    }

def _schema_docs() -> Dict[str, Dict[str, Any]]:
    # Minimal JSON Schema drafts (good enough for partner validation + tooling).
    # You can tighten these over time without breaking endpoint names.
    return {
        "AIM_SIM_REQUEST_V1": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "AIM_SIM_REQUEST_V1",
            "type": "object",
            "required": ["ruleset_id", "metrics"],
            "properties": {
                "ruleset_id": {"type": "string"},
                "metrics": {"type": "object"},
                "benchmarks": {"type": "object"},
                "watchtower": {"type": "object"},
            },
            "additionalProperties": False,
        },
        "AIM_SIM_RESULT_V1": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "AIM_SIM_RESULT_V1",
            "type": "object",
            "required": ["schema_version", "ruleset_id", "totals"],
            "properties": {
                "schema_version": {"type": "string"},
                "ruleset_id": {"type": "string"},
                "ruleset_version": {"type": ["string", "null"]},
                "freeze": {"type": "object"},
                "payout_breakdown": {"type": "array"},
                "multipliers_applied": {"type": "object"},
                "totals": {"type": "object"},
            },
            "additionalProperties": True,
        },
        "AIM_RULESET_V1": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "AIM_RULESET_V1",
            "type": "object",
            "required": ["schema_version", "ruleset_id"],
            "properties": {
                "schema_version": {"const": "AIM_RULESET_V1"},
                "ruleset_id": {"type": "string"},
                "ruleset_version": {"type": ["string", "null"]},
                "status": {"type": ["string", "null"]},
            },
            "additionalProperties": True,
        },
        "AIM_LOCK_TRIGGERS_V1": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "AIM_LOCK_TRIGGERS_V1",
            "type": "object",
            "required": ["schema_version", "ruleset_id"],
            "properties": {
                "schema_version": {"const": "AIM_LOCK_TRIGGERS_V1"},
                "ruleset_id": {"type": "string"},
                "ruleset_version": {"type": ["string", "null"]},
                "status": {"type": ["string", "null"]},
            },
            "additionalProperties": True,
        },
        "AIM_DISCOVERY_INDEX_V1": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "AIM_DISCOVERY_INDEX_V1",
            "type": "object",
            "required": ["schema_version", "count", "items"],
            "properties": {
                "schema_version": {"const": "AIM_DISCOVERY_INDEX_V1"},
                "count": {"type": "integer"},
                "items": {"type": "array"},
            },
            "additionalProperties": True,
        },
    }

def schema_by_name(name: str) -> Dict[str, Any]:
    docs = _schema_docs()
    if name not in docs:
        return {
            "schema_version": "AIM_SCHEMA_NOT_FOUND_V1",
            "ok": False,
            "name": name,
            "available": sorted(docs.keys()),
        }
    return docs[name]

def sdk_doc(base_url: str) -> Dict[str, Any]:
    urls = _base_urls(base_url)
    return {
        "schema_version": SCHEMA_VERSION_SDK,
        "ts_utc": _utc_iso(),
        "title": "SHF Funding Engine SDK Quickstart",
        "steps": [
            {"step": 1, "do": "Check health", "curl": f"curl -sS {urls['health']} | python3 -m json.tool"},
            {"step": 2, "do": "Discover published artifacts", "curl": f"curl -sS {urls['discovery']} | python3 -m json.tool"},
            {"step": 3, "do": "List rulesets", "curl": f"curl -sS {urls['rulesets']} | python3 -m json.tool"},
            {"step": 4, "do": "List lock triggers", "curl": f"curl -sS {urls['lock_triggers']} | python3 -m json.tool"},
            {"step": 5, "do": "Fetch schemas", "curl": f"curl -sS {urls['schemas']} | python3 -m json.tool"},
            {"step": 6, "do": "Simulate a cohort payout", "curl": "See /capabilities for the gold example curl"},
        ],
        "python_example": {
            "filename": "simulate.py",
            "code": (
                "import requests\n\n"
                f"BASE='{base_url}'\n"
                "payload={\n"
                "  'ruleset_id':'rs_2026Q2_workforce_v1_0',\n"
                "  'metrics':{\n"
                "    'participants_enrolled':24,\n"
                "    'participants_completed':19,\n"
                "    'attendance_rate':0.87,\n"
                "    'job_placement_count':11,\n"
                "    'verified_placement_rate':0.73,\n"
                "    'certification_earned_count':8,\n"
                "    'retention_3m_rate':0.62,\n"
                "    'retention_6m_rate':0.48,\n"
                "    'participant_opportunity_index':0.60,\n"
                "  },\n"
                "  'benchmarks':{'cost_per_job_placement_percentile':0.44},\n"
                "  'watchtower':{'signals':[]}\n"
                "}\n"
                "r=requests.post(f\"{BASE}/api/funding/simulate\", json=payload, timeout=30)\n"
                "r.raise_for_status()\n"
                "print(r.json())\n"
            ),
        },
        "links": urls,
    }

def postman_collection(base_url: str) -> Dict[str, Any]:
    urls = _base_urls(base_url)

    def _req(name: str, method: str, url: str) -> Dict[str, Any]:
        return {
            "name": name,
            "request": {
                "method": method,
                "header": [{"key": "content-type", "value": "application/json"}] if method == "POST" else [],
                "url": url,
            },
        }

    simulate_body = {
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
            "participant_opportunity_index": 0.60,
        },
        "benchmarks": {"cost_per_job_placement_percentile": 0.44},
        "watchtower": {"signals": []},
    }

    collection = {
        "info": {
            "name": "SHF Funding Engine (Partner Pack)",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "item": [
            _req("Funding Health", "GET", urls["health"]),
            _req("Funding Capabilities", "GET", urls["capabilities"]),
            _req("Funding Discovery", "GET", urls["discovery"]),
            _req("Funding Rulesets", "GET", urls["rulesets"]),
            _req("Funding Lock Triggers", "GET", urls["lock_triggers"]),
            _req("Funding Schemas Index", "GET", urls["schemas"]),
            _req("Funding SDK", "GET", urls["sdk"]),
            _req("Funding Postman Collection", "GET", urls["postman"]),
            {
                "name": "Funding Simulate (Example)",
                "request": {
                    "method": "POST",
                    "header": [{"key": "content-type", "value": "application/json"}],
                    "url": urls["simulate"],
                    "body": {"mode": "raw", "raw": json.dumps(simulate_body)},
                },
            },
        ],
    }
    return {
        "schema_version": SCHEMA_VERSION_POSTMAN,
        "ts_utc": _utc_iso(),
        "collection": collection,
    }
