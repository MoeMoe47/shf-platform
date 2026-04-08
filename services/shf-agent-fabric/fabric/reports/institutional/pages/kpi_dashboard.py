from ..layout import TOP_Y, X0, CONTENT_W, draw_standard_header, draw_standard_footer, draw_metric_tiles, draw_table, pct, num

def render_kpi_dashboard_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    k = ctx.get("kpis", {})
    t = ctx.get("targets", {})

    y = TOP_Y
    tiles = [
        ("Attendance", pct(k.get("attendance_rate"))),
        ("Retention", pct(k.get("retention_rate"))),
        ("Parent Satisfaction", num(k.get("parent_satisfaction"))),
        ("Incident Rate / 100", num(k.get("incident_rate_per_100"))),
        ("Weekly Artifact Completion", pct(k.get("weekly_artifact_completion"))),
        ("Program Health Score", num(k.get("program_health_score"))),
    ]
    bottom = draw_metric_tiles(c, X0, y, CONTENT_W, tiles, cols=3)

    rows = [
        ["Attendance", pct(k.get("attendance_rate")), pct(t.get("attendance_rate_target"))],
        ["Retention", pct(k.get("retention_rate")), pct(t.get("retention_rate_target"))],
        ["Parent Satisfaction", num(k.get("parent_satisfaction")), num(t.get("parent_satisfaction_target"))],
        ["Incident Rate / 100", num(k.get("incident_rate_per_100")), num(t.get("incident_rate_per_100_max"))],
        ["Weekly Artifact Completion", pct(k.get("weekly_artifact_completion")), pct(t.get("weekly_artifact_completion_target"))],
    ]
    draw_table(c, X0, bottom - 16, CONTENT_W, "KPI Comparison Table", ["Metric", "Actual", "Target"], rows, [52, 24, 24], row_h=18)

    draw_standard_footer(c, ctx, page_spec["footer_label"])
