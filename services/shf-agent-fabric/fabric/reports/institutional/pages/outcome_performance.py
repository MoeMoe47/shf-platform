from ..layout import TOP_Y, X0, CONTENT_W, draw_standard_header, draw_standard_footer, draw_table, draw_compare_bars, pct, num

def render_outcome_performance_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    k = ctx.get("kpis", {})
    t = ctx.get("targets", {})

    def variance(actual, target):
        try:
            return float(actual) - float(target)
        except Exception:
            return 0.0

    y = TOP_Y
    rows = [
        ["Attendance", pct(k.get("attendance_rate")), pct(t.get("attendance_rate_target")), f"{variance(k.get('attendance_rate'), t.get('attendance_rate_target'))*100:.1f} pts"],
        ["Retention", pct(k.get("retention_rate")), pct(t.get("retention_rate_target")), f"{variance(k.get('retention_rate'), t.get('retention_rate_target'))*100:.1f} pts"],
        ["Parent Satisfaction", num(k.get("parent_satisfaction")), num(t.get("parent_satisfaction_target")), f"{variance(k.get('parent_satisfaction'), t.get('parent_satisfaction_target')):.2f}"],
        ["Incident Rate / 100", num(k.get("incident_rate_per_100")), num(t.get("incident_rate_per_100_max")), f"{variance(k.get('incident_rate_per_100'), t.get('incident_rate_per_100_max')):.2f}"],
        ["Weekly Artifact Completion", pct(k.get("weekly_artifact_completion")), pct(t.get("weekly_artifact_completion_target")), f"{variance(k.get('weekly_artifact_completion'), t.get('weekly_artifact_completion_target'))*100:.1f} pts"],
    ]
    y = draw_table(c, X0, y, CONTENT_W, "Actual vs Target Table", ["Metric", "Actual", "Target", "Variance"], rows, [42, 18, 18, 14], row_h=18) - 12

    bars = [
        ("Attendance", float(t.get("attendance_rate_target", 0))*100, float(k.get("attendance_rate", 0))*100),
        ("Retention", float(t.get("retention_rate_target", 0))*100, float(k.get("retention_rate", 0))*100),
        ("Parent Satisfaction", float(t.get("parent_satisfaction_target", 0))*10, float(k.get("parent_satisfaction", 0))*10),
        ("Incident Rate / 100", float(t.get("incident_rate_per_100_max", 0))*10, float(k.get("incident_rate_per_100", 0))*10),
        ("Weekly Artifact Completion", float(t.get("weekly_artifact_completion_target", 0))*100, float(k.get("weekly_artifact_completion", 0))*100),
    ]
    draw_compare_bars(c, X0, y, CONTENT_W, "Institutional Comparison Visual", bars, max_value=100)

    draw_standard_footer(c, ctx, page_spec["footer_label"])
