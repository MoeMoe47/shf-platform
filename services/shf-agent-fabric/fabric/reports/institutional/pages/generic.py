from ..layout import draw_standard_header, draw_standard_footer, TOP_Y, X0, CONTENT_W, rr, txt

def render_generic_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    y = TOP_Y
    rr(c, X0, y - 86, CONTENT_W, 86, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 22, "Renderer Status", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 42, "Status: scaffolded", 8, color="#475467")
    txt(c, X0 + 16, y - 56, f"Page ID: {page_spec['page_id']}", 8, color="#475467")
    txt(c, X0 + 16, y - 70, "Next step: replace placeholder block with page-specific table/chart layout.", 8, color="#475467")

    draw_standard_footer(c, ctx, page_spec["footer_label"])
