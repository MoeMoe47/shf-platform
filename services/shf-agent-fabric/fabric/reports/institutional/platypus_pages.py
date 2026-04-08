from __future__ import annotations

from .platypus_blocks import card, metric_banner, data_table, spacer

def build_program_profile_story(ctx: dict):
    run = ctx.get("run", {}) or {}
    prof = ctx.get("program_profile", {}) or {}

    rows = [
        ["Program Name", prof.get("program_name", run.get("name", "Pilot Run")), "Delivery Model", prof.get("delivery_model", "Community-based pilot delivery")],
        ["Program Type", prof.get("program_type", "Workforce and youth development pilot"), "Pilot Stage", prof.get("pilot_stage", run.get("mode", "PILOT"))],
        ["Operator", prof.get("operator_name", run.get("owner", "SHF Pilot Ops")), "Reporting Start", run.get("start_ts", "-")],
        ["Site Name", prof.get("site_name", run.get("site", "-")), "Reporting End", run.get("end_ts", "-")],
    ]
    return [
        data_table("Program Profile", ["Field", "Value", "Field", "Value"], rows),
        spacer(),
        card("Program Description", [prof.get("program_description", "Pilot report prepared for institutional funding-readiness review.")]),
    ]

def build_population_context_story(ctx: dict):
    pop = ctx.get("population_context", {}) or {}
    return [
        card("Population Served", [pop.get("population_served_summary", "Participants are served through a community-centered pilot environment designed to track engagement and stability.")]),
        spacer(),
        card("Operating Context", [pop.get("community_context", "This pilot is intended to demonstrate measurable outcome performance before broader replication or scale.")]),
        spacer(),
        card("Implementation Notes and Limitations", [
            pop.get("implementation_notes", "This reporting period reflects an active pilot review window."),
            pop.get("constraints_or_limitations", "Institutional sections will become more detailed as additional data feeds are connected."),
        ]),
    ]

def build_funding_recommendation_story(ctx: dict):
    fr = ctx.get("funding_recommendation", {}) or {}
    return [
        metric_banner("Recommendation Type", fr.get("recommendation_type", "Conditional Continue"), tone="warn"),
        spacer(),
        card("Recommendation Summary", [fr.get("recommendation_summary", "Add retention intervention checkpoints for at-risk participants and monitor weekly exit reasons.")]),
        spacer(),
        card("Justification", [fr.get("justification", "Operational risk is elevated and should be addressed before expansion.")]),
        spacer(),
        metric_banner("Funding Posture", fr.get("funding_posture", "Maintain"), tone="warn"),
        spacer(),
        card("Confidence and Effective Period", [
            fr.get("confidence_statement", "Confidence is moderate pending additional institutional validation."),
            f"Effective Period: {fr.get('effective_period', 'Next 90 days')}",
        ]),
    ]

def build_funding_conditions_story(ctx: dict):
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

    rows = []
    for cnd in conditions:
        if not isinstance(cnd, dict):
            continue
        rows.append([
            cnd.get("condition") or cnd.get("title") or "-",
            cnd.get("owner", "-"),
            (cnd.get("due") or cnd.get("due_date") or "-")[:10],
            cnd.get("status", "-"),
            cnd.get("measure") or cnd.get("success_measure") or "-",
        ])

    return [
        card("Conditions Summary", [summary]),
        spacer(),
        data_table("Condition Table", ["Condition", "Owner", "Due", "Status", "Success Measure"], rows),
        spacer(),
        card("Status Legend", ["Open = not yet satisfied   |   In Progress = active corrective work   |   Closed = condition met"]),
    ]
