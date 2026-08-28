from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Body, Depends, HTTPException, Request

from auth.csrf import validate_csrf
from auth.dependencies import require_authenticated_user, require_permission
from auth.permissions import (
    TRUTH_ADMIN,
    TRUTH_AUDIT_READ,
    TRUTH_CLAIM_APPROVE_PUBLIC,
    TRUTH_CLAIM_APPROVE_INTERNAL,
    TRUTH_CLAIM_CREATE,
    TRUTH_CLAIM_REVOKE_PUBLIC,
    TRUTH_CLAIM_REVOKE_INTERNAL,
    TRUTH_PUBLIC_POPULATION_APPROVE,
    TRUTH_PUBLIC_POPULATION_REVOKE,
    TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE,
    TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE,
    TRUTH_CLAIM_UPDATE,
    TRUTH_INTERNAL_READ,
    TRUTH_SOURCE_CREATE,
    TRUTH_SOURCE_VERIFY,
    has_permission,
)
from services import truth_history_service
from services import truth_public_population_service
from services import truth_public_population_authority_service
from services.truth_spine_service import (
    TruthAuthorityError,
    TruthTransitionError,
    approve_public,
    approve_internal,
    audit_feed,
    build_envelope,
    build_public_truth_package,
    build_readiness,
    build_truth_package,
    check_organization_access,
    create_claim,
    create_claim_version,
    create_source,
    get_claim,
    get_federation_system,
    get_public_claim,
    get_source,
    list_all_claim_versions,
    list_claims_for_viewer,
    list_federation_systems,
    list_public_claims,
    list_public_truth_packages,
    list_sources,
    list_truth_packages,
    replay_claim,
    revoke_public,
    revoke_internal,
    truth_coverage,
    truth_drift,
    truth_federation_summary,
    truth_summary,
    upsert_federation_system,
    verify_source,
)


router = APIRouter(prefix="/truth", tags=["truth"])


# --- error translation ----------------------------------------------------
#
# TruthAuthorityError -> 404 by default: per docs/TRUTH_SPINE_SECURITY.md,
# cross-tenant scope violations against a SPECIFIC existing entity must not
# reveal whether that entity exists ("404 - record absent or intentionally
# concealed across tenant boundaries"). The one exception is a caller with
# no organization scope trying to create a brand-new record - there is no
# entity to conceal, so that is a plain 403.
def _raise_for_authority_error(exc: TruthAuthorityError) -> None:
    if str(exc) == "actor_missing_organization_scope":
        raise HTTPException(status_code=403, detail="Forbidden: no organization scope on this account")
    raise HTTPException(status_code=404, detail="Not found")


def _raise_for_transition_error(exc: TruthTransitionError) -> None:
    if exc.reason in {"claim_not_found", "source_not_found"}:
        raise HTTPException(status_code=404, detail="Not found")
    if exc.reason == "reason_required":
        raise HTTPException(status_code=422, detail="A non-empty reason is required for this action")
    if exc.reason == "claim_already_exists":
        raise HTTPException(status_code=409, detail={"error": exc.reason, **exc.detail})
    raise HTTPException(status_code=409, detail={"error": exc.reason, **exc.detail})


def _require_reason(payload: Dict[str, Any]) -> str:
    reason = str(payload.get("reason") or "").strip()
    if not reason:
        raise HTTPException(status_code=422, detail="A non-empty 'reason' field is required")
    return reason


# --- PUBLIC_READ -----------------------------------------------------------
#
# These are the ONLY unauthenticated routes in this router. Every one of
# them goes through services.truth_spine_service.is_publicly_visible() (or
# a function that itself calls it) - see that function's docstring for the
# single canonical public-visibility predicate every public path must use.

@router.get("/health")
def truth_health() -> Dict[str, Any]:
    return {"ok": True, "service": "truth-spine", **truth_summary()}


@router.get("/public/claims")
def truth_public_claims() -> Dict[str, Any]:
    claims = list_public_claims()
    return {"ok": True, "count": len(claims), "claims": claims}


@router.get("/public/claims/{claim_id}")
def truth_public_claim(claim_id: str) -> Dict[str, Any]:
    claim = get_public_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "claim": claim}


@router.get("/public/packages")
def truth_public_packages() -> Dict[str, Any]:
    packages = list_public_truth_packages()
    return {"ok": True, "count": len(packages), "packages": packages}


@router.get("/public/package/{claim_id}")
def truth_public_package(claim_id: str) -> Dict[str, Any]:
    package = build_public_truth_package(claim_id)
    if not package:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "package": package}


# --- PRIVILEGED_READ (truth.internal.read) ---------------------------------

@router.get("/coverage")
def truth_coverage_report(session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    return truth_coverage()


@router.get("/drift")
def truth_drift_report(session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    return truth_drift()


@router.get("/federation")
def truth_federation(session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    return truth_federation_summary()


@router.get("/federation/systems/{system_id}")
def truth_get_federation_system(system_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    system = get_federation_system(system_id)
    if not system:
        raise HTTPException(status_code=404, detail="federation system not found")
    return {"ok": True, "system": system}


@router.get("/claims")
def truth_claims(session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    claims = list_claims_for_viewer(session)
    return {"ok": True, "count": len(claims), "claims": claims}


@router.get("/claims/{claim_id}")
def truth_get_claim(claim_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    claim = get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="claim not found")
    try:
        check_organization_access(session, claim.get("organization_id"))
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    return {"ok": True, "claim": claim}


@router.get("/claims/{claim_id}/versions")
def truth_claim_versions(claim_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    versions = list_all_claim_versions(claim_id)
    if not versions:
        raise HTTPException(status_code=404, detail="claim not found")
    try:
        check_organization_access(session, versions[0].get("organization_id"))
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    return {"ok": True, "claim_id": claim_id, "versions": versions}


@router.get("/packages")
def truth_packages(session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    packages = list_truth_packages()
    return {"ok": True, "count": len(packages), "packages": packages}


@router.get("/package/{claim_id}")
def truth_package(claim_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    package = build_truth_package(claim_id)
    if not package:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "package": package}


@router.get("/sources")
def truth_sources(session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    sources = list_sources()
    return {"ok": True, "count": len(sources), "sources": sources}


@router.get("/envelope/{claim_id}")
def truth_envelope(claim_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    envelope = build_envelope(claim_id)
    if not envelope:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "envelope": envelope}


@router.get("/readiness/{claim_id}")
def truth_readiness(claim_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    readiness = build_readiness(claim_id)
    if not readiness:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "readiness": readiness}


@router.get("/replay/{claim_id}")
def truth_replay(claim_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    replay = replay_claim(claim_id)
    if not replay:
        raise HTTPException(status_code=404, detail="claim not found")
    return {"ok": True, "replay": replay}


# --- AUTHORIZED_WRITE --------------------------------------------------

@router.post("/sources")
def truth_create_source(
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_SOURCE_CREATE)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        source = create_source(payload or {}, session)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    return {"ok": True, "source": source}


@router.post("/sources/{source_id}/verify")
def truth_verify_source(
    source_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_SOURCE_VERIFY)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    reason = _require_reason(payload or {})
    verification_status = str((payload or {}).get("verification_status") or "verified")
    try:
        source = verify_source(source_id, session, verification_status, reason)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "source": source}


@router.post("/claims")
def truth_create_claim(
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_CLAIM_CREATE)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        claim = create_claim(payload or {}, session)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "claim": claim}


@router.patch("/claims/{claim_id}")
def truth_update_claim(
    claim_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_CLAIM_UPDATE)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        claim = create_claim_version(claim_id, payload or {}, session)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "claim": claim}


# --- ADMINISTRATIVE_TRANSITION ------------------------------------------

@router.post("/claims/{claim_id}/approve-public")
def truth_approve_public(
    claim_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_CLAIM_APPROVE_PUBLIC)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    reason = _require_reason(payload or {})
    try:
        claim = approve_public(claim_id, session, reason)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "claim": claim}


@router.post("/claims/{claim_id}/approve-internal")
def truth_approve_internal(
    claim_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_CLAIM_APPROVE_INTERNAL)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    reason = _require_reason(payload or {})
    try:
        claim = approve_internal(claim_id, session, reason)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "claim": claim}


@router.post("/claims/{claim_id}/revoke-internal")
def truth_revoke_internal(
    claim_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_CLAIM_REVOKE_INTERNAL)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    reason = _require_reason(payload or {})
    try:
        claim = revoke_internal(claim_id, session, reason)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "claim": claim}


@router.post("/claims/{claim_id}/revoke-public")
def truth_revoke_public(
    claim_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_CLAIM_REVOKE_PUBLIC)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    reason = _require_reason(payload or {})
    try:
        claim = revoke_public(claim_id, session, reason)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "claim": claim}


@router.post("/claims/{claim_id}/public-population-eligibility")
def truth_approve_public_population(
    claim_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_PUBLIC_POPULATION_APPROVE)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        eligibility = truth_public_population_service.approve(claim_id, int((payload or {}).get("version")), session, _require_reason(payload or {}))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="A valid claim version and non-empty reason are required")
    except truth_public_population_service.PublicPopulationEligibilityError as exc:
        if exc.reason in {"claim_not_found", "source_not_found"}:
            raise HTTPException(status_code=404, detail="Not found")
        if exc.reason in {"reason_required", "institutional_signoff_required"}:
            raise HTTPException(status_code=422, detail=exc.reason)
        raise HTTPException(status_code=409, detail={"error": exc.reason})
    return {"ok": True, "eligibility": eligibility}


@router.post("/public-population-authorities")
def truth_create_public_population_authority(request: Request, payload: Dict[str, Any] = Body(default={}), session=Depends(require_permission(TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE))) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        authority = truth_public_population_authority_service.create_authority(session, str((payload or {}).get("authority_type") or ""), (payload or {}).get("organization_id"), (payload or {}).get("tenant_id"), (payload or {}).get("parent_authority_id"), (payload or {}).get("effective_from"), (payload or {}).get("effective_to"))
    except truth_public_population_authority_service.PublicPopulationAuthorityError as exc:
        raise HTTPException(status_code=409, detail={"error": exc.reason})
    return {"ok": True, "authority": authority}


@router.get("/public-population-authorities")
def truth_list_public_population_authorities(session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    return {"ok": True, "authorities": truth_public_population_authority_service.list_authorities()}


@router.post("/public-population-authorities/{authority_id}/revoke")
def truth_revoke_public_population_authority(authority_id: str, request: Request, payload: Dict[str, Any] = Body(default={}), session=Depends(require_permission(TRUTH_PUBLIC_POPULATION_AUTHORITY_MANAGE))) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        authority = truth_public_population_authority_service.revoke_authority(authority_id, session, _require_reason(payload or {}))
    except truth_public_population_authority_service.PublicPopulationAuthorityError as exc:
        if exc.reason == "reason_required":
            raise HTTPException(status_code=422, detail=exc.reason)
        raise HTTPException(status_code=409, detail={"error": exc.reason})
    return {"ok": True, "authority": authority}


@router.post("/claims/{claim_id}/public-population-signoff")
def truth_signoff_public_population(request: Request, claim_id: str, payload: Dict[str, Any] = Body(default={}), session=Depends(require_permission(TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE))) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        signoff = truth_public_population_authority_service.signoff_claim(claim_id, int((payload or {}).get("version")), str((payload or {}).get("authority_id") or ""), session, _require_reason(payload or {}))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="A valid claim version, authority_id, and reason are required")
    except truth_public_population_authority_service.PublicPopulationAuthorityError as exc:
        if exc.reason in {"claim_not_found"}:
            raise HTTPException(status_code=404, detail="Not found")
        raise HTTPException(status_code=409, detail={"error": exc.reason})
    return {"ok": True, "signoff": signoff}


@router.get("/claims/{claim_id}/public-population-signoffs")
def truth_list_public_population_signoffs(claim_id: str, session=Depends(require_permission(TRUTH_INTERNAL_READ))) -> Dict[str, Any]:
    try:
        signoffs = truth_public_population_authority_service.list_signoffs(claim_id, session)
    except truth_public_population_authority_service.PublicPopulationAuthorityError:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "count": len(signoffs), "signoffs": signoffs}


@router.post("/public-population-signoffs/{signoff_id}/revoke")
def truth_revoke_public_population_signoff(signoff_id: str, request: Request, payload: Dict[str, Any] = Body(default={}), session=Depends(require_permission(TRUTH_PUBLIC_POPULATION_SIGNOFF_MANAGE))) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        signoff = truth_public_population_authority_service.revoke_signoff(signoff_id, session, _require_reason(payload or {}))
    except truth_public_population_authority_service.PublicPopulationAuthorityError as exc:
        if exc.reason == "reason_required":
            raise HTTPException(status_code=422, detail=exc.reason)
        raise HTTPException(status_code=409, detail={"error": exc.reason})
    return {"ok": True, "signoff": signoff}


@router.get("/claims/{claim_id}/public-population-eligibility")
def truth_list_public_population_eligibility(
    claim_id: str,
    session=Depends(require_permission(TRUTH_INTERNAL_READ)),
) -> Dict[str, Any]:
    try:
        events = truth_public_population_service.list_for_claim(claim_id, session)
    except truth_public_population_service.PublicPopulationEligibilityError:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "count": len(events), "eligibility": events}


@router.post("/claims/{claim_id}/public-population-eligibility/{eligibility_id}/revoke")
def truth_revoke_public_population(
    claim_id: str,
    eligibility_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_PUBLIC_POPULATION_REVOKE)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    try:
        eligibility = truth_public_population_service.revoke(claim_id, eligibility_id, session, _require_reason(payload or {}))
    except truth_public_population_service.PublicPopulationEligibilityError as exc:
        if exc.reason in {"reason_required"}:
            raise HTTPException(status_code=422, detail=exc.reason)
        raise HTTPException(status_code=409, detail={"error": exc.reason})
    return {"ok": True, "eligibility": eligibility}


@router.patch("/public-approval/{claim_id}")
def truth_public_approval(
    claim_id: str,
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_authenticated_user),
) -> Dict[str, Any]:
    """Preserved for backward compatibility with existing callers (see
    docs/TRUTH_SPINE_SECURITY.md's compatibility note re:
    src/pages/admin/truth-spine/TruthSpinePage.jsx). Internally this now
    requires authentication plus the specific approve/revoke permission for
    the requested transition, and a non-empty reason - it is no longer a
    thin unauthenticated wrapper around the same upsert used for claim
    creation."""
    validate_csrf(request, session)
    requested = bool((payload or {}).get("public_approved"))
    reason = _require_reason(payload or {})
    required_permission = TRUTH_CLAIM_APPROVE_PUBLIC if requested else TRUTH_CLAIM_REVOKE_PUBLIC
    if not has_permission(session.role, required_permission):
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        if requested:
            claim = approve_public(claim_id, session, reason)
        else:
            claim = revoke_public(claim_id, session, reason)
    except TruthAuthorityError as exc:
        _raise_for_authority_error(exc)
    except TruthTransitionError as exc:
        _raise_for_transition_error(exc)
    return {"ok": True, "claim": claim}


@router.post("/federation/systems")
def truth_create_federation_system(
    request: Request,
    payload: Dict[str, Any] = Body(default={}),
    session=Depends(require_permission(TRUTH_ADMIN)),
) -> Dict[str, Any]:
    validate_csrf(request, session)
    if not (payload or {}).get("system_id"):
        raise HTTPException(status_code=400, detail="system_id is required")
    system = upsert_federation_system(payload or {})
    return {"ok": True, "system": system}


# --- AUDIT ------------------------------------------------------------

@router.get("/audit-feed")
def truth_audit_feed(limit: int = 100, session=Depends(require_permission(TRUTH_AUDIT_READ))) -> Dict[str, Any]:
    events = audit_feed(limit=limit)
    return {"ok": True, "count": len(events), "events": events}


@router.get("/history")
def truth_history(limit: int = 100, session=Depends(require_permission(TRUTH_AUDIT_READ))) -> Dict[str, Any]:
    org_filter = None if getattr(session, "organization_id", None) is None else session.organization_id
    events = truth_history_service.list_recent_history(limit=limit, organization_id=org_filter)
    return {"ok": True, "count": len(events), "events": events}


@router.get("/history/{entity_id}")
def truth_history_for_entity(entity_id: str, session=Depends(require_permission(TRUTH_AUDIT_READ))) -> Dict[str, Any]:
    events = truth_history_service.list_history_for_entity(entity_id)
    return {"ok": True, "entity_id": entity_id, "events": events}
