from __future__ import annotations

import os
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from fabric.funding.partner_pack import (
    funding_health,
    capabilities,
    schemas_index,
    schema_by_name,
    sdk_doc,
    postman_collection,
)

router = APIRouter(prefix="/api/funding", tags=["funding_partner"])

def _base_url(request: Request) -> str:
    # Prefer explicit external base for proxies, otherwise infer
    explicit = os.getenv("SHF_PUBLIC_BASE_URL")
    if explicit:
        return explicit.rstrip("/")
    return str(request.base_url).rstrip("/")

@router.get("/health")
def get_health():
    return JSONResponse(funding_health())

@router.get("/capabilities")
def get_capabilities(request: Request):
    return JSONResponse(capabilities(_base_url(request)))

@router.get("/schemas")
def get_schemas(request: Request):
    return JSONResponse(schemas_index(_base_url(request)))

@router.get("/schemas/{name}")
def get_schema(name: str):
    return JSONResponse(schema_by_name(name))

@router.get("/sdk")
def get_sdk(request: Request):
    return JSONResponse(sdk_doc(_base_url(request)))

@router.get("/postman")
def get_postman(request: Request):
    return JSONResponse(postman_collection(_base_url(request)))
