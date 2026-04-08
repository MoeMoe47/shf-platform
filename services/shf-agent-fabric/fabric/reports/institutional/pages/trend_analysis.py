from ..layout import TOP_Y, X0, CONTENT_W, CARD_ALT, rr, txt, draw_standard_header, draw_standard_footer, draw_table, draw_trend_panel

def render_trend_analysis_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])
    ta = ctx.get("trend_analysis", {})
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

    y = TOP_Y
    rr(c, X0, y - 36, CONTENT_W, 36, 13, CARD_ALT, "#D9E1EA")
    txt(c, X0 + 16, y - 22, "Trend Summary View", 10, color="#B45309", font="Helvetica-Bold")
    y -= 48

    y = draw_trend_panel(c, X0, y, CONTENT_W, "Trend Chart", periods, series) - 10

    rows = []
    for item in variance_summary[:3]:
        rows.append([
            item.get("metric_label", item.get("metric_key", "-")),
            f"{float(item.get('current', 0))*100:.1f}%" if item.get("metric_label","").lower() != "incident rate / 100" else f"{float(item.get('current', 0)):.2f}",
            f"{float(item.get('target', 0))*100:.1f}%" if item.get("metric_label","").lower() != "incident rate / 100" else f"{float(item.get('target', 0)):.2f}",
            item.get("direction", "-"),
        ])
    y = draw_table(c, X0, y, CONTENT_W, "Variance Summary", ["Metric", "Current", "Target", "Variance"], rows, [44, 18, 18, 20], row_h=18) - 10

    rr(c, X0, y - 52, CONTENT_W, 52, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Trend Summary", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 38, ta.get("trend_summary", "Trend view is currently based on the latest available reporting snapshot and will become more detailed as historical series are wired in."), 8, color="#475467")

    draw_standard_footer(c, ctx, page_spec["footer_label"])
