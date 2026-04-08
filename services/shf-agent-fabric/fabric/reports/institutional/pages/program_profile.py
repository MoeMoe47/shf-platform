from __future__ import annotations

from reportlab.lib import colors

PAGE_W = 612
PAGE_H = 792
LEFT = 54
RIGHT = 558
TOP = 748
BOTTOM = 42

def _safe(v, default="-"):
    if v is None:
        return default
    s = str(v).strip()
    return s if s else default

def _meta(ctx):
    run = ctx.get("run", {}) or {}
    return {
        "site": _safe(run.get("site")),
        "app": _safe(run.get("app_id") or run.get("app")),
        "run_id": _safe(run.get("run_id")),
        "generated_ts": _safe(ctx.get("generated_ts")),
    }

def _header(c, title, ctx):
    meta = _meta(ctx)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(LEFT, PAGE_H - 48, _safe(title))

    c.setFont("Helvetica", 8.5)
    c.setFillColor(colors.HexColor("#6B7280"))
    c.drawString(
        LEFT,
        PAGE_H - 66,
        f'{meta["generated_ts"]}  ·  Site: {meta["site"]}  ·  App: {meta["app"]}'
    )

    c.setStrokeColor(colors.HexColor("#D1D5DB"))
    c.setLineWidth(1)
    c.line(LEFT, PAGE_H - 78, RIGHT, PAGE_H - 78)

def _footer(c, page_spec, ctx):
    run_id = _safe((ctx.get("run", {}) or {}).get("run_id"))
    label = _safe(page_spec.get("footer_label", ""))
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.setLineWidth(1)
    c.line(LEFT, BOTTOM + 14, RIGHT, BOTTOM + 14)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#9CA3AF"))
    c.drawString(LEFT, BOTTOM, "Silicon Heartland Foundation · Institutional Report")
    c.drawCentredString((LEFT + RIGHT) / 2, BOTTOM, f"Run: {run_id}")
    c.drawRightString(RIGHT, BOTTOM, label)

def _card(c, x, y_top, w, h, title):
    c.setStrokeColor(colors.HexColor("#D1D5DB"))
    c.setFillColor(colors.white)
    c.roundRect(x, y_top - h, w, h, 10, stroke=1, fill=1)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(x + 12, y_top - 18, title)

def _row(c, x1, x2, y, l1, v1, l2, v2):
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#6B7280"))
    c.drawString(x1, y, _safe(l1))
    c.drawString(x2, y, _safe(l2))

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(x1 + 104, y, _safe(v1))
    c.drawString(x2 + 104, y, _safe(v2))

def render_program_profile_page(c, ctx, page_spec):
    prof = ctx.get("program_profile", {}) or {}
    _header(c, page_spec.get("title", "Program Profile"), ctx)

    # Main program profile card
    card_x = LEFT
    card_y = PAGE_H - 104
    card_w = RIGHT - LEFT
    card_h = 172
    _card(c, card_x, card_y, card_w, card_h, "Program Profile")

    left_x = card_x + 18
    right_x = card_x + 264

    _row(c, left_x, right_x, card_y - 42,
         "Program Name", prof.get("program_name"),
         "Delivery Model", prof.get("delivery_model"))
    _row(c, left_x, right_x, card_y - 72,
         "Program Type", prof.get("program_type"),
         "Pilot Stage", prof.get("pilot_stage"))
    _row(c, left_x, right_x, card_y - 102,
         "Operator", prof.get("operator"),
         "Reporting Start", prof.get("reporting_start"))
    _row(c, left_x, right_x, card_y - 132,
         "Site Name", prof.get("site_name"),
         "Reporting End", prof.get("reporting_end"))

    # Description card
    desc = _safe(
        prof.get("program_description")
        or prof.get("description")
        or "No description provided."
    )
    desc_y = card_y - card_h - 18
    _card(c, LEFT, desc_y, RIGHT - LEFT, 74, "Program Description")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(colors.HexColor("#111827"))
    text = c.beginText(LEFT + 12, desc_y - 34)
    text.setLeading(12)
    width_limit = RIGHT - LEFT - 24
    words = desc.split()
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if c.stringWidth(test, "Helvetica", 9.5) <= width_limit:
            line = test
        else:
            text.textLine(line)
            line = word
    if line:
        text.textLine(line)
    c.drawText(text)

    _footer(c, page_spec, ctx)
