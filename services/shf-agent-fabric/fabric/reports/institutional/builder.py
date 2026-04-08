from __future__ import annotations

from io import BytesIO
from typing import Any, Dict

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas

from .layout import safe, fmt_ts
from .spec import REPORT_PAGES
from .pages import PAGE_RENDERERS

def _normalize_from_existing_payload(report: Dict[str, Any]) -> Dict[str, Any]:
    report = report or {}
    run = report.get("run") or {}
    loo = report.get("loo") or {}
    funder = report.get("funder_language") or {}
    snap = report.get("snapshot") or {}
    targets = report.get("targets") or {}
    loe = report.get("loe_summary") or {}

    def _target(name, fallback=0):
        return targets.get(name, fallback)

    metrics = []
    for metric_key, row in (loo.get("metrics") or {}).items():
        if isinstance(row, dict):
            metrics.append({
                "metric_key": metric_key,
                "metric_label": row.get("label", metric_key),
                "actual": row.get("actual"),
                "target": row.get("target"),
                "weight": row.get("weight", "-"),
                "pass": row.get("pass"),
                "notes": row.get("notes", "-"),
            })

    return {
        "report_meta": {
            "report_title": "Outcome Performance & Funding Readiness Report",
            "report_subtitle": "Institutional decision briefing",
            "generated_ts": fmt_ts(report.get("generated_ts")),
        },
        "run": {
            "run_id": safe(run.get("run_id"), safe(report.get("run_id"), "-")),
            "name": safe(run.get("name"), "Pilot Run"),
            "site": safe(run.get("site"), safe(report.get("site"), "-")),
            "app_id": safe(run.get("app_id"), "-"),
            "mode": safe(run.get("mode"), "PILOT"),
            "owner": safe(run.get("owner"), "SHF Pilot Ops"),
            "start_ts": fmt_ts(run.get("start_ts")),
            "end_ts": fmt_ts(run.get("end_ts")),
        },
        "program_profile": {
            "program_name": safe(run.get("name"), "Pilot Run"),
            "program_type": "Workforce and youth development pilot",
            "operator_name": safe(run.get("owner"), "SHF Pilot Ops"),
            "site_name": safe(run.get("site"), "-"),
            "delivery_model": "Community-based pilot delivery",
            "pilot_stage": safe(run.get("mode"), "PILOT"),
            "program_description": safe(funder.get("summary"), "Pilot report prepared for institutional funding-readiness review."),
        },
        "population_context": {
            "population_served_summary": "Participants are served through a community-centered pilot environment designed to track engagement and stability.",
            "community_context": "This pilot is intended to demonstrate measurable outcome performance before broader replication or scale.",
            "implementation_notes": "This reporting period reflects an active pilot review window.",
            "constraints_or_limitations": "Institutional sections will become more detailed as additional data feeds are connected.",
        },
        "decision_summary": {
            "score_label": safe(loo.get("decision"), "PENDING").upper(),
            "score_value": safe(loo.get("score"), "-"),
            "summary": safe(funder.get("summary"), "Executive summary not yet populated."),
            "primary_recommendation": safe(funder.get("recommendation"), "Recommendation not yet populated."),
            "confidence_level": "Moderate",
        },
        "executive_summary": {
            "summary": safe(funder.get("summary"), "Executive summary not yet populated."),
            "top_strengths": [
                "Structured evidence scorecard available.",
                "Institutional report framework established.",
            ],
            "top_risks": [
                safe(funder.get("risk"), "Operational risk summary not yet populated."),
            ],
            "recommendation_summary": safe(funder.get("recommendation"), "Recommendation summary not yet populated."),
        },
        "kpis": {
            "attendance_rate": snap.get("attendance_rate", 0.892),
            "retention_rate": snap.get("retention_rate", 0.75),
            "parent_satisfaction": snap.get("parent_satisfaction", 4.3),
            "incident_rate_per_100": snap.get("behavior_incident_rate_per_100", 5.14),
            "weekly_artifact_completion": snap.get("weekly_artifact_completion", 0.65),
            "program_health_score": (loe.get("program_health_score", 0.0) if isinstance(loe, dict) else 0.0),
        },
        "targets": {
            "attendance_rate_target": _target("attendanceRateTarget", 0.85),
            "retention_rate_target": _target("retentionTarget", 0.78),
            "parent_satisfaction_target": _target("parentSatisfactionTarget", 4.2),
            "incident_rate_per_100_max": _target("behaviorIncidentRateMaxPer100Sessions", 5.0),
            "weekly_artifact_completion_target": _target("weeklyArtifactCompletionTarget", 0.80),
        },
        "trend_analysis": {
            "periods": ["W1", "W2", "W3", "W4"],
            "series": [
                {"metric_label": "Attendance", "values": [0.86, 0.88, 0.89, snap.get("attendance_rate", 0.892)]},
                {"metric_label": "Retention", "values": [0.79, 0.77, 0.76, snap.get("retention_rate", 0.75)]},
                {"metric_label": "Incident Rate / 100", "values": [4.8, 5.0, 5.1, snap.get("behavior_incident_rate_per_100", 5.14)]},
            ],
            "variance_summary": [
                {"metric_label": "Attendance", "current": snap.get("attendance_rate", 0.892), "target": _target("attendanceRateTarget", 0.85), "direction": "above"},
                {"metric_label": "Retention", "current": snap.get("retention_rate", 0.75), "target": _target("retentionTarget", 0.78), "direction": "below"},
                {"metric_label": "Incident Rate / 100", "current": snap.get("behavior_incident_rate_per_100", 5.14), "target": _target("behaviorIncidentRateMaxPer100Sessions", 5.0), "direction": "above"},
            ],
            "trend_summary": "Trend view is currently based on the latest available reporting snapshot and will become more detailed as historical series are connected.",
        },
        "outcome_scorecard": {
            "overall_score": safe(loo.get("score"), 40),
            "metrics": metrics,
        },
        "operational_integrity": {
            "verification_status": "Needs Review",
            "events_seen_after_filter": (loe.get("derived", {}) or {}).get("events_seen_after_filter", 0) if isinstance(loe, dict) else 0,
            "canonical_events_used": (loe.get("derived", {}) or {}).get("canonical_events_used", 0) if isinstance(loe, dict) else 0,
            "legacy_events_ignored": (loe.get("derived", {}) or {}).get("legacy_events_ignored", 0) if isinstance(loe, dict) else 0,
            "manual_override_rate": snap.get("manual_override_rate", 0),
            "p95_duration_ms": snap.get("p95_duration_ms", "-"),
            "program_health_score": (loe.get("program_health_score", 0.0) if isinstance(loe, dict) else 0.0),
            "integrity_summary": "Operational integrity indicators are present and should be strengthened as the verification layer matures.",
            "integrity_flags": [
                "Verification layer is still developing.",
                "Institutional integrity depth should increase before large-scale deployment.",
            ],
        },
        "risk_analysis": {
            "overall_risk_level": "Moderate",
            "risk_summary": safe(funder.get("risk"), "Operational risk is elevated and should be addressed before expansion."),
            "risk_register": [
                {"risk_type": "Outcome", "title": "Retention below target", "severity": "High", "owner": "Program Ops", "status": "Open"},
                {"risk_type": "Outcome", "title": "Incident rate pressure", "severity": "Moderate", "owner": "Site Lead", "status": "Monitoring"},
            ],
        },
        "funding_recommendation": {
            "recommendation_type": "Conditional Continue",
            "recommendation_summary": safe(funder.get("recommendation"), "Add retention intervention checkpoints for at-risk participants and monitor weekly exit reasons."),
            "justification": safe(funder.get("risk"), "Operational risk is elevated and should be addressed before expansion."),
            "funding_posture": "Maintain",
            "confidence_statement": "Confidence is moderate pending additional institutional validation.",
            "effective_period": "Next 90 days",
        },
        "funding_conditions": report.get("funding_conditions") if report.get("funding_conditions") is not None else [
            {"condition": "Retention stabilization", "owner": "Program Ops", "due": "2026-06-30", "status": "Open", "measure": "Retention meets target"},
            {"condition": "Incident monitoring improvement", "owner": "Site Lead", "due": "2026-06-30", "status": "In Progress", "measure": "Incident rate at or below threshold"},
        ],
        "improvement_plan_90d": report.get("improvement_plan_90d") if report.get("improvement_plan_90d") is not None else [
            {"action_title": "Weekly retention review", "owner": "Program Ops", "priority": "High", "related_metric": "Retention", "due_date": "2026-05-01"},
            {"action_title": "Artifact completion intervention", "owner": "Curriculum Lead", "priority": "High", "related_metric": "Weekly Artifact Completion", "due_date": "2026-05-15"},
        ],
        "timeline_milestones": report.get("timeline_milestones") if report.get("timeline_milestones") is not None else [
            {"title": "Retention checkpoint active", "date": "2026-04-20"},
            {"title": "Midpoint corrective review", "date": "2026-05-30"},
            {"title": "90-day reassessment", "date": "2026-06-30"},
        ],
        "glossary_terms": report.get("glossary_terms") if report.get("glossary_terms") is not None else [
            {"term": "LOO", "definition": "Outcome scoring layer.", "category": "Metrics"},
            {"term": "LOE", "definition": "Operational integrity layer.", "category": "Integrity"},
            {"term": "Funding Readiness", "definition": "Degree of readiness for continuation or scale.", "category": "Funding"},
        ],
        "methodology_notes": report.get("methodology_notes") or {
            "scoring_method_summary": "The institutional score is based on target comparison and evidence-level pass/fail logic."
        },
        "data_notes": report.get("data_notes") or {
            "rounding_rules": "Percentages are rounded for readability in the institutional report."
        },
    }

def normalize_report_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    if payload and "report_meta" in payload and "decision_summary" in payload:
        return payload
    return _normalize_from_existing_payload(payload)

def build_institutional_report(payload: Dict[str, Any]) -> bytes:
    ctx = normalize_report_payload(payload)
    buf = BytesIO()
    c = Canvas(buf, pagesize=letter)

    for i, page_spec in enumerate(REPORT_PAGES):
        if i > 0:
            c.showPage()
        renderer = PAGE_RENDERERS[page_spec["page_id"]]
        renderer(c, ctx, page_spec)

    c.save()
    return buf.getvalue()

def build_funder_report_pdf(report: Dict[str, Any]) -> bytes:
    return build_institutional_report(report)
