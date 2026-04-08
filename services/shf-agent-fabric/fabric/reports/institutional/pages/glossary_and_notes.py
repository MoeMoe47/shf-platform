from ..layout import TOP_Y, X0, CONTENT_W, draw_standard_header, draw_standard_footer, draw_table, rr, txt

def render_glossary_and_notes_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])
    glossary = ctx.get("glossary_terms") or []

    y = TOP_Y
    rows = [[g.get("term","-"), g.get("definition","-"), g.get("category","-")] for g in glossary[:6]]
    if not rows:
        rows = [
            ["LOO", "Outcome scoring layer.", "Metrics"],
            ["LOE", "Operational integrity layer.", "Integrity"],
            ["Funding Readiness", "Degree of readiness for continuation or scale.", "Funding"],
        ]
    y = draw_table(c, X0, y, CONTENT_W, "Glossary", ["Term", "Definition", "Category"], rows, [18, 58, 24], row_h=18) - 12

    rr(c, X0, y - 58, CONTENT_W, 58, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Methodology Notes", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 38, "The institutional score is based on target comparison and evidence-level pass/fail logic.", 8, color="#475467")
    txt(c, X0 + 16, y - 50, "This report supports decision-making and should be interpreted with pilot-stage context in mind.", 8, color="#475467")
    y -= 72

    rr(c, X0, y - 50, CONTENT_W, 50, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 18, "Report Notes", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 36, "Percentages are rounded for readability in the institutional report.", 8, color="#475467")

    draw_standard_footer(c, ctx, page_spec["footer_label"])
