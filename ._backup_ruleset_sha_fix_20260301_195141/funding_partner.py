from __future__ import annotations

import hashlib
import json

from fastapi import APIRouter
from fabric.funding.partner_docs import funding_version, funding_changelog

from fabric.funding.partner import build_sdk, Request

from fabric.funding.partner import (


def _stable_json(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def _attach_ruleset_sha256(doc: dict) -> dict:
    """Attach sha256 fingerprint to each ruleset. Stable across identical content."""
    rules = doc.get("rulesets", [])
    if not isinstance(rules, list):
        return doc
    for rs in rules:
        if not isinstance(rs, dict):
            continue
        base = {k: v for k, v in rs.items() if k not in ("sha256", "hash", "fingerprint")}
        rs["sha256"] = hashlib.sha256(_stable_json(base).encode("utf-8")).hexdigest()
    return doc

def _engine_build_sha() -> str:
    """Prefer CI-provided SHA; fallback to local git; otherwise 'unknown'."""
    import os
    sha = os.environ.get("GITHUB_SHA") or os.environ.get("SHF_BUILD_SHA")
    if sha:
        return sha[:40]
    try:
        # local git fallback
        import subprocess
        out = subprocess.check_output(["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL).decode().strip()
        return out[:40] if out else "unknown"
    except Exception:
        return "unknown"


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

# NOTE: rulesets sha256 helper added but rulesets handler not auto-wrapped.
