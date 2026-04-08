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
    if title:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor("#111827"))
        c.drawString(x + 12, y_top - 18, title)

def _para(c, x, y, text, font="Helvetica", size=9.5, color="#111827", width=470, leading=12):
    c.setFont(font, size)
    c.setFillColor(colors.HexColor(color))
    t = c.beginText(x, y)
    t.setLeading(leading)
    words = _safe(text).split()
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if c.stringWidth(test, font, size) <= width:
            line = test
        else:
            t.textLine(line)
            line = word
    if line:
        t.textLine(line)
    c.drawText(t)

def render_funding_recommendation_page(c, ctx, page_spec):
    fr = ctx.get("funding_recommendation", {}) or {}
    _header(c, page_spec.get("title", "Funding Recommendation"), ctx)

    type_val = _safe(fr.get("recommendation_type") or fr.get("type") or "Conditional Continue")
    summary = _safe(fr.get("recommendation_summary") or fr.get("summary") or "No recommendation summary provided.")
    justification = _safe(fr.get("justification") or "No justification provided.")
    posture = _safe(fr.get("funding_posture") or fr.get("posture") or "Maintain")
    confidence = _safe(fr.get("confidence") or "Moderate")
    effective = _safe(fr.get("effective_period") or "Next 90 days")

    y = PAGE_H - 104
    h1 = 58
    _card(c, LEFT, y, RIGHT - LEFT, h1, "Recommendation Type")
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(LEFT + 12, y - 40, type_val)

    y -= h1 + 14
    h2 = 74
    _card(c, LEFT, y, RIGHT - LEFT, h2, "Recommendation Summary")
    _para(c, LEFT + 12, y - 36, summary, width=RIGHT - LEFT - 24)

    y -= h2 + 14
    h3 = 74
    _card(c, LEFT, y, RIGHT - LEFT, h3, "Justification")
    _para(c, LEFT + 12, y - 36, justification, width=RIGHT - LEFT - 24)

    y -= h3 + 14
    h4 = 58
    _card(c, LEFT, y, RIGHT - LEFT, h4, "Funding Posture")
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor("#C46A2F"))
    c.drawString(LEFT + 12, y - 40, posture)

    y -= h4 + 14
    h5 = 70
    _card(c, LEFT, y, RIGHT - LEFT, h5, "Confidence and Effective Period")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(LEFT + 12, y - 34, f"Confidence: {confidence}")
    c.drawString(LEFT + 12, y - 50, f"Effective Period: {effective}")

    _footer(c, page_spec, ctx)
