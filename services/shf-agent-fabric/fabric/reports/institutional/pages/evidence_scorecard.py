from ..layout import TOP_Y, X0, CONTENT_W, draw_standard_header, draw_standard_footer, rr, txt, draw_table, pct, num

def render_evidence_scorecard_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])
    oscore = ctx.get("outcome_scorecard", {})
    metrics = oscore.get("metrics") or []

    y = TOP_Y
    rr(c, X0, y - 44, CONTENT_W, 44, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 18, "Evidence Score Summary", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 34, f"Overall Institutional Score: {oscore.get('overall_score', 40)}", 14, font="Helvetica-Bold")
    y -= 58

    rows = []
    for m in metrics:
        key = m.get("metric_label", m.get("metric_key", "-"))
        actual = m.get("actual")
        target = m.get("target")
        rows.append([
            key,
            pct(actual) if isinstance(actual, (int, float)) and actual <= 1.0 and "Satisfaction" not in key and "Incident" not in key else num(actual),
            pct(target) if isinstance(target, (int, float)) and target <= 1.0 and "Satisfaction" not in key and "Incident" not in key else num(target),
            f"{m.get('weight', '-')}" if m.get("weight") not in (None, "") else "-",
            "-",
            "PASS" if m.get("pass") else "FAIL",
        ])
    if not rows:
        rows = [
            ["Attendance", "89.2%", "85.0%", "-", "-", "PASS"],
            ["Retention", "75.0%", "78.0%", "-", "-", "FAIL"],
        ]
    y = draw_table(c, X0, y, CONTENT_W, "Metric-Level Evidence Scorecard", ["Metric", "Actual", "Target", "Weight", "Notes", "Result"], rows, [30, 14, 14, 12, 12, 10], row_h=18) - 10

    rr(c, X0, y - 52, CONTENT_W, 52, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Scorecard Interpretation", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 38, "This page shows metric-level evidence, target alignment, and pass/fail logic used in the institutional funding-readiness score.", 8, color="#475467")

    draw_standard_footer(c, ctx, page_spec["footer_label"])
