from ..block_engine import PageComposer
from ..layout import safe, pct, num

def _ctx_run(ctx):
    return ctx.get("run", {}) or {}

def _ctx_profile(ctx):
    return ctx.get("program_profile", {}) or {}

def render_program_profile_page(c, ctx, page_spec):
    run = _ctx_run(ctx)
    prof = _ctx_profile(ctx)

    p = PageComposer(c, ctx, page_spec)
    rows = [
        ["Program Name", safe(prof.get("program_name", run.get("name", "Pilot Run"))), "Delivery Model", safe(prof.get("delivery_model", "Community-based pilot delivery"))],
        ["Program Type", safe(prof.get("program_type", "Workforce and youth development pilot")), "Pilot Stage", safe(prof.get("pilot_stage", run.get("mode", "PILOT")))],
        ["Operator", safe(prof.get("operator_name", run.get("owner", "SHF Pilot Ops"))), "Reporting Start", safe(run.get("start_ts", "-"))],
        ["Site Name", safe(prof.get("site_name", run.get("site", "-"))), "Reporting End", safe(run.get("end_ts", "-"))],
    ]
    p.table("Program Profile", ["Field", "Value", "Field", "Value"], rows, [20, 34, 20, 26], row_h=20)
    p.card("Program Description", [safe(prof.get("program_description", "Pilot report prepared for institutional funding-readiness review."))], min_h=58)
    p.finish()

def render_population_context_page(c, ctx, page_spec):
    pop = ctx.get("population_context", {}) or {}
    p = PageComposer(c, ctx, page_spec)
    p.card("Population Served", [safe(pop.get("population_served_summary", "Participants are served through a community-centered pilot environment designed to track engagement and stability."))], min_h=62)
    p.card("Operating Context", [safe(pop.get("community_context", "This pilot is intended to demonstrate measurable outcome performance before broader replication or scale."))], min_h=62)
    p.card("Implementation Notes and Limitations", [
        safe(pop.get("implementation_notes", "This reporting period reflects an active pilot review window.")),
        safe(pop.get("constraints_or_limitations", "Institutional sections will become more detailed as additional data feeds are connected."))
    ], min_h=76)
    p.finish()

def render_kpi_dashboard_page(c, ctx, page_spec):
    k = ctx.get("kpis", {}) or {}
    t = ctx.get("targets", {}) or {}
    p = PageComposer(c, ctx, page_spec)

    tiles = [
        ("Attendance", pct(k.get("attendance_rate"))),
        ("Retention", pct(k.get("retention_rate"))),
        ("Parent Satisfaction", num(k.get("parent_satisfaction"))),
        ("Incident Rate / 100", num(k.get("incident_rate_per_100"))),
        ("Weekly Artifact Completion", pct(k.get("weekly_artifact_completion"))),
        ("Program Health Score", num(k.get("program_health_score"))),
    ]
    p.metric_tiles(tiles, cols=3)

    rows = [
        ["Attendance", pct(k.get("attendance_rate")), pct(t.get("attendance_rate_target"))],
        ["Retention", pct(k.get("retention_rate")), pct(t.get("retention_rate_target"))],
        ["Parent Satisfaction", num(k.get("parent_satisfaction")), num(t.get("parent_satisfaction_target"))],
        ["Incident Rate / 100", num(k.get("incident_rate_per_100")), num(t.get("incident_rate_per_100_max"))],
        ["Weekly Artifact Completion", pct(k.get("weekly_artifact_completion")), pct(t.get("weekly_artifact_completion_target"))],
    ]
    p.table("KPI Comparison Table", ["Metric", "Actual", "Target"], rows, [52, 24, 24], row_h=19)
    p.finish()

def render_outcome_performance_page(c, ctx, page_spec):
    k = ctx.get("kpis", {}) or {}
    t = ctx.get("targets", {}) or {}
    p = PageComposer(c, ctx, page_spec)

    def variance(actual, target):
        try:
            return float(actual) - float(target)
        except Exception:
            return 0.0

    rows = [
        ["Attendance", pct(k.get("attendance_rate")), pct(t.get("attendance_rate_target")), f"{variance(k.get('attendance_rate'), t.get('attendance_rate_target'))*100:.1f} pts"],
        ["Retention", pct(k.get("retention_rate")), pct(t.get("retention_rate_target")), f"{variance(k.get('retention_rate'), t.get('retention_rate_target'))*100:.1f} pts"],
        ["Parent Satisfaction", num(k.get("parent_satisfaction")), num(t.get("parent_satisfaction_target")), f"{variance(k.get('parent_satisfaction'), t.get('parent_satisfaction_target')):.2f}"],
        ["Incident Rate / 100", num(k.get("incident_rate_per_100")), num(t.get("incident_rate_per_100_max")), f"{variance(k.get('incident_rate_per_100'), t.get('incident_rate_per_100_max')):.2f}"],
        ["Weekly Artifact Completion", pct(k.get("weekly_artifact_completion")), pct(t.get("weekly_artifact_completion_target")), f"{variance(k.get('weekly_artifact_completion'), t.get('weekly_artifact_completion_target'))*100:.1f} pts"],
    ]
    p.table("Actual vs Target Table", ["Metric", "Actual", "Target", "Variance"], rows, [42, 18, 18, 14], row_h=19)

    bars = [
        ("Attendance", float(t.get("attendance_rate_target", 0))*100, float(k.get("attendance_rate", 0))*100),
        ("Retention", float(t.get("retention_rate_target", 0))*100, float(k.get("retention_rate", 0))*100),
        ("Parent Satisfaction", float(t.get("parent_satisfaction_target", 0))*10, float(k.get("parent_satisfaction", 0))*10),
        ("Incident Rate / 100", float(t.get("incident_rate_per_100_max", 0))*10, float(k.get("incident_rate_per_100", 0))*10),
        ("Weekly Artifact Completion", float(t.get("weekly_artifact_completion_target", 0))*100, float(k.get("weekly_artifact_completion", 0))*100),
    ]
    p.bar_compare("Institutional Comparison Visual", bars, max_value=100)
    p.finish()

def render_trend_analysis_page(c, ctx, page_spec):
    ta = ctx.get("trend_analysis", {}) or {}
    periods = ta.get("periods") or ["W1", "W2", "W3", "W4"]
    series = ta.get("series") or [
        {"metric_label": "Attendance", "values": [0.86, 0.88, 0.89, 0.892]},
        {"metric_label": "Retention", "values": [0.79, 0.77, 0.76, 0.75]},
        {"metric_label": "Incident Rate / 100", "values": [4.8, 5.0, 5.1, 5.14]},
    ]
    variance_summary = ta.get("variance_summary") or [
        {"metric_label": "Attendance", "current": 0.892, "target": 0.85, "direction": "above"},
        {"metric_label": "Retention", "current": 0.75, "target": 0.78, "direction": "below"},
        {"metric_label": "Incident Rate / 100", "current": 5.14, "target": 5.0, "direction": "above"},
    ]
    p = PageComposer(c, ctx, page_spec)
    p.trend_panel("Trend Chart", periods, series)

    rows = []
    for item in variance_summary[:3]:
        label = item.get("metric_label", item.get("metric_key", "-"))
        current = item.get("current", 0)
        target = item.get("target", 0)
        rows.append([
            label,
            f"{float(current)*100:.1f}%" if label.lower() != "incident rate / 100" else f"{float(current):.2f}",
            f"{float(target)*100:.1f}%" if label.lower() != "incident rate / 100" else f"{float(target):.2f}",
            item.get("direction", "-"),
        ])
    p.table("Variance Summary", ["Metric", "Current", "Target", "Variance"], rows, [44, 18, 18, 20], row_h=19)
    p.card("Trend Summary", [safe(ta.get("trend_summary", "Trend view is currently based on the latest available reporting snapshot and will become more detailed as historical series are connected."))], min_h=54)
    p.finish()

def render_evidence_scorecard_page(c, ctx, page_spec):
    oscore = ctx.get("outcome_scorecard", {}) or {}
    metrics = oscore.get("metrics") or []
    p = PageComposer(c, ctx, page_spec)
    p.metric_banner("Evidence Score Summary", f"Overall Institutional Score: {safe(oscore.get('overall_score', 40))}", tone="warn")

    rows = []
    for m in metrics:
        label = m.get("metric_label", m.get("metric_key", "-"))
        actual = m.get("actual")
        target = m.get("target")
        def fmt(v):
            try:
                fv = float(v)
                if fv <= 1 and "Satisfaction" not in label and "Incident" not in label:
                    return pct(fv)
                return num(fv)
            except Exception:
                return safe(v)
        rows.append([
            label, fmt(actual), fmt(target),
            safe(m.get("weight", "-")),
            safe(m.get("notes", "-")),
            "PASS" if m.get("pass") else "FAIL"
        ])
    if not rows:
        rows = [["Attendance", "89.2%", "85.0%", "-", "-", "PASS"], ["Retention", "75.0%", "78.0%", "-", "-", "FAIL"]]
    p.table("Metric-Level Evidence Scorecard", ["Metric", "Actual", "Target", "Weight", "Notes", "Result"], rows, [28, 12, 12, 10, 26, 12], row_h=19)
    p.finish()

def render_operational_integrity_page(c, ctx, page_spec):
    oi = ctx.get("operational_integrity", {}) or {}
    p = PageComposer(c, ctx, page_spec)
    p.metric_banner("Verification Status", safe(oi.get("verification_status", "Needs Review")), tone="bad")

    rows = [
        ["Events Seen After Filter", safe(oi.get("events_seen_after_filter", 0))],
        ["Canonical Events Used", safe(oi.get("canonical_events_used", 0))],
        ["Legacy Events Ignored", safe(oi.get("legacy_events_ignored", 0))],
        ["Manual Override Rate", safe(oi.get("manual_override_rate", 0))],
        ["p95 Duration (ms)", safe(oi.get("p95_duration_ms", "-"))],
        ["Program Health Score", safe(oi.get("program_health_score", 0.0))],
    ]
    p.table("Integrity Indicators", ["Indicator", "Value"], rows, [70, 30], row_h=19)
    p.card("Integrity Summary", [safe(oi.get("integrity_summary", "Operational integrity indicators are present and should be strengthened as the verification layer matures."))], min_h=54)
    flags = oi.get("integrity_flags") or ["Verification layer is still developing.", "Institutional integrity depth should increase before large-scale deployment."]
    p.card("Integrity Flags", [f"• {f}" for f in flags[:3]], min_h=58)
    p.finish()

def render_risk_analysis_page(c, ctx, page_spec):
    ra = ctx.get("risk_analysis", {}) or {}
    p = PageComposer(c, ctx, page_spec)
    p.risk_split(
        safe(ra.get("overall_risk_level", "Moderate")),
        safe(ra.get("risk_summary", "Operational risk is elevated and should be addressed before expansion."))
    )
    regs = ra.get("risk_register") or [
        {"risk_type": "Outcome", "title": "Retention below target", "severity": "High", "owner": "Program Ops", "status": "Open"},
        {"risk_type": "Outcome", "title": "Incident rate pressure", "severity": "Moderate", "owner": "Site Lead", "status": "Monitoring"},
    ]
    rows = []
    for r in regs:
        rows.append([
            safe(r.get("risk_type") or r.get("type") or "-"),
            safe(r.get("title", "-")),
            safe(r.get("severity", "-")),
            safe(r.get("owner", "-")),
            safe(r.get("status", "-")),
        ])
    p.table("Risk Register", ["Type", "Title", "Severity", "Owner", "Status"], rows, [20, 42, 14, 14, 10], row_h=19)
    p.finish()

def render_funding_recommendation_page(c, ctx, page_spec):
    fr = ctx.get("funding_recommendation", {}) or {}
    p = PageComposer(c, ctx, page_spec)
    p.metric_banner("Recommendation Type", safe(fr.get("recommendation_type", "Conditional Continue")), tone="warn")
    p.card("Recommendation Summary", [safe(fr.get("recommendation_summary", "Add retention intervention checkpoints for at-risk participants and monitor weekly exit reasons."))], min_h=60)
    p.card("Justification", [safe(fr.get("justification", "Operational risk is elevated and should be addressed before expansion."))], min_h=60)
    p.metric_banner("Funding Posture", safe(fr.get("funding_posture", "Maintain")), tone="warn")
    p.card("Confidence and Effective Period", [safe(fr.get("confidence_statement", "Confidence is moderate pending additional institutional validation.")), f"Effective Period: {safe(fr.get('effective_period', 'Next 90 days'))}"], min_h=58)
    p.finish()

def render_funding_conditions_page(c, ctx, page_spec):
    raw_fc = ctx.get("funding_conditions")
    if isinstance(raw_fc, dict):
        summary = raw_fc.get("summary", "These conditions define what must be achieved before continuation without restriction or broader scale approval.")
        conditions = raw_fc.get("conditions") or []
    elif isinstance(raw_fc, list):
        summary = "These conditions define what must be achieved before continuation without restriction or broader scale approval."
        conditions = raw_fc
    else:
        summary = "These conditions define what must be achieved before continuation without restriction or broader scale approval."
        conditions = []

    if not conditions:
        conditions = [
            {"condition": "Retention stabilization", "owner": "Program Ops", "due": "2026-06-30", "status": "Open", "measure": "Retention meets target"},
            {"condition": "Incident monitoring improvement", "owner": "Site Lead", "due": "2026-06-30", "status": "In Progress", "measure": "Incident rate at or below threshold"},
        ]

    p = PageComposer(c, ctx, page_spec)
    p.card("Conditions Summary", [summary], min_h=52)

    rows = []
    for cnd in conditions:
        if not isinstance(cnd, dict):
            continue
        rows.append([
            safe(cnd.get("condition") or cnd.get("title") or "-"),
            safe(cnd.get("owner", "-")),
            safe(cnd.get("due") or cnd.get("due_date") or "-")[:10],
            safe(cnd.get("status", "-")),
            safe(cnd.get("measure") or cnd.get("success_measure") or "-"),
        ])
    p.table("Condition Table", ["Condition", "Owner", "Due", "Status", "Success Measure"], rows, [34, 14, 12, 12, 28], row_h=19)
    p.card("Status Legend", ["Open = not yet satisfied   |   In Progress = active corrective work   |   Closed = condition met"], min_h=44)
    p.finish()

def render_improvement_plan_page(c, ctx, page_spec):
    raw_plan = ctx.get("improvement_plan_90d")
    raw_milestones = ctx.get("timeline_milestones")

    if isinstance(raw_plan, dict):
        actions = raw_plan.get("actions") or []
    elif isinstance(raw_plan, list):
        actions = raw_plan
    else:
        actions = []

    if not actions:
        actions = [
            {"action_title": "Weekly retention review", "owner": "Program Ops", "priority": "High", "related_metric": "Retention", "due_date": "2026-05-01"},
            {"action_title": "Artifact completion intervention", "owner": "Curriculum Lead", "priority": "High", "related_metric": "Weekly Artifact Completion", "due_date": "2026-05-15"},
        ]

    if isinstance(raw_milestones, list) and raw_milestones:
        milestones = [(safe(m.get("title", "-")), safe(m.get("date", "-"))[:10]) if isinstance(m, dict) else ("-", "-") for m in raw_milestones[:3]]
    else:
        milestones = [
            ("Retention checkpoint active", "2026-04-20"),
            ("Midpoint corrective review", "2026-05-30"),
            ("90-day reassessment", "2026-06-30"),
        ]

    rows = []
    for a in actions:
        rows.append([
            safe(a.get("action_title") or a.get("action") or "-"),
            safe(a.get("owner", "-")),
            safe(a.get("priority", "-")),
            safe(a.get("related_metric") or a.get("metric") or "-"),
            safe(a.get("due_date") or a.get("due") or "-")[:10],
        ])

    p = PageComposer(c, ctx, page_spec)
    p.table("90-Day Improvement Plan", ["Action", "Owner", "Priority", "Related Metric", "Due"], rows, [34, 16, 10, 22, 12], row_h=19)
    p.timeline("90-Day Milestone Timeline", milestones)
    p.finish()

def render_glossary_and_notes_page(c, ctx, page_spec):
    raw = ctx.get("glossary_terms")
    methodology = ctx.get("methodology_notes", {}) or {}
    data_notes = ctx.get("data_notes", {}) or {}

    terms = []
    if isinstance(raw, list):
        for t in raw[:6]:
            if isinstance(t, dict):
                terms.append([
                    safe(t.get("term", "-")),
                    safe(t.get("definition", "-")),
                    safe(t.get("category", "-")),
                ])
    if not terms:
        terms = [
            ["LOO", "Outcome scoring layer.", "Metrics"],
            ["LOE", "Operational integrity layer.", "Integrity"],
            ["Funding Readiness", "Degree of readiness for continuation or scale.", "Funding"],
        ]

    method_text = safe(methodology.get("scoring_method_summary", "The institutional score is based on target comparison and evidence-level pass/fail logic."))
    note_text = safe(data_notes.get("rounding_rules", "Percentages are rounded for readability in the institutional report."))

    p = PageComposer(c, ctx, page_spec)
    p.table("Glossary", ["Term", "Definition", "Category"], terms, [18, 58, 24], row_h=20)
    p.card("Methodology Notes", [method_text], min_h=52)
    p.card("Report Notes", [note_text], min_h=48)
    p.finish()
