from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException

from services.truth_spine_service import (
    audit_feed,
    build_envelope,
    build_readiness,
    build_truth_package,
    create_claim,
    create_source,
    get_federation_system,
    get_claim,
    list_federation_systems,
    list_claims,
    list_sources,
    list_truth_packages,
    patch_public_approval,
    replay_claim,
    truth_coverage,
    truth_drift,
    truth_federation_summary,
    truth_summary,
    upsert_federation_system,
)


router = APIRouter(prefix="/truth", tags=["truth"])


@router.get("/health")
def truth_health() -> Dict[str, Any]:
    return {"ok": True, "service": "truth-spine", **truth_summary()}


@router.get("/coverage")
def truth_coverage_report() -> Dict[str, Any]:
    return truth_coverage()


@router.get("/drift")
def truth_drift_report() -> Dict[str, Any]:
    return truth_drift()


@router.get("/federation")
def truth_federation() -> Dict[str, Any]:
    return truth_federation_summary()


@router.post("/federation/systems")
def truth_create_federation_system(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    if not (payload or {}).get("system_id"):
        raise HTTPException(status_code=400, detail="system_id is required")
    system = upsert_federation_system(payload or {})
    return {"ok": True, "system": system}


@router.get("/federation/systems/{system_id}")
def truth_get_federation_system(system_id: str) -> Dict[str, Any]:
    system = get_federation_system(system_id)
    if not system:
        raise HTTPException(status_code=404, detail="federation system not found")
    return {"ok": True, "system": system}


@router.get("/claims")
def truth_claims() -> Dict[str, Any]:
    claims = list_claims()
    return {"ok": True, "count": len(claims), "claims": claims}


@router.post("/claims")
def truth_create_claim(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    claim = create_claim(payload or {})
    return {"ok": True, "claim": claim}


@router.get("/claims/{claim_id}")
def truth_get_claim(claim_id: str) -> Dict[str, Any]:
    claim = get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "claim": claim}


@router.get("/packages")
def truth_packages() -> Dict[str, Any]:
    packages = list_truth_packages()
    return {"ok": True, "count": len(packages), "packages": packages}


@router.get("/package/{claim_id}")
def truth_package(claim_id: str) -> Dict[str, Any]:
    package = build_truth_package(claim_id)
    if not package:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "package": package}


@router.get("/sources")
def truth_sources() -> Dict[str, Any]:
    sources = list_sources()
    return {"ok": True, "count": len(sources), "sources": sources}


@router.post("/sources")
def truth_create_source(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    source = create_source(payload or {})
    return {"ok": True, "source": source}


@router.get("/envelope/{claim_id}")
def truth_envelope(claim_id: str) -> Dict[str, Any]:
    envelope = build_envelope(claim_id)
    if not envelope:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "envelope": envelope}


@router.get("/readiness/{claim_id}")
def truth_readiness(claim_id: str) -> Dict[str, Any]:
    readiness = build_readiness(claim_id)
    if not readiness:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "readiness": readiness}


@router.get("/replay/{claim_id}")
def truth_replay(claim_id: str) -> Dict[str, Any]:
    replay = replay_claim(claim_id)
    if not replay:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "replay": replay}


@router.patch("/public-approval/{claim_id}")
def truth_public_approval(claim_id: str, payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    updated = patch_public_approval(claim_id, bool((payload or {}).get("public_approved")))
    if not updated:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "claim": updated}


@router.get("/audit-feed")
def truth_audit_feed(limit: int = 100) -> Dict[str, Any]:
    events = audit_feed(limit=limit)
    return {"ok": True, "count": len(events), "events": events}
