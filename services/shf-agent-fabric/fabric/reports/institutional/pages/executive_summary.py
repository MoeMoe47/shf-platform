from ..layout import TOP_Y, X0, CONTENT_W, rr, txt, paragraph, bullets, draw_standard_header, draw_standard_footer

def render_executive_summary_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    ex = ctx.get("executive_summary", {})
    summary = ex.get("summary", "Gladden Workforce + Youth Pilot shows fundable potential, but targeted improvement is needed before broader scale decisions.")
    strengths = ex.get("top_strengths") or ["Institutional strengths block scaffolded."]
    risks = ex.get("top_risks") or ["Operational risk is elevated (RED) and should be addressed before expansion."]
    rec = ex.get("recommendation_summary", "Add retention intervention checkpoints for at-risk participants and monitor weekly exit reasons.")

    y = TOP_Y

    # Summary
    rr(c, X0, y - 70, CONTENT_W, 70, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 22, "Executive Summary", 10, font="Helvetica-Bold")
    paragraph(c, X0 + 16, y - 40, summary, width_chars=95, size=8.5)
    y -= 86

    # Two-up cards
    gap = 12
    card_w = (CONTENT_W - gap) / 2
    card_h = 78

    rr(c, X0, y - card_h, card_w, card_h, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 22, "Top Strengths", 10, font="Helvetica-Bold")
    bullets(c, X0 + 16, y - 42, strengths, max_chars=28, line_gap=10)

    rr(c, X0 + card_w + gap, y - card_h, card_w, card_h, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + card_w + gap + 16, y - 22, "Top Risks", 10, font="Helvetica-Bold")
    bullets(c, X0 + card_w + gap + 16, y - 42, risks, max_chars=28, line_gap=10)

    y -= (card_h + 16)

    rr(c, X0, y - 58, CONTENT_W, 58, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Recommendation Summary", 10, font="Helvetica-Bold")
    paragraph(c, X0 + 16, y - 38, rec, width_chars=95, size=8.5)

    draw_standard_footer(c, ctx, page_spec["footer_label"])
