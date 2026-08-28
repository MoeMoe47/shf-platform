from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from auth.dependencies import require_permission
from auth.permissions import SHF_REPORT_READ
from services.reporting_service import ReportingRegistryError, generate_curriculum_completion_report, generate_exchange_funding_commitment_count_report, generate_hub_referral_created_count_report, generate_workforce_employment_started_verified_count_report

router = APIRouter(prefix="/shf/reports", tags=["shf-reporting"])

@router.get("/curriculum.lesson-completion-count")
def read_curriculum_completion_report(period_start: str = Query("2026-01-01T00:00:00+00:00"), period_end: str = Query("2026-12-31T23:59:59+00:00"), public: bool = False, correlation_id: str | None = None, session=Depends(require_permission(SHF_REPORT_READ))):
    try:
        report = generate_curriculum_completion_report(session, period_start, period_end, public=public, correlation_id=correlation_id)
    except (ReportingRegistryError, ValueError):
        raise HTTPException(status_code=422, detail="Report request rejected")
    return {"ok": True, "report": report}


@router.get("/hub.referral-created-count")
def read_hub_referral_created_count_report(period_start: str = Query("2026-01-01T00:00:00+00:00"), period_end: str = Query("2026-12-31T23:59:59+00:00"), public: bool = False, correlation_id: str | None = None, session=Depends(require_permission(SHF_REPORT_READ))):
    try:
        report = generate_hub_referral_created_count_report(session, period_start, period_end, public=public, correlation_id=correlation_id)
    except (ReportingRegistryError, ValueError):
        raise HTTPException(status_code=422, detail="Report request rejected")
    return {"ok": True, "report": report}


@router.get("/exchange.funding-commitment-count")
def read_exchange_funding_commitment_count_report(period_start: str = Query("2026-01-01T00:00:00+00:00"), period_end: str = Query("2026-12-31T23:59:59+00:00"), public: bool = False, correlation_id: str | None = None, session=Depends(require_permission(SHF_REPORT_READ))):
    try:
        report = generate_exchange_funding_commitment_count_report(session, period_start, period_end, public=public, correlation_id=correlation_id)
    except (ReportingRegistryError, ValueError):
        raise HTTPException(status_code=422, detail="Report request rejected")
    return {"ok": True, "report": report}


@router.get("/workforce.employment-started-verified-count")
def read_workforce_employment_started_verified_count_report(period_start: str = Query("2026-01-01T00:00:00+00:00"), period_end: str = Query("2026-12-31T23:59:59+00:00"), public: bool = False, correlation_id: str | None = None, session=Depends(require_permission(SHF_REPORT_READ))):
    try:
        report = generate_workforce_employment_started_verified_count_report(session, period_start, period_end, public=public, correlation_id=correlation_id)
    except (ReportingRegistryError, ValueError):
        raise HTTPException(status_code=422, detail="Report request rejected")
    return {"ok": True, "report": report}
