from __future__ import annotations

from fastapi import APIRouter, Request
from fabric.funding.partner_docs import funding_version, funding_changelog

from fabric.funding.partner import build_sdk
from fabric.funding.partner import (


    health_payload,
    capabilities_payload,
    sdk_payload,
    examples_payload,
    schemas_index,
    schemas_get,
    postman_collection,
)

router = APIRouter(prefix="/api/funding", tags=["funding"])


def _base_url(req: Request) -> str:
    # Works behind proxies too; you can later harden with forwarded headers if needed.
    return str(req.base_url).rstrip("/")


@router.get("/health")
def funding_health() -> dict:
    # If you later expose app version, pass it in. For now keep stable.
    return health_payload(app_version=None)


@router.get("/capabilities")
def funding_capabilities(req: Request) -> dict:
    return capabilities_payload(base_url=_base_url(req))


@router.get("/sdk")
def funding_sdk(req: Request) -> dict:
    return sdk_payload(base_url=_base_url(req))


@router.get("/examples")
def funding_examples() -> dict:
    return examples_payload()


@router.get("/schemas")
def funding_schemas(req: Request) -> dict:
    return schemas_index(req)


@router.get("/schemas/{name}")
def funding_schema_get(req: Request, name: str) -> dict:
    return schemas_get(req, name)


@router.get("/postman")
def funding_postman(req: Request) -> dict:
    return postman_collection(base_url=_base_url(req))

@router.get("/version")
def get_version():
    return funding_version()

@router.get("/changelog")
def get_changelog():
    return funding_changelog()

# ===== SHF Ruleset Hash Utilities =====
def _stable_json(obj) -> str:
    import json
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def _attach_ruleset_sha256(doc: dict) -> dict:
    """
    Adds sha256 to each ruleset dict in doc["rulesets"] (if missing).
    Hash is computed over the ruleset content excluding the sha256 field itself.
    """
    import hashlib

    rules = doc.get("rulesets")
    if isinstance(rules, list):
        for r in rules:
            if not isinstance(r, dict):
                continue
            if "sha256" in r:
                continue
            payload = {k: v for k, v in r.items() if k != "sha256"}
            r["sha256"] = hashlib.sha256(_stable_json(payload).encode("utf-8")).hexdigest()
    return doc
