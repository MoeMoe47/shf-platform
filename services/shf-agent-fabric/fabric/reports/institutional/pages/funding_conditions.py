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
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(x + 12, y_top - 18, title)

def render_funding_conditions_page(c, ctx, page_spec):
    raw_fc = ctx.get("funding_conditions")
    if not isinstance(raw_fc, list):
        raw_fc = []

    conditions = raw_fc[:6] if raw_fc else [
        {
            "condition": "Retention stabilization",
            "owner": "Program Ops",
            "due_date": "2026-06-30",
            "status": "Open",
            "success_measure": "Retention meets target",
        },
        {
            "condition": "Incident monitoring improvement",
            "owner": "Site Lead",
            "due_date": "2026-06-30",
            "status": "In Progress",
            "success_measure": "Incident rate at or below threshold",
        },
    ]

    _header(c, page_spec.get("title", "Conditions for Continuation or Scale"), ctx)

    y = PAGE_H - 104
    _card(c, LEFT, y, RIGHT - LEFT, 58, "Conditions Summary")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(
        LEFT + 12,
        y - 38,
        "These conditions define what must be achieved before continuation without restriction or broader scale approval."
    )

    y -= 72
    table_h = 170
    _card(c, LEFT, y, RIGHT - LEFT, table_h, "Condition Table")

    x = LEFT + 12
    top = y - 34
    cols = [
        ("Condition", x, 150),
        ("Owner", x + 160, 70),
        ("Due", x + 242, 60),
        ("Status", x + 310, 70),
        ("Success Measure", x + 388, 104),
    ]

    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(colors.HexColor("#6B7280"))
    for label, cx, _ in cols:
        c.drawString(cx, top, label)

    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.line(LEFT + 12, top - 6, RIGHT - 12, top - 6)

    row_y = top - 28
    c.setFont("Helvetica", 8.5)
    c.setFillColor(colors.HexColor("#111827"))

    for item in conditions:
        vals = [
            _safe(item.get("condition")),
            _safe(item.get("owner")),
            _safe(item.get("due_date"))[:10],
            _safe(item.get("status")),
            _safe(item.get("success_measure")),
        ]
        for (label, cx, w), value in zip(cols, vals):
            txt = value
            while c.stringWidth(txt, "Helvetica", 8.5) > w and len(txt) > 3:
                txt = txt[:-4] + "..."
            c.drawString(cx, row_y, txt)
        c.line(LEFT + 12, row_y - 8, RIGHT - 12, row_y - 8)
        row_y -= 24
        if row_y < y - table_h + 28:
            break

    y -= table_h + 16
    _card(c, LEFT, y, RIGHT - LEFT, 56, "Status Legend")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(colors.HexColor("#111827"))
    c.drawString(
        LEFT + 12,
        y - 36,
        "Open = not yet satisfied  |  In Progress = active corrective work  |  Closed = condition met"
    )

    _footer(c, page_spec, ctx)
