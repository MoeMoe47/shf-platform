from __future__ import annotations

from typing import Any, Iterable, Sequence
from reportlab.lib import colors

from .layout import (
    PAGE_H, TOP_Y, X0, CONTENT_W,
    rr, txt, txt_r, txt_c, hline,
    draw_standard_header, draw_standard_footer,
    safe, pct, num, wrap_lines,
    INK, SUB, MUTED, LINE, SOFT_LINE, CARD_ALT, WHITE,
    ACCENT, GOOD, WARN, BAD
)

def _c(v):
    if isinstance(v, colors.Color):
        return v
    if isinstance(v, str) and v.startswith("#"):
        return colors.HexColor(v)
    return v

class PageComposer:
    def __init__(self, c, ctx: dict, page_spec: dict):
        self.c = c
        self.ctx = ctx
        self.page_spec = page_spec
        draw_standard_header(c, ctx, page_spec["title"])
        self.y = TOP_Y
        self.gap = 12

    def finish(self):
        draw_standard_footer(self.c, self.ctx, self.page_spec["footer_label"])

    def space(self, amt: float):
        self.y -= amt

    def card(self, title: str, body_lines: Sequence[str], min_h: float = 56, fill="#FBFDFF"):
        lines = []
        for line in body_lines:
            if line is None:
                continue
            wrapped = wrap_lines(str(line), 100)
            lines.extend(wrapped if wrapped else ["-"])
        body_h = max(1, len(lines)) * 11
        h = max(min_h, 34 + body_h + 12)

        rr(self.c, X0, self.y - h, CONTENT_W, h, 13, _c(fill), LINE)
        txt(self.c, X0 + 16, self.y - 20, title, 10, INK, "Helvetica-Bold")

        yy = self.y - 38
        for line in lines:
            txt(self.c, X0 + 16, yy, line, 8.5, SUB)
            yy -= 11

        self.y -= (h + self.gap)

    def metric_banner(self, label: str, value: str, tone: str = "neutral", subtitle: str | None = None):
        color = {"good": GOOD, "warn": WARN, "bad": BAD}.get(tone, ACCENT)
        h = 54 if subtitle else 46
        rr(self.c, X0, self.y - h, CONTENT_W, h, 13, _c("#FBFDFF"), LINE)
        txt(self.c, X0 + 16, self.y - 18, label, 10, INK, "Helvetica-Bold")
        txt(self.c, X0 + 16, self.y - 36, value, 13, color, "Helvetica-Bold")
        if subtitle:
            txt(self.c, X0 + 140, self.y - 35, subtitle, 8.2, SUB)
        self.y -= (h + self.gap)

    def table(self, title: str, headers: Sequence[str], rows: Sequence[Sequence[Any]], col_fracs: Sequence[float], row_h: int = 20):
        rows = rows or [["-", "-", "-"]]
        total = sum(col_fracs)
        cols = [CONTENT_W * (f / total) for f in col_fracs]
        h = 40 + 20 + row_h * len(rows) + 16

        rr(self.c, X0, self.y - h, CONTENT_W, h, 13, WHITE, LINE)
        txt(self.c, X0 + 16, self.y - 20, title, 10, INK, "Helvetica-Bold")

        header_y = self.y - 46
        cx = X0 + 16
        for i, head in enumerate(headers):
            if i == 0:
                txt(self.c, cx, header_y, head, 8, MUTED, "Helvetica-Bold")
            else:
                txt_r(self.c, cx + cols[i] - 6, header_y, head, 8, MUTED, "Helvetica-Bold")
            cx += cols[i]
        hline(self.c, X0 + 16, X0 + CONTENT_W - 16, header_y - 8, SOFT_LINE)

        yy = header_y - 21
        for row in rows:
            cx = X0 + 16
            for i, cell in enumerate(row):
                val = safe(cell)
                if i == 0:
                    txt(self.c, cx, yy, val, 8.4, SUB)
                else:
                    txt_r(self.c, cx + cols[i] - 6, yy, val, 8.4, INK if i in (1, 2, 3) else SUB,
                          "Helvetica-Bold" if i in (1, 2, 3) else "Helvetica")
                cx += cols[i]
            yy -= row_h

        self.y -= (h + self.gap)

    def two_column_lists(self, left_title: str, left_items: Sequence[str], right_title: str, right_items: Sequence[str]):
        gap = 12
        col_w = (CONTENT_W - gap) / 2
        h = 88

        rr(self.c, X0, self.y - h, col_w, h, 13, _c("#FBFDFF"), LINE)
        rr(self.c, X0 + col_w + gap, self.y - h, col_w, h, 13, _c("#FBFDFF"), LINE)

        txt(self.c, X0 + 16, self.y - 20, left_title, 10, INK, "Helvetica-Bold")
        txt(self.c, X0 + col_w + gap + 16, self.y - 20, right_title, 10, INK, "Helvetica-Bold")

        yy_l = self.y - 40
        for item in (left_items or ["-"])[:4]:
            txt(self.c, X0 + 16, yy_l, f"• {item}", 8.3, SUB)
            yy_l -= 11

        yy_r = self.y - 40
        for item in (right_items or ["-"])[:4]:
            txt(self.c, X0 + col_w + gap + 16, yy_r, f"• {item}", 8.3, SUB)
            yy_r -= 11

        self.y -= (h + self.gap)

    def metric_tiles(self, items: Sequence[tuple[str, str]], cols: int = 3):
        gap = 10
        tile_w = (CONTENT_W - gap * (cols - 1)) / cols
        tile_h = 54
        rows = (len(items) + cols - 1) // cols

        for idx, (label, value) in enumerate(items):
            r = idx // cols
            col = idx % cols
            tx = X0 + col * (tile_w + gap)
            ty = self.y - r * (tile_h + gap)

            rr(self.c, tx, ty - tile_h, tile_w, tile_h, 12, CARD_ALT, LINE)
            txt(self.c, tx + 12, ty - 17, label, 7, MUTED, "Helvetica-Bold")
            txt(self.c, tx + 12, ty - 37, value, 14, INK, "Helvetica-Bold")

        used_h = rows * tile_h + max(0, rows - 1) * gap
        self.y -= (used_h + self.gap)

    def bar_compare(self, title: str, rows: Sequence[tuple[str, float, float]], max_value: float = 100.0):
        h = 184
        rr(self.c, X0, self.y - h, CONTENT_W, h, 13, WHITE, LINE)
        txt(self.c, X0 + 16, self.y - 20, title, 10, INK, "Helvetica-Bold")
        txt(self.c, X0 + 16, self.y - 37, "Target shown in soft tone. Actual shown in primary tone.", 7, MUTED)

        label_w = 132
        bar_x = X0 + 16 + label_w
        bar_w = CONTENT_W - 16 - label_w - 44
        start_y = self.y - 64

        for idx, (label, target, actual) in enumerate(rows):
            yy = start_y - idx * 23
            txt(self.c, X0 + 16, yy - 1, label, 8, SUB)

            self.c.saveState()
            self.c.setLineWidth(7)
            self.c.setStrokeColor(colors.HexColor("#EEE7DF"))
            self.c.line(bar_x, yy, bar_x + bar_w, yy)
            self.c.setStrokeColor(colors.HexColor("#D6C6B4"))
            self.c.line(bar_x, yy, bar_x + max(0, min(bar_w, (target / max_value) * bar_w)), yy)
            self.c.setStrokeColor(ACCENT if "Incident" in label else INK)
            self.c.setLineWidth(5)
            self.c.line(bar_x, yy, bar_x + max(0, min(bar_w, (actual / max_value) * bar_w)), yy)
            self.c.restoreState()

            txt_r(self.c, X0 + CONTENT_W - 16, yy - 3, f"A {actual:.1f} | T {target:.1f}", 6.8, MUTED)

        txt(self.c, X0 + 16, self.y - h + 12, "A = actual, T = target", 7, MUTED)
        self.y -= (h + self.gap)

    def trend_panel(self, title: str, periods: Sequence[str], series: Sequence[dict]):
        h = 156
        rr(self.c, X0, self.y - h, CONTENT_W, h, 13, WHITE, LINE)
        txt(self.c, X0 + 16, self.y - 20, title, 10, INK, "Helvetica-Bold")

        left = X0 + 24
        right = X0 + CONTENT_W - 22
        top = self.y - 56
        bottom = self.y - 118

        hline(self.c, left, right, bottom, SOFT_LINE)
        hline(self.c, left, right, (top + bottom) / 2, colors.HexColor("#F3F4F6"))

        for i, p in enumerate(periods[:4]):
            px = left + (right - left) * i / max(1, len(periods[:4]) - 1)
            txt_c(self.c, px, bottom - 13, p, 7, MUTED)

        palette = [INK, colors.HexColor("#475467"), ACCENT]
        for idx, s in enumerate((series or [])[:3]):
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

            self.c.saveState()
            self.c.setStrokeColor(palette[idx])
            self.c.setLineWidth(2.2 if idx == 0 else 1.6)
            for a, b in zip(points[:-1], points[1:]):
                self.c.line(a[0], a[1], b[0], b[1])
            self.c.setFillColor(palette[idx])
            for px, py in points:
                self.c.circle(px, py, 2.1 if idx == 0 else 1.7, fill=1, stroke=0)
            self.c.restoreState()

            preview = ", ".join([pct(v) if idx < 2 else num(v) for v in numeric[:4]])
            txt(self.c, left, self.y - 44 - idx * 11, f"{label}: {preview}", 6.8, palette[idx])

        self.y -= (h + self.gap)

    def risk_split(self, overall: str, summary: str):
        gap = 12
        left_w = 190
        right_w = CONTENT_W - left_w - gap
        h = 96

        rr(self.c, X0, self.y - h, left_w, h, 13, WHITE, LINE)
        txt(self.c, X0 + 16, self.y - 20, "Risk Heatmap", 9, INK, "Helvetica-Bold")
        grid_x = X0 + 16
        grid_y = self.y - 46
        s = 15
        gap2 = 5
        for r in range(3):
            for col in range(3):
                fill = WHITE
                if (r, col) == (0, 2):
                    fill = colors.HexColor("#EA580C")
                elif (r, col) == (1, 1):
                    fill = colors.HexColor("#F59E0B")
                elif (r, col) == (2, 0):
                    fill = colors.HexColor("#F3F4F6")
                rr(self.c, grid_x + col * (s + gap2), grid_y - r * (s + gap2), s, s, 3, fill, SOFT_LINE)
        txt(self.c, X0 + 74, self.y - 50, "Rows: severity", 7, MUTED)
        txt(self.c, X0 + 74, self.y - 64, "Cols: likelihood", 7, MUTED)

        rr(self.c, X0 + left_w + gap, self.y - h, right_w, h, 13, _c("#FBFDFF"), LINE)
        txt(self.c, X0 + left_w + gap + 16, self.y - 20, "Overall Risk Level", 10, INK, "Helvetica-Bold")
        txt(self.c, X0 + left_w + gap + 16, self.y - 38, overall, 13, WARN, "Helvetica-Bold")
        txt(self.c, X0 + left_w + gap + 16, self.y - 58, summary, 8.2, SUB)

        self.y -= (h + self.gap)

    def timeline(self, title: str, milestones: Sequence[tuple[str, str]]):
        h = 122
        rr(self.c, X0, self.y - h, CONTENT_W, h, 13, WHITE, LINE)
        txt(self.c, X0 + 16, self.y - 20, title, 10, INK, "Helvetica-Bold")

        line_y = self.y - 74
        left = X0 + 34
        right = X0 + CONTENT_W - 34
        hline(self.c, left, right, line_y, SOFT_LINE, 2)

        positions = [left + (right - left) * i / max(1, len(milestones) - 1) for i in range(len(milestones))]
        for pos, (label, date) in zip(positions, milestones):
            self.c.saveState()
            self.c.setFillColor(ACCENT)
            self.c.setStrokeColor(colors.white)
            self.c.setLineWidth(1)
            self.c.circle(pos, line_y, 4.5, fill=1, stroke=1)
            self.c.restoreState()
            txt_c(self.c, pos, line_y + 12, date, 6.5, SUB)
            txt_c(self.c, pos, line_y - 16, label, 6.5, MUTED)

        self.y -= (h + self.gap)
