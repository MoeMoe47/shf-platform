from ..layout import TOP_Y, X0, CONTENT_W, CARD_BG, CARD_ALT, draw_standard_header, draw_standard_footer, rr, txt, paragraph

def _context_card(c, y, title, text):
    rr(c, X0, y - 64, CONTENT_W, 64, 13, CARD_BG, "#D9E1EA")
    txt(c, X0 + 16, y - 20, title, 10, font="Helvetica-Bold")
    paragraph(c, X0 + 16, y - 40, text, 88, 9, 12, "#475467")
    return y - 80

def render_population_context_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])
    pc = ctx.get("population_context", {})

    y = TOP_Y
    y = _context_card(c, y, "Population Served", pc.get("population_served_summary", "Participants are served through a community-centered pilot environment designed to track engagement and stability."))
    y = _context_card(c, y, "Operating Context", pc.get("community_context", "This pilot is intended to demonstrate measurable outcome performance before broader replication or scale."))
    _context_card(
        c,
        y,
        "Implementation Notes and Limitations",
        (pc.get("implementation_notes", "This reporting period reflects an active pilot review window.") + " " + pc.get("constraints_or_limitations", "Some institutional sections are still being enriched as additional data feeds are connected.")).strip()
    )

    draw_standard_footer(c, ctx, page_spec["footer_label"])
