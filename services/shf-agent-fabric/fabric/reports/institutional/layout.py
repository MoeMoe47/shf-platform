from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, List, Sequence
import os

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas

PAGE_W, PAGE_H = letter

INK = colors.HexColor("#0B1220")
SUB = colors.HexColor("#475467")
MUTED = colors.HexColor("#98A2B3")
LINE = colors.HexColor("#D9E1EA")
SOFT_LINE = colors.HexColor("#E8EEF5")
CARD_BG = colors.HexColor("#F8FAFC")
CARD_ALT = colors.HexColor("#FBFDFF")
WHITE = colors.white

GOOD = colors.HexColor("#12B76A")
WARN = colors.HexColor("#F79009")
BAD = colors.HexColor("#F04438")
ACCENT = colors.HexColor("#F97316")
ACCENT_SOFT = colors.HexColor("#FDBA74")
TAUPE = colors.HexColor("#D6C6B4")
TAUPE_SOFT = colors.HexColor("#EEE7DF")

M = 52
X0 = M
X1 = PAGE_W - M
CONTENT_W = X1 - X0

TOP_Y = PAGE_H - 88

CARD_RADIUS = 13
CARD_PAD_X = 16
CARD_TITLE_Y_INSET = 24
CARD_BODY_TOP_INSET = 44

BODY_FONT = 8.5
BODY_LEADING = 11
TABLE_ROW_H = 19
TABLE_HDR_H = 20

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_CANDIDATES = [
    os.path.normpath(os.path.join(BASE_DIR, "../../../assets/logos/shs_logo_header.png")),
    os.path.normpath(os.path.join(BASE_DIR, "../../../assets/logos/shs_logo_header_white.png")),
    os.path.normpath(os.path.join(BASE_DIR, "../../../assets/logos/shs_logo.png")),
]

def safe(v: Any, fallback: str = "-") -> str:
    if v is None:
        return fallback
    s = str(v).strip()
    return s if s else fallback

def fmt_ts(ts: Any) -> str:
    if ts is None:
        return "-"
    try:
        if isinstance(ts, (int, float)):
            dt = datetime.fromtimestamp(ts / 1000.0) if ts > 1_000_000_000_000 else datetime.fromtimestamp(ts)
            return dt.strftime("%b %d, %Y %I:%M %p")
        if isinstance(ts, str):
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                return dt.strftime("%b %d, %Y %I:%M %p")
            except Exception:
                return ts
        return str(ts)
    except Exception:
        return str(ts)

def pct(v: Any, digits: int = 1) -> str:
    try:
        return f"{float(v) * 100:.{digits}f}%"
    except Exception:
        return "-"

def num(v: Any, digits: int = 2) -> str:
    try:
        return f"{float(v):.{digits}f}"
    except Exception:
        return "-"

def wrap_lines(text: str, max_chars: int) -> List[str]:
    if not text:
        return ["-"]
    words = str(text).split()
    out, cur = [], []
    cur_len = 0
    for w in words:
        add = len(w) + (1 if cur else 0)
        if cur_len + add > max_chars:
            out.append(" ".join(cur) if cur else w)
            cur = [w]
            cur_len = len(w)
        else:
            cur.append(w)
            cur_len += add
    if cur:
        out.append(" ".join(cur))
    return out or ["-"]

def hline(c: Canvas, x1: float, x2: float, y: float, color=LINE, width: float = 1):
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y, x2, y)
    c.restoreState()

def rr(c: Canvas, x: float, y: float, w: float, h: float, r: float, fill, stroke, line_width: float = 1):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(line_width)
    c.roundRect(x, y, w, h, r, stroke=1, fill=1)
    c.restoreState()

def txt(c: Canvas, x: float, y: float, s: str, size: int = 11, color=INK, font: str = "Helvetica"):
    c.saveState()
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, y, str(s))
    c.restoreState()

def txt_r(c: Canvas, x: float, y: float, s: str, size: int = 11, color=INK, font: str = "Helvetica"):
    c.saveState()
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawRightString(x, y, str(s))
    c.restoreState()

def txt_c(c: Canvas, x: float, y: float, s: str, size: int = 11, color=INK, font: str = "Helvetica"):
    c.saveState()
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawCentredString(x, y, str(s))
    c.restoreState()

def paragraph(c: Canvas, x: float, y: float, text: str, width_chars: int = 88, size: int = BODY_FONT, line_gap: int = BODY_LEADING, color=SUB):
    yy = y
    for line in wrap_lines(text, width_chars):
        txt(c, x, yy, line, size, color)
        yy -= line_gap
    return yy

def bullets(c: Canvas, x: float, y: float, items: Iterable[str], max_chars: int = 34, line_gap: int = BODY_LEADING):
    yy = y
    for item in items or []:
        lines = wrap_lines(str(item), max_chars)
        txt(c, x, yy, "-", BODY_FONT, SUB, "Helvetica-Bold")
        txt(c, x + 10, yy, lines[0], BODY_FONT, SUB)
        yy -= line_gap
        for line in lines[1:]:
            txt(c, x + 10, yy, line, BODY_FONT, SUB)
            yy -= line_gap
        yy -= 1
    return yy

def draw_logo(c: Canvas, x: float, y: float, w: float):
    for path in LOGO_CANDIDATES:
        try:
            if os.path.exists(path):
                img = ImageReader(path)
                iw, ih = img.getSize()
                if iw and ih:
                    h = w * (ih / float(iw))
                    c.drawImage(img, x, y, width=w, height=h, mask="auto")
                    return h
        except Exception:
            pass
    return 0.0

def chip(c: Canvas, x: float, y: float, label: str, fill):
    c.saveState()
    c.setFont("Helvetica-Bold", 10)
    pad_x = 12
    h = 22
    w = c.stringWidth(label, "Helvetica-Bold", 10) + pad_x * 2
    rr(c, x, y - h + 5, w, h, 11, fill, fill)
    c.setFillColor(WHITE)
    c.drawString(x + pad_x, y - 13, label)
    c.restoreState()
    return w

def draw_standard_header(c: Canvas, ctx: dict, title: str):
    logo_w = 78
    logo_h = draw_logo(c, X0, PAGE_H - 60, logo_w)
    text_x = X0 + (logo_w + 12 if logo_h else 0)
    txt(c, text_x, PAGE_H - 30, title, 16, INK, "Helvetica-Bold")
    generated_ts = safe(ctx.get("report_meta", {}).get("generated_ts"), "-")
    site = safe(ctx.get("run", {}).get("site"), "-")
    app_id = safe(ctx.get("run", {}).get("app_id"), "-")
    txt(c, text_x, PAGE_H - 46, f"{generated_ts}  -  Site: {site}  -  App: {app_id}", 8, SUB)
    hline(c, X0, X1, PAGE_H - 64)

def draw_standard_footer(c: Canvas, ctx: dict, label: str):
    c.saveState()
    hline(c, X0, X1, 36)
    txt(c, X0, 22, "Silicon Heartland Foundation - Institutional Report", 7, MUTED)
    txt_c(c, PAGE_W / 2, 22, f"Run: {safe(ctx.get('run', {}).get('run_id'), '-')}", 7, MUTED)
    txt_r(c, X1, 22, label, 7, MUTED)
    c.restoreState()

def draw_card_title(c: Canvas, x: float, y_top: float, title: str):
    txt(c, x + CARD_PAD_X, y_top - CARD_TITLE_Y_INSET, title, 10, INK, "Helvetica-Bold")

def draw_table(c: Canvas, x: float, y_top: float, w: float, title: str, headers: Sequence[str], rows: Sequence[Sequence[str]], col_widths: Sequence[float], row_h: int = TABLE_ROW_H):
    total = sum(col_widths)
    norm = [w * (cw / total) for cw in col_widths]
    h = 40 + TABLE_HDR_H + row_h * max(1, len(rows)) + 16
    rr(c, x, y_top - h, w, h, CARD_RADIUS, WHITE, LINE)
    draw_card_title(c, x, y_top, title)

    table_y = y_top - 46
    cx = x + CARD_PAD_X
    right_pad = x + w - CARD_PAD_X

    # Header row baseline
    for i, head in enumerate(headers):
        if i == 0:
            txt(c, cx, table_y, head, 8, MUTED, "Helvetica-Bold")
        else:
            txt_r(c, cx + norm[i] - 6, table_y, head, 8, MUTED, "Helvetica-Bold")
        cx += norm[i]

    hline(c, x + CARD_PAD_X, right_pad, table_y - 8, SOFT_LINE)

    y = table_y - 21
    for row in rows:
        cx = x + CARD_PAD_X
        for i, cell in enumerate(row):
            val = safe(cell)
            baseline = y
            if i == 0:
                txt(c, cx, baseline, val, 8.5, SUB)
            else:
                is_emphasis = i in (1, 2, 3)
                txt_r(
                    c,
                    cx + norm[i] - 6,
                    baseline,
                    val,
                    8.5,
                    INK if is_emphasis else SUB,
                    "Helvetica-Bold" if is_emphasis else "Helvetica"
                )
            cx += norm[i]
        y -= row_h

    return y_top - h

def draw_metric_tiles(c: Canvas, x: float, y_top: float, w: float, items: Sequence[tuple[str, str]], cols: int = 3):
    gap = 10
    tile_w = (w - gap * (cols - 1)) / cols
    tile_h = 54
    rows = (len(items) + cols - 1) // cols

    for idx, (label, value) in enumerate(items):
        r = idx // cols
        col = idx % cols
        tx = x + col * (tile_w + gap)
        ty = y_top - r * (tile_h + gap)

        rr(c, tx, ty - tile_h, tile_w, tile_h, 12, CARD_ALT, LINE)
        txt(c, tx + 12, ty - 17, label, 7, MUTED, "Helvetica-Bold")
        txt(c, tx + 12, ty - 37, value, 14, INK, "Helvetica-Bold")

    return y_top - rows * tile_h - (rows - 1) * gap

def draw_compare_bars(c: Canvas, x: float, y_top: float, w: float, title: str, rows: Sequence[tuple[str, float, float]], max_value: float = 100.0):
    h = 186
    rr(c, x, y_top - h, w, h, CARD_RADIUS, WHITE, LINE)
    draw_card_title(c, x, y_top, title)
    txt(c, x + CARD_PAD_X, y_top - 38, "Target shown in soft institutional tone. Actual shown in primary tone.", 7, MUTED)

    start_y = y_top - 66
    label_w = 132
    bar_x = x + CARD_PAD_X + label_w
    bar_w = w - CARD_PAD_X * 2 - label_w - 44

    for idx, (label, target, actual) in enumerate(rows):
        yy = start_y - idx * 23
        txt(c, x + CARD_PAD_X, yy - 1, label, 8, SUB)

        c.saveState()
        c.setLineWidth(7)
        c.setStrokeColor(TAUPE_SOFT)
        c.line(bar_x, yy, bar_x + bar_w, yy)
        c.setStrokeColor(TAUPE)
        c.line(bar_x, yy, bar_x + max(0, min(bar_w, (target / max_value) * bar_w)), yy)
        c.setStrokeColor(ACCENT if "Incident" in label else INK)
        c.setLineWidth(5)
        c.line(bar_x, yy, bar_x + max(0, min(bar_w, (actual / max_value) * bar_w)), yy)
        c.restoreState()

        txt_r(c, x + w - CARD_PAD_X, yy - 3, f"A {actual:.1f} | T {target:.1f}", 6.8, MUTED)

    txt(c, x + CARD_PAD_X, y_top - h + 12, "A = actual, T = target", 7, MUTED)
    return y_top - h

def draw_trend_panel(c: Canvas, x: float, y_top: float, w: float, title: str, periods: Sequence[str], series: Sequence[dict]):
    h = 154
    rr(c, x, y_top - h, w, h, CARD_RADIUS, WHITE, LINE)
    draw_card_title(c, x, y_top, title)

    left = x + 24
    right = x + w - 22
    top = y_top - 56
    bottom = y_top - 118

    hline(c, left, right, bottom, SOFT_LINE)
    hline(c, left, right, (top + bottom) / 2, colors.HexColor("#F3F4F6"))

    for i, p in enumerate(periods[:4]):
        px = left + (right - left) * i / max(1, len(periods[:4]) - 1)
        txt_c(c, px, bottom - 13, p, 7, MUTED)

    palette = [INK, colors.HexColor("#475467"), ACCENT]
    for idx, s in enumerate(series[:3]):
        vals = s.get("values") or []
        if len(vals) < 2:
            continue
        label = s.get("metric_label", s.get("metric_key", f"S{idx+1}"))

        numeric = []
        for v in vals[:4]:
            try:
                numeric.append(float(v))
            except Exception:
                numeric.append(0.0)

        lo = min(numeric)
        hi = max(numeric)
        span = (hi - lo) or 1.0

        points = []
        for i, v in enumerate(numeric):
            px = left + (right - left) * i / max(1, len(numeric) - 1)
            norm = (v - lo) / span
            py = bottom + norm * (top - bottom)
            points.append((px, py))

        c.saveState()
        c.setStrokeColor(palette[idx])
        c.setLineWidth(2.2 if idx == 0 else 1.6)
        for a, b in zip(points[:-1], points[1:]):
            c.line(a[0], a[1], b[0], b[1])
        c.setFillColor(palette[idx])
        for px, py in points:
            c.circle(px, py, 2.1 if idx == 0 else 1.7, fill=1, stroke=0)
        c.restoreState()

        preview = ", ".join([pct(v) if idx < 2 else num(v) for v in numeric[:4]])
        txt(c, left, y_top - 44 - idx * 11, f"{label}: {preview}", 6.8, palette[idx])

    return y_top - h

def draw_simple_timeline(c: Canvas, x: float, y_top: float, w: float, title: str, milestones: Sequence[tuple[str, str]], dot_color=ACCENT):
    h = 122
    rr(c, x, y_top - h, w, h, CARD_RADIUS, WHITE, LINE)
    draw_card_title(c, x, y_top, title)

    line_y = y_top - 74
    left = x + 34
    right = x + w - 34
    hline(c, left, right, line_y, SOFT_LINE, 2)

    positions = [left + (right - left) * i / max(1, len(milestones) - 1) for i in range(len(milestones))]
    for pos, (label, date) in zip(positions, milestones):
        c.saveState()
        c.setFillColor(dot_color)
        c.setStrokeColor(colors.white)
        c.setLineWidth(1)
        c.circle(pos, line_y, 4.5, fill=1, stroke=1)
        c.restoreState()
        txt_c(c, pos, line_y + 12, date, 6.5, SUB)
        txt_c(c, pos, line_y - 16, label, 6.5, MUTED)

    return y_top - h

def draw_risk_heatmap(c: Canvas, x: float, y_top: float, w: float, h: float = 96):
    rr(c, x, y_top - h, w, h, CARD_RADIUS, WHITE, LINE)
    draw_card_title(c, x, y_top, "Risk Heatmap")

    grid_x = x + 16
    grid_y = y_top - 46
    s = 15
    gap = 5

    for r in range(3):
        for col in range(3):
            fill = WHITE
            if (r, col) == (0, 2):
                fill = colors.HexColor("#EA580C")
            elif (r, col) == (1, 1):
                fill = colors.HexColor("#F59E0B")
            elif (r, col) == (2, 0):
                fill = colors.HexColor("#F3F4F6")
            rr(c, grid_x + col * (s + gap), grid_y - r * (s + gap), s, s, 3, fill, SOFT_LINE)

    txt(c, x + 74, y_top - 50, "Rows: severity", 7, MUTED)
    txt(c, x + 74, y_top - 64, "Cols: likelihood", 7, MUTED)
    txt(c, x + 16, y_top - h + 12, "Simplified institutional risk matrix", 7, MUTED)
    return y_top - h
