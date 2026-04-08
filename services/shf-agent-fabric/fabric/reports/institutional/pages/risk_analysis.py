from ..layout import TOP_Y, X0, CONTENT_W, rr, txt, draw_standard_header, draw_standard_footer, draw_table, draw_risk_heatmap

def render_risk_analysis_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    risk = ctx.get("risk_analysis", {}) or {}
    overall = risk.get("overall_risk_level", "Moderate")
    summary = risk.get("risk_summary", "Operational risk is elevated (RED) and should be addressed before expansion.")
    rows = risk.get("risk_register") or [
        {"type": "Outcome", "title": "Retention below target", "severity": "High", "owner": "Program Ops", "status": "Open"},
        {"type": "Outcome", "title": "Incident rate pressure", "severity": "Moderate", "owner": "Site Lead", "status": "Monitoring"},
    ]

    y = TOP_Y

    rr(c, X0, y - 52, CONTENT_W, 52, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Overall Risk Level", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 39, overall, 13, color="#C97A42", font="Helvetica-Bold")
    y -= 66

    gap = 12
    left_w = 190
    right_w = CONTENT_W - left_w - gap

    draw_risk_heatmap(c, X0, y, left_w, 96)

    rr(c, X0 + left_w + gap, y - 96, right_w, 96, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + left_w + gap + 16, y - 22, "Risk Summary", 10, font="Helvetica-Bold")
    txt(c, X0 + left_w + gap + 16, y - 42, summary, 8.5, color="#475467")
    y -= 112

    table_rows = []
    for r in rows:
        table_rows.append([
            r.get("type", "-"),
            r.get("title", "-"),
            r.get("severity", "-"),
            r.get("owner", "-"),
            r.get("status", "-"),
        ])

    draw_table(
        c, X0, y, CONTENT_W, "Risk Register",
        ["Type", "Title", "Severity", "Owner", "Status"],
        table_rows,
        [20, 42, 14, 14, 10],
        row_h=20
    )

    draw_standard_footer(c, ctx, page_spec["footer_label"])
