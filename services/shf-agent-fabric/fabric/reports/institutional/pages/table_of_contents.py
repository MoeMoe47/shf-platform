from ..layout import TOP_Y, X0, CONTENT_W, txt, txt_r, hline, draw_standard_header, draw_standard_footer

def render_table_of_contents_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])

    items = [
        ("1. Cover", "1"),
        ("2. Decision Summary", "2"),
        ("3. Table of Contents", "3"),
        ("4. Executive Summary", "4"),
        ("5. Program Profile", "5"),
        ("6. Population Served and Operating Context", "6"),
        ("7. KPI Dashboard Overview", "7"),
        ("8. Outcome Performance: Actual vs Target", "8"),
        ("9. Trend Analysis", "9"),
        ("10. Evidence Scorecard", "10"),
        ("11. Operational Integrity and Verification", "11"),
        ("12. Risk Analysis", "12"),
        ("13. Funding Recommendation", "13"),
        ("14. Conditions for Continuation or Scale", "14"),
        ("15. 90-Day Improvement Plan and Milestones", "15"),
        ("16. Glossary and Report Notes", "16"),
    ]

    y = TOP_Y
    txt(c, X0, y - 8, "Institutional Report Contents", 10, font="Helvetica-Bold")
    hline(c, X0, X0 + CONTENT_W, y - 18)

    y -= 38
    for label, page_num in items:
        txt(c, X0 + 2, y, label, 8.5, color="#1F2937")
        txt_r(c, X0 + CONTENT_W - 2, y, page_num, 8.5, color="#475467")
        y -= 18

    draw_standard_footer(c, ctx, page_spec["footer_label"])
