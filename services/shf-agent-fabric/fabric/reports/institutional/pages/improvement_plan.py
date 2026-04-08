from ..layout import TOP_Y, X0, CONTENT_W, draw_standard_header, draw_standard_footer, draw_table, draw_simple_timeline

def render_improvement_plan_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    plan = ctx.get("improvement_plan", {}) or {}
    rows = plan.get("actions") or [
        {"action": "Weekly retention review", "owner": "Program Ops", "priority": "High", "metric": "Retention", "due": "2026-05-01"},
        {"action": "Artifact completion intervention", "owner": "Curriculum Lead", "priority": "High", "metric": "Weekly Artifact Completion", "due": "2026-05-15"},
    ]
    milestones = plan.get("milestones") or [
        ("Retention checkpoint active", "2026-04-20"),
        ("Midpoint corrective review", "2026-05-30"),
        ("90-day reassessment", "2026-06-30"),
    ]

    y = TOP_Y

    table_rows = []
    for r in rows:
        table_rows.append([
            r.get("action", "-"),
            r.get("owner", "-"),
            r.get("priority", "-"),
            r.get("metric", "-"),
            r.get("due", "-"),
        ])

    bottom = draw_table(
        c, X0, y, CONTENT_W, "90-Day Improvement Plan",
        ["Action", "Owner", "Priority", "Related Metric", "Due"],
        table_rows,
        [34, 16, 10, 22, 12],
        row_h=20
    )

    draw_simple_timeline(c, X0, bottom - 16, CONTENT_W, "90-Day Milestone Timeline", milestones)

    draw_standard_footer(c, ctx, page_spec["footer_label"])
