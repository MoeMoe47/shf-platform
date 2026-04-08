from ..layout import TOP_Y, X0, CONTENT_W, rr, txt, draw_standard_header, draw_standard_footer, draw_table

def render_glossary_notes_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    glossary = ctx.get("glossary_and_notes", {}) or {}
    terms = glossary.get("terms") or [
        {"term": "LOO", "definition": "Outcome scoring layer.", "category": "Metrics"},
        {"term": "LOE", "definition": "Operational integrity layer.", "category": "Integrity"},
        {"term": "Funding Readiness", "definition": "Degree of readiness for continuation or scale.", "category": "Funding"},
    ]
    methodology = glossary.get("methodology_notes", "The institutional score is based on target comparison and evidence-level pass/fail logic. This report supports decision-making and should be interpreted with pilot-stage context in mind.")
    report_notes = glossary.get("report_notes", "Percentages are rounded for readability in the institutional report.")

    y = TOP_Y

    term_rows = []
    for t in terms:
        term_rows.append([
            t.get("term", "-"),
            t.get("definition", "-"),
            t.get("category", "-"),
        ])

    bottom = draw_table(
        c, X0, y, CONTENT_W, "Glossary",
        ["Term", "Definition", "Category"],
        term_rows,
        [18, 58, 24],
        row_h=20
    )

    y2 = bottom - 12
    rr(c, X0, y2 - 52, CONTENT_W, 52, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y2 - 20, "Methodology Notes", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y2 - 37, methodology, 8, color="#475467")

    y3 = y2 - 66
    rr(c, X0, y3 - 48, CONTENT_W, 48, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y3 - 18, "Report Notes", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y3 - 34, report_notes, 8, color="#475467")

    draw_standard_footer(c, ctx, page_spec["footer_label"])
