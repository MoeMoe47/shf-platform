from io import BytesIO
from datetime import datetime
import os

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader

PAGE_W, PAGE_H = letter

INK = colors.HexColor("#0B1220")
SUB = colors.HexColor("#475467")
MUTED = colors.HexColor("#98A2B3")
LINE = colors.HexColor("#DCE2EA")
CARD_BG = colors.HexColor("#F8FAFC")
WHITE = colors.white

GOOD = colors.HexColor("#12B76A")
WARN = colors.HexColor("#F79009")
BAD = colors.HexColor("#F04438")

MARGIN_X = 60
CONTENT_W = PAGE_W - (MARGIN_X * 2)

# Evidence page alignment
SCORECARD_X = 92
SCORECARD_RIGHT = PAGE_W - 52

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.normpath(os.path.join(BASE_DIR, "../../assets/logos/shs_logo_header.png"))


def _safe(v, fallback="—"):
    if v is None:
        return fallback
    s = str(v).strip()
    return s if s else fallback


def _fmt_ts(ts):
    if ts is None:
        return "—"
    try:
        if isinstance(ts, str):
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                return dt.strftime("%b %d, %Y %I:%M %p")
            except Exception:
                return ts
        return str(ts)
    except Exception:
        return str(ts)


def _fmt_pct(v):
    try:
        return f"{float(v) * 100:.1f}%"
    except Exception:
        return "—"


def _fmt_num(v, digits=2):
    try:
        return f"{float(v):.{digits}f}"
    except Exception:
        return "—"


def _fmt_metric(metric_name, value):
    n = str(metric_name).lower()
    if "attendance" in n or "retention" in n or "completion" in n:
        return _fmt_pct(value)
    if "satisfaction" in n:
        return _fmt_num(value, 2)
    if "incident" in n:
        return _fmt_num(value, 2)
    if "rate" in n and "incident" not in n:
        return _fmt_pct(value)
    return _fmt_num(value, 2)


def _wrap(text, max_chars):
    if not text:
        return ["—"]
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
    return out or ["—"]


def _line(c, x1, y1, x2, y2, stroke=LINE, width=1):
    c.saveState()
    c.setStrokeColor(stroke)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)
    c.restoreState()


def _rr(c, x, y, w, h, r=14, fill=CARD_BG, stroke=LINE):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, r, stroke=1, fill=1)
    c.restoreState()


def _txt(c, x, y, s, size=11, color=INK, font="Helvetica"):
    c.saveState()
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, y, str(s))
    c.restoreState()


def _txt_r(c, x, y, s, size=11, color=INK, font="Helvetica"):
    c.saveState()
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawRightString(x, y, str(s))
    c.restoreState()


def _txt_c(c, x, y, s, size=11, color=INK, font="Helvetica"):
    c.saveState()
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawCentredString(x, y, str(s))
    c.restoreState()


def _multi(c, x, y, text, max_chars=90, line_h=13, size=10, color=SUB, font="Helvetica"):
    yy = y
    for line in _wrap(text, max_chars):
        _txt(c, x, yy, line, size=size, color=color, font=font)
        yy -= line_h
    return yy


def _chip(c, x, y, label, fill):
    c.saveState()
    c.setFont("Helvetica-Bold", 10)
    pad_x = 12
    h = 24
    w = c.stringWidth(label, "Helvetica-Bold", 10) + pad_x * 2
    _rr(c, x, y - h + 6, w, h, 12, fill, fill)
    c.setFillColor(WHITE)
    c.drawString(x + pad_x, y - 11, label)
    c.restoreState()
    return w


def _draw_logo(c, x, y, w):
    try:
        if not os.path.exists(LOGO_PATH):
            return
        img = ImageReader(LOGO_PATH)
        iw, ih = img.getSize()
        if not iw or not ih:
            return
        h = w * (ih / float(iw))
        c.drawImage(img, x, y, width=w, height=h, mask='auto')
    except Exception:
        return


def _footer(c, run_id, page_label=None):
    y = 34
    _line(c, MARGIN_X, y + 10, PAGE_W - MARGIN_X, y + 10)
    _txt(c, MARGIN_X, y - 2, "Silicon Heartland Foundation • Funder-Grade Pilot Report", 9, MUTED)
    _txt_c(c, PAGE_W / 2, y - 2, f"Run: {run_id}", 9, MUTED)
    if page_label:
        _txt_r(c, PAGE_W - MARGIN_X, y - 2, page_label, 9, MUTED)


def _header(c, title, site, app_id, gen_ts):
    logo_w = 108
    logo_x = MARGIN_X
    logo_y = PAGE_H - 86
    _draw_logo(c, logo_x, logo_y, logo_w)

    text_x = logo_x + logo_w + 18
    _txt(c, text_x, PAGE_H - 48, title, 18, INK, "Helvetica-Bold")
    _txt(c, text_x, PAGE_H - 68, f"{gen_ts}  •  Site: {site}  •  App: {app_id}", 10, SUB)

    _line(c, MARGIN_X, PAGE_H - 94, PAGE_W - MARGIN_X, PAGE_H - 94)
    return PAGE_H - 118


def _cover_page(c, report, run_id):
    run = report.get("run") or {}
    center_x = PAGE_W / 2

    logo_w = 230
    _draw_logo(c, center_x - (logo_w / 2), PAGE_H - 255, logo_w)

    _txt_c(c, center_x, PAGE_H - 318, "Outcome Performance &", 31, INK, "Helvetica-Bold")
    _txt_c(c, center_x, PAGE_H - 362, "Funding Readiness Report", 31, INK, "Helvetica-Bold")
    _txt_c(c, center_x, PAGE_H - 412, "State-style decision briefing for pilot review, continuation, and scale readiness.", 12, SUB)

    _line(c, MARGIN_X, PAGE_H - 436, PAGE_W - MARGIN_X, PAGE_H - 436)

    rows = [
        ("Program", _safe(run.get("name"))),
        ("Run ID", _safe(run_id)),
        ("Site", _safe(run.get("site"))),
        ("Application", _safe(run.get("app_id"))),
    ]

    label_x = center_x - 145
    value_x = center_x - 10
    y = PAGE_H - 492
    for label, value in rows:
        _txt_r(c, label_x, y, label, 11, MUTED, "Helvetica-Bold")
        _txt(c, value_x, y, value, 11, INK)
        y -= 32

    _footer(c, run_id, "Cover")


def _summary_card(c, x, y_top, w, h, title, lines):
    _rr(c, x, y_top - h, w, h, 16, CARD_BG, LINE)
    _txt(c, x + 16, y_top - 28, title, 12, INK, "Helvetica-Bold")
    yy = y_top - 54
    for line in lines:
        yy = _multi(c, x + 16, yy, line, 92, 14, 10, SUB)
        yy -= 2


def _outcomes_table(c, x, y_top, w, rows):
    h = 158
    _rr(c, x, y_top - h, w, h, 16, WHITE, LINE)
    _txt(c, x + 16, y_top - 28, "Key Outcomes (Observed vs Target)", 12, INK, "Helvetica-Bold")

    header_y = y_top - 58
    col_metric = x + 16
    col_obs = x + 355
    col_target = x + 470

    _txt(c, col_metric, header_y, "Metric", 9, MUTED, "Helvetica-Bold")
    _txt_r(c, col_obs, header_y, "Observed", 9, MUTED, "Helvetica-Bold")
    _txt_r(c, col_target, header_y, "Target", 9, MUTED, "Helvetica-Bold")
    _line(c, x + 16, header_y - 10, x + w - 16, header_y - 10)

    y = header_y - 34
    for metric, observed, target in rows:
        _txt(c, col_metric, y, metric, 10, SUB)
        _txt_r(c, col_obs, y, _fmt_metric(metric, observed), 10, INK, "Helvetica-Bold")
        _txt_r(c, col_target, y, _fmt_metric(metric, target), 10, SUB, "Helvetica-Bold")
        y -= 22


def _scorecard_table(c, x, y_top, title, metric_rows):
    _txt(c, x, y_top, title, 12, INK, "Helvetica-Bold")
    y = y_top - 14

    right_edge = SCORECARD_RIGHT
    _line(c, x, y, right_edge, y)
    y -= 28

    col_metric = x
    col_actual = right_edge - 250
    col_target = right_edge - 140
    col_pass = right_edge

    _txt(c, col_metric, y, "Metric", 9, MUTED, "Helvetica-Bold")
    _txt_r(c, col_actual, y, "Actual", 9, MUTED, "Helvetica-Bold")
    _txt_r(c, col_target, y, "Target", 9, MUTED, "Helvetica-Bold")
    _txt_r(c, col_pass, y, "Pass", 9, MUTED, "Helvetica-Bold")
    y -= 10
    _line(c, x, y, right_edge, y)
    y -= 26

    for metric, actual, target, passed in metric_rows:
        verdict = "PASS" if passed is True else "FAIL" if passed is False else "—"
        verdict_color = GOOD if verdict == "PASS" else BAD if verdict == "FAIL" else MUTED

        _txt(c, col_metric, y, metric, 10, SUB)
        _txt_r(c, col_actual, y, _fmt_metric(metric, actual), 10, INK, "Helvetica-Bold")
        _txt_r(c, col_target, y, _fmt_metric(metric, target), 10, SUB, "Helvetica-Bold")
        _txt_r(c, col_pass, y, verdict, 10, verdict_color, "Helvetica-Bold")
        y -= 22
    return y


def build_funder_report_pdf(report):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)

    report = report or {}
    run = report.get("run") or {}
    loo = report.get("loo") or {}
    targets = report.get("targets") or {}
    snap = report.get("snapshot") or {}
    funder = report.get("funder_language") or {}
    loe = report.get("loe_summary") or {}

    run_id = _safe(run.get("run_id"), report.get("run_id"))
    pilot_name = _safe(run.get("name"), "Pilot Run")
    site = _safe(run.get("site"))
    app_id = _safe(run.get("app_id"))
    mode = _safe(run.get("mode"), "PILOT")
    owner = _safe(run.get("owner"))
    start_ts = _fmt_ts(run.get("start_ts"))
    end_ts = _fmt_ts(run.get("end_ts"))
    gen_ts = _fmt_ts(report.get("generated_ts"))

    decision = _safe(loo.get("decision"), "PENDING").upper()
    score = _safe(loo.get("score"), "—")

    if decision == "GREEN":
        dec_color = GOOD
        dec_text = "Ready for controlled scale under current conditions."
    elif decision == "YELLOW":
        dec_color = WARN
        dec_text = "Conditionally fundable; improvements are needed before scaling."
    elif decision == "RED":
        dec_color = BAD
        dec_text = "Not ready to scale; corrective action is required first."
    else:
        dec_color = MUTED
        dec_text = "Decision pending."

    summary = _safe(funder.get("summary"), dec_text)
    risk = _safe(funder.get("risk"), "—")
    recommendation = _safe(funder.get("recommendation"), "—")

    # Cover
    _cover_page(c, report, run_id)

    # Page 1
    c.showPage()
    y = _header(c, "SHF Pilot Funding Readiness Report", site, app_id, gen_ts)

    chip_w = _chip(c, MARGIN_X, y, decision, dec_color)
    _txt(c, MARGIN_X + chip_w + 18, y - 12, f"Score: {score}", 16, INK, "Helvetica-Bold")
    y -= 38
    _txt(c, MARGIN_X, y, dec_text, 11, SUB)
    y -= 24

    _summary_card(
        c,
        MARGIN_X,
        y,
        CONTENT_W,
        118,
        "Funding Readiness Assessment (Summary)",
        [
            f"Pilot: {pilot_name} • Mode: {mode} • Owner: {owner}",
            f"Reporting Window: {start_ts} to {end_ts}",
            summary,
        ],
    )
    y -= 142

    _outcomes_table(
        c,
        MARGIN_X,
        y,
        CONTENT_W,
        [
            ("Attendance", snap.get("attendance_rate"), targets.get("attendanceRateTarget")),
            ("Retention", snap.get("retention_rate"), targets.get("retentionTarget")),
            ("Satisfaction", snap.get("parent_satisfaction"), targets.get("parentSatisfactionTarget")),
            ("Incident Rate / 100", snap.get("behavior_incident_rate_per_100"), targets.get("behaviorIncidentRateMaxPer100Sessions")),
        ],
    )
    y -= 182

    _summary_card(
        c,
        MARGIN_X,
        y,
        CONTENT_W,
        102,
        "Primary Risk & Recommended Action",
        [
            f"Risk: {risk}",
            f"Action: {recommendation}",
        ],
    )
    _footer(c, run_id, "Page 1")

    # Page 2
    c.showPage()
    y = _header(c, "Evidence Scorecard", site, app_id, gen_ts)

    loo_metrics = loo.get("metrics") or {}
    metric_rows = []
    if isinstance(loo_metrics, dict):
        for k, v in loo_metrics.items():
            row = v or {}
            metric_rows.append((str(k), row.get("actual"), row.get("target"), row.get("pass")))

    y = _scorecard_table(c, SCORECARD_X, y, "A) LOO Outcome Score Breakdown", metric_rows)
    y -= 22

    _txt(c, SCORECARD_X, y, "B) Operational Integrity (LOE) Signals", 12, INK, "Helvetica-Bold")
    y -= 14
    _line(c, SCORECARD_X, y, SCORECARD_RIGHT, y)
    y -= 24

    derived = (loe.get("derived") or {}) if isinstance(loe, dict) else {}
    loe_lines = [
        f"Events (filtered): {_safe(derived.get('events_seen_after_filter'))}",
        f"Canonical used: {_safe(derived.get('canonical_events_used'))}",
        f"Legacy ignored: {_safe(derived.get('legacy_events_ignored'))}",
        f"Program health score: {_fmt_num(loe.get('program_health_score'), 2)}",
    ]
    for line in loe_lines:
        _txt(c, SCORECARD_X, y, line, 10, SUB)
        y -= 22

    y -= 8
    _txt(c, SCORECARD_X, y, "C) Target Checks", 12, INK, "Helvetica-Bold")
    y -= 14
    _line(c, SCORECARD_X, y, SCORECARD_RIGHT, y)
    y -= 24

    checks = ((snap.get("target_checks") or {}).get("checks") or [])
    if isinstance(checks, list) and checks:
        name_x = SCORECARD_X
        verdict_x = SCORECARD_RIGHT
        for ch in checks[:10]:
            metric = _safe((ch or {}).get("metric"))
            actual = (ch or {}).get("actual")
            passed = (ch or {}).get("pass")
            verdict = "PASS" if passed is True else "FAIL" if passed is False else "—"
            verdict_color = GOOD if verdict == "PASS" else BAD if verdict == "FAIL" else MUTED
            _txt(c, name_x, y, f"{metric}: {_fmt_metric(metric, actual)}", 10, SUB)
            _txt_r(c, verdict_x, y, verdict, 10, verdict_color, "Helvetica-Bold")
            y -= 22
    else:
        _txt(c, SCORECARD_X, y, "No target checks found.", 10, SUB)

    _footer(c, run_id, "Page 2")

    c.save()
    return buf.getvalue()
