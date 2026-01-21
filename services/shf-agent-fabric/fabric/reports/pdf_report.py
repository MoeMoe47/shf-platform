from __future__ import annotations

from io import BytesIO
from datetime import datetime
from typing import Any, Dict, List, Tuple, Optional

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib import colors

PAGE_W, PAGE_H = letter

INK = colors.HexColor("#0B1220")
SUB = colors.HexColor("#475467")
MUTED = colors.HexColor("#98A2B3")
LINE = colors.HexColor("#E4E7EC")
CARD_BG = colors.HexColor("#F9FAFB")
WHITE = colors.white

ACCENT = colors.HexColor("#FF4D00")
GOOD = colors.HexColor("#12B76A")
WARN = colors.HexColor("#F79009")
BAD  = colors.HexColor("#F04438")


def _safe(v: Any, fallback: str = "—") -> str:
    if v is None:
        return fallback
    s = str(v).strip()
    return s if s else fallback


def _fmt_ts(ts: Any) -> str:
    if ts is None:
        return "—"
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


def _pct(v: Any) -> str:
    try:
        return f"{float(v) * 100:.0f}%"
    except Exception:
        return "—"


def _num(v: Any) -> str:
    try:
        x = float(v)
        return str(int(x)) if x.is_integer() else f"{x:.2f}"
    except Exception:
        return "—"


def _wrap(text: str, max_chars: int) -> List[str]:
    if not text:
        return ["—"]
    words = text.split()
    out: List[str] = []
    cur: List[str] = []
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


def _hline(c: Canvas, x1: float, x2: float, y: float):
    c.saveState()
    c.setStrokeColor(LINE)
    c.setLineWidth(1)
    c.line(x1, y, x2, y)
    c.restoreState()


def _rr(c: Canvas, x: float, y: float, w: float, h: float, r: float, fill, stroke):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, r, stroke=1, fill=1)
    c.restoreState()


def _txt(c: Canvas, x: float, y: float, s: str, size: int = 11, color=INK, font: str = "Helvetica"):
    c.saveState()
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, y, s)
    c.restoreState()


def _chip(c: Canvas, x: float, y: float, label: str, fill):
    c.saveState()
    c.setFont("Helvetica-Bold", 9)
    pad = 10
    w = c.stringWidth(label, "Helvetica-Bold", 9) + pad * 2
    h = 18
    _rr(c, x, y - h + 3, w, h, 9, fill, fill)
    c.setFillColor(WHITE)
    c.drawString(x + pad, y - h + 8, label)
    c.restoreState()
    return w


def build_funder_report_pdf(report: dict) -> bytes:
    buf = BytesIO()
    c = Canvas(buf, pagesize=letter)
    W, H = letter
    M = 54
    X0, X1 = M, W - M

    run = (report or {}).get("run") or {}
    loo = (report or {}).get("loo") or {}
    targets = (report or {}).get("targets") or {}
    snap = (report or {}).get("snapshot") or {}
    funder = (report or {}).get("funder_language") or {}
    loe = (report or {}).get("loe_summary") or {}

    run_id = _safe(run.get("run_id"))
    site = _safe(run.get("site"))
    app_id = _safe(run.get("app_id"))
    pilot_name = _safe(run.get("name"), "Pilot Run")
    mode = _safe(run.get("mode"), "PILOT")
    owner = _safe(run.get("owner"), "—")
    start_ts = _fmt_ts(run.get("start_ts"))
    end_ts = _fmt_ts(run.get("end_ts"))

    gen_ts = _fmt_ts((report or {}).get("generated_ts"))

    decision = _safe(loo.get("decision"))
    score = _safe(loo.get("score"))

    if decision.upper() == "GREEN":
        dec_color, dec_mean = GOOD, "On track for funding confidence and stable delivery."
    elif decision.upper() == "YELLOW":
        dec_color, dec_mean = WARN, "Fundable, but improvements are required before scaling."
    elif decision.upper() == "RED":
        dec_color, dec_mean = BAD, "Not ready to scale; corrective action is required first."
    else:
        dec_color, dec_mean = MUTED, "Decision pending."

    def footer():
        c.saveState()
        c.setStrokeColor(LINE)
        c.setLineWidth(1)
        c.line(X0, 40, X1, 40)
        _txt(c, X0, 26, "Silicon Heartland Foundation • Funder-Grade Pilot Report", 9, MUTED)
        _txt(c, X1 - 220, 26, f"Run: {run_id}", 9, MUTED)
        c.restoreState()

    def header(title: str):
        _txt(c, X0, H - 42, title, 18, INK, "Helvetica-Bold")
        _txt(c, X0, H - 62, f"{gen_ts}  •  Site: {site}  •  App: {app_id}", 10, SUB)
        _hline(c, X0, X1, H - 74)

    def new_page(title: str):
        footer()
        c.showPage()
        header(title)

    header("SHF Pilot Funding Readiness Report")
    y = H - 92

    chip_w = _chip(c, X0, y, f"{decision.upper() or '—'}", dec_color)
    _txt(c, X0 + chip_w + 10, y - 12, f"Score: {score}", 12, INK, "Helvetica-Bold")
    y -= 30

    _txt(c, X0, y, dec_mean, 11, SUB)
    y -= 18

    _rr(c, X0, y - 88, (X1 - X0), 88, 12, CARD_BG, LINE)
    _txt(c, X0 + 14, y - 22, "Funding Readiness Assessment (Summary)", 11, INK, "Helvetica-Bold")

    summary_lines = [
        f"Pilot: {pilot_name}  •  Mode: {mode}  •  Owner: {owner}",
        f"Reporting Window: {start_ts} to {end_ts}",
        "This report supports continuation or scale decisions by pairing outcome performance (LOO) with operational integrity signals (LOE).",
        "Forecasts and recommendations are advisory; the system does not enforce actions."
    ]
    yy = y - 40
    for ln in summary_lines:
        for wln in _wrap(ln, 108):
            _txt(c, X0 + 14, yy, wln, 9, MUTED)
            yy -= 12
    y -= 110

    m_att = snap.get("attendance_rate", None)
    m_ret = snap.get("retention_rate", None)
    m_sat = snap.get("parent_satisfaction", None)
    m_inc = snap.get("behavior_incident_rate_per_100", None)

    _rr(c, X0, y - 120, (X1 - X0), 120, 12, WHITE, LINE)
    _txt(c, X0 + 14, y - 22, "Key Outcomes (Observed vs Target)", 11, INK, "Helvetica-Bold")

    rows = [
        ("Attendance", _pct(m_att), _pct(targets.get("attendanceRateTarget"))),
        ("Retention", _pct(m_ret), _pct(targets.get("retentionTarget"))),
        ("Satisfaction", _num(m_sat), _num(targets.get("parentSatisfactionTarget"))),
        ("Incident Rate / 100", _num(m_inc), _num(targets.get("behaviorIncidentRateMaxPer100Sessions"))),
    ]
    ty = y - 44
    _txt(c, X0 + 14, ty, "Metric", 9, MUTED, "Helvetica-Bold")
    _txt(c, X0 + 250, ty, "Observed", 9, MUTED, "Helvetica-Bold")
    _txt(c, X0 + 340, ty, "Target", 9, MUTED, "Helvetica-Bold")
    _hline(c, X0 + 14, X1 - 14, ty - 8)
    ty -= 22
    for k, a, t in rows:
        _txt(c, X0 + 14, ty, k, 10, SUB)
        _txt(c, X0 + 250, ty, a, 10, INK, "Helvetica-Bold")
        _txt(c, X0 + 340, ty, t, 10, SUB, "Helvetica-Bold")
        ty -= 18
    y -= 140

    fc = snap.get("forecast_top") or {}
    sg = snap.get("suggestions_top") or []
    f_line = _safe(fc.get("message"), "—")
    f_prob = _pct(fc.get("probability"))

    _rr(c, X0, y - 92, (X1 - X0), 92, 12, CARD_BG, LINE)
    _txt(c, X0 + 14, y - 22, "Primary Risk & Recommended Action", 11, INK, "Helvetica-Bold")
    _txt(c, X0 + 14, y - 40, f"Risk: {f_line} ({f_prob})", 9, MUTED)
    action = "—"
    if isinstance(sg, list) and sg:
        action = _safe((sg[0] or {}).get("message"), "—")
    _txt(c, X0 + 14, y - 56, f"Action: {action}", 9, MUTED)

    footer()

    new_page("Evidence Scorecard (Page 2)")
    y = H - 92

    _txt(c, X0, y, "Evidence Scorecard", 14, INK, "Helvetica-Bold")
    _txt(c, X0, y - 18, "This page shows the measurable evidence used for funding confidence.", 10, SUB)
    y -= 34

    _txt(c, X0, y, "A) LOO Outcome Score Breakdown", 11, INK, "Helvetica-Bold")
    y -= 14
    _hline(c, X0, X1, y)
    y -= 18

    loo_metrics = (loo.get("metrics") or {})
    if isinstance(loo_metrics, dict) and loo_metrics:
        _txt(c, X0, y, "Metric", 9, MUTED, "Helvetica-Bold")
        _txt(c, X0 + 250, y, "Actual", 9, MUTED, "Helvetica-Bold")
        _txt(c, X0 + 340, y, "Target", 9, MUTED, "Helvetica-Bold")
        _txt(c, X0 + 430, y, "Pass", 9, MUTED, "Helvetica-Bold")
        y -= 10
        _hline(c, X0, X1, y)
        y -= 18
        for k, v in loo_metrics.items():
            actual = _safe((v or {}).get("actual"))
            target = _safe((v or {}).get("target"))
            passed = (v or {}).get("pass")
            verdict = "PASS" if passed is True else "FAIL" if passed is False else "—"
            col = GOOD if verdict == "PASS" else BAD if verdict == "FAIL" else MUTED
            _txt(c, X0, y, str(k), 10, SUB)
            _txt(c, X0 + 250, y, str(actual), 10, INK, "Helvetica-Bold")
            _txt(c, X0 + 340, y, str(target), 10, SUB, "Helvetica-Bold")
            _txt(c, X0 + 430, y, verdict, 10, col, "Helvetica-Bold")
            y -= 16
    else:
        _txt(c, X0, y, "—", 10, SUB)
        y -= 16

    y -= 8
    _txt(c, X0, y, "B) Operational Integrity (LOE) Signals", 11, INK, "Helvetica-Bold")
    y -= 14
    _hline(c, X0, X1, y)
    y -= 18

    derived = ((loe.get("derived") or {}) if isinstance(loe, dict) else {})
    e_seen = _safe(derived.get("events_seen_after_filter"))
    canon = _safe(derived.get("canonical_events_used"))
    legacy = _safe(derived.get("legacy_events_ignored"))
    p95 = _num(snap.get("p95_duration_ms"))
    mo = _pct(snap.get("manual_override_rate"))

    _txt(c, X0, y, f"Events (filtered): {e_seen}  •  Canonical used: {canon}  •  Legacy ignored: {legacy}", 10, SUB)
    y -= 16
    _txt(c, X0, y, f"Manual Override Rate: {mo}  •  p95 Duration: {p95} ms", 10, SUB)
    y -= 22

    _txt(c, X0, y, "C) Target Checks (Pass/Fail)", 11, INK, "Helvetica-Bold")
    y -= 14
    _hline(c, X0, X1, y)
    y -= 18

    tc = (snap.get("target_checks") or {})
    checks = (tc.get("checks") or []) if isinstance(tc, dict) else []
    if isinstance(checks, list) and checks:
        _txt(c, X0, y, "Check", 9, MUTED, "Helvetica-Bold")
        _txt(c, X0 + 320, y, "Result", 9, MUTED, "Helvetica-Bold")
        y -= 10
        _hline(c, X0, X1, y)
        y -= 18
        for ch in checks[:10]:
            metric = _safe((ch or {}).get("metric"))
            actual = _safe((ch or {}).get("actual"))
            tmax = _safe((ch or {}).get("target_max"))
            passed = (ch or {}).get("pass")
            verdict = "PASS" if passed is True else "FAIL" if passed is False else "—"
            col = GOOD if verdict == "PASS" else BAD if verdict == "FAIL" else MUTED
            _txt(c, X0, y, f"{metric} (actual {actual}, max {tmax})", 10, SUB)
            _txt(c, X0 + 320, y, verdict, 10, col, "Helvetica-Bold")
            y -= 16
    else:
        _txt(c, X0, y, "—", 10, SUB)
        y -= 16

    footer()
    c.save()
    return buf.getvalue()
