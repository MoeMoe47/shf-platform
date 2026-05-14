from __future__ import annotations

from fastapi import APIRouter

from fabric.funding.partner import build_sdk, Request

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
