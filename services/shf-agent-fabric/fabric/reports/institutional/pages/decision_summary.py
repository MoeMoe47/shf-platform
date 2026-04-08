from ..layout import TOP_Y, X0, CONTENT_W, chip, rr, txt, paragraph, draw_standard_header, draw_standard_footer

def render_decision_summary_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    ds = ctx.get("decision_summary", {})
    y = TOP_Y

    score_label = ds.get("score_label", "RED")
    score_value = ds.get("score_value", 40)
    summary = ds.get("summary", "Gladden Workforce + Youth Pilot shows fundable potential, but targeted improvement is needed before broader scale decisions.")
    recommendation = ds.get("primary_recommendation", "Add retention intervention checkpoints for at-risk participants and monitor weekly exit reasons.")
    confidence = ds.get("confidence_level", "Moderate")

    chip_w = chip(c, X0, y - 6, score_label, "#F04438")
    txt(c, X0 + chip_w + 16, y - 10, f"Score: {score_value}", 17, font="Helvetica-Bold")
    paragraph(c, X0, y - 30, summary, width_chars=108, size=8.5)
    y -= 56

    # Primary recommendation
    box_h = 64
    rr(c, X0, y - box_h, CONTENT_W, box_h, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 22, "Primary Recommendation", 10, font="Helvetica-Bold")
    paragraph(c, X0 + 16, y - 40, recommendation, width_chars=95, size=8.5)
    y -= (box_h + 14)

    # Confidence
    box_h = 54
    rr(c, X0, y - box_h, CONTENT_W, box_h, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Confidence Level", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 38, confidence, 8.5, color="#475467")
    y -= (box_h + 14)

    draw_standard_footer(c, ctx, page_spec["footer_label"])
