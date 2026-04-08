from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

styles = getSampleStyleSheet()

TITLE = ParagraphStyle(
    "PreviewTitle",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=16,
    leading=20,
    textColor=colors.HexColor("#0B1220"),
    alignment=TA_LEFT,
    spaceAfter=6,
)

SECTION = ParagraphStyle(
    "PreviewSection",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=14,
    textColor=colors.HexColor("#0B1220"),
    alignment=TA_LEFT,
    spaceAfter=4,
)

BODY = ParagraphStyle(
    "PreviewBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#475467"),
    alignment=TA_LEFT,
)

SMALL = ParagraphStyle(
    "PreviewSmall",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=7.5,
    leading=9,
    textColor=colors.HexColor("#98A2B3"),
    alignment=TA_LEFT,
)


def safe(v: Any, fallback: str = "-") -> str:
    if v is None:
        return fallback
    s = str(v).strip()
    return s if s else fallback


def p(text: str, style=BODY) -> Paragraph:
    return Paragraph(safe(text), style)


def spacer(h: float = 10):
    return Spacer(1, h)


def card(title: str, body_lines: List[str]):
    content = [[
        Paragraph(title, SECTION),
    ]]
    for line in body_lines:
        content.append([Paragraph(safe(line), BODY)])

    t = Table(content, colWidths=[500])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBFDFF")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9E1EA")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def metric_banner(title: str, value: str, tone: str = "neutral"):
    tone_map = {
        "neutral": colors.HexColor("#F97316"),
        "warn": colors.HexColor("#F79009"),
        "bad": colors.HexColor("#F04438"),
        "good": colors.HexColor("#12B76A"),
    }
    value_style = ParagraphStyle(
        "MetricBannerValue",
        parent=BODY,
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=15,
        textColor=tone_map.get(tone, colors.HexColor("#F97316")),
    )
    data = [
        [Paragraph(title, SECTION)],
        [Paragraph(safe(value), value_style)],
    ]
    t = Table(data, colWidths=[500])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBFDFF")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9E1EA")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def data_table(title: str, headers: List[str], rows: List[List[str]], col_widths=None):
    if not rows:
        rows = [["-"] * len(headers)]

    header_row = [Paragraph(h, SMALL) for h in headers]
    body_rows = [[Paragraph(safe(cell), BODY) for cell in row] for row in rows]
    inner = Table([header_row] + body_rows, colWidths=col_widths, repeatRows=1)
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#98A2B3")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E8EEF5")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    outer = Table([
        [Paragraph(title, SECTION)],
        [inner],
    ], colWidths=[500])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9E1EA")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return outer


def normalize_preview_ctx(report: Dict[str, Any]) -> Dict[str, Any]:
    report = report or {}
    run = report.get("run") or {}
    funder = report.get("funder_language") or {}

    return {
        "run": {
            "name": safe(run.get("name"), "Pilot Run"),
            "site": safe(run.get("site"), "-"),
            "mode": safe(run.get("mode"), "PILOT"),
            "owner": safe(run.get("owner"), "SHF Pilot Ops"),
            "start_ts": safe(run.get("start_ts"), "-"),
            "end_ts": safe(run.get("end_ts"), "-"),
        },
        "program_profile": {
            "program_name": safe(run.get("name"), "Pilot Run"),
            "program_type": "Workforce and youth development pilot",
            "operator_name": safe(run.get("owner"), "SHF Pilot Ops"),
            "site_name": safe(run.get("site"), "-"),
            "delivery_model": "Community-based pilot delivery",
            "pilot_stage": safe(run.get("mode"), "PILOT"),
            "program_description": safe(
                funder.get("summary"),
                "Pilot report prepared for institutional funding-readiness review."
            ),
        },
        "population_context": {
            "population_served_summary": "Participants are served through a community-centered pilot environment designed to track engagement and stability.",
            "community_context": "This pilot is intended to demonstrate measurable outcome performance before broader replication or scale.",
            "implementation_notes": "This reporting period reflects an active pilot review window.",
            "constraints_or_limitations": "Institutional sections will become more detailed as additional data feeds are connected.",
        },
        "funding_recommendation": {
            "recommendation_type": "Conditional Continue",
            "recommendation_summary": safe(
                funder.get("recommendation"),
                "Add retention intervention checkpoints for at-risk participants and monitor weekly exit reasons."
            ),
            "justification": safe(
                funder.get("risk"),
                "Operational risk is elevated and should be addressed before expansion."
            ),
            "funding_posture": "Maintain",
            "confidence_statement": "Confidence is moderate pending additional institutional validation.",
            "effective_period": "Next 90 days",
        },
        "funding_conditions": report.get("funding_conditions") if report.get("funding_conditions") is not None else [
            {
                "condition": "Retention stabilization",
                "owner": "Program Ops",
                "due": "2026-06-30",
                "status": "Open",
                "measure": "Retention meets target",
            },
            {
                "condition": "Incident monitoring improvement",
                "owner": "Site Lead",
                "due": "2026-06-30",
                "status": "In Progress",
                "measure": "Incident rate at or below threshold",
            },
        ],
    }


def build_preview_pdf(report: Dict[str, Any]) -> bytes:
    ctx = normalize_preview_ctx(report)
    buf = BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=52,
        rightMargin=52,
        topMargin=52,
        bottomMargin=42,
    )

    story = []

    # Page 5 preview
    story.append(Paragraph("Page 5 Preview — Program Profile", TITLE))
    prof = ctx["program_profile"]
    rows = [
        ["Program Name", prof["program_name"], "Delivery Model", prof["delivery_model"]],
        ["Program Type", prof["program_type"], "Pilot Stage", prof["pilot_stage"]],
        ["Operator", prof["operator_name"], "Reporting Start", ctx["run"]["start_ts"]],
        ["Site Name", prof["site_name"], "Reporting End", ctx["run"]["end_ts"]],
    ]
    story.append(data_table("Program Profile", ["Field", "Value", "Field", "Value"], rows, col_widths=[95, 155, 95, 155]))
    story.append(spacer())
    story.append(card("Program Description", [prof["program_description"]]))
    story.append(PageBreak())

    # Page 6 preview
    story.append(Paragraph("Page 6 Preview — Population Context", TITLE))
    pop = ctx["population_context"]
    story.append(card("Population Served", [pop["population_served_summary"]]))
    story.append(spacer())
    story.append(card("Operating Context", [pop["community_context"]]))
    story.append(spacer())
    story.append(card("Implementation Notes and Limitations", [pop["implementation_notes"], pop["constraints_or_limitations"]]))
    story.append(PageBreak())

    # Page 13 preview
    story.append(Paragraph("Page 13 Preview — Funding Recommendation", TITLE))
    fr = ctx["funding_recommendation"]
    story.append(metric_banner("Recommendation Type", fr["recommendation_type"], tone="warn"))
    story.append(spacer())
    story.append(card("Recommendation Summary", [fr["recommendation_summary"]]))
    story.append(spacer())
    story.append(card("Justification", [fr["justification"]]))
    story.append(spacer())
    story.append(metric_banner("Funding Posture", fr["funding_posture"], tone="warn"))
    story.append(spacer())
    story.append(card("Confidence and Effective Period", [fr["confidence_statement"], f"Effective Period: {fr['effective_period']}"]))
    story.append(PageBreak())

    # Page 14 preview
    story.append(Paragraph("Page 14 Preview — Funding Conditions", TITLE))
    raw_fc = ctx["funding_conditions"]
    if isinstance(raw_fc, dict):
        summary = raw_fc.get("summary", "These conditions define what must be achieved before continuation without restriction or broader scale approval.")
        conditions = raw_fc.get("conditions") or []
    elif isinstance(raw_fc, list):
        summary = "These conditions define what must be achieved before continuation without restriction or broader scale approval."
        conditions = raw_fc
    else:
        summary = "These conditions define what must be achieved before continuation without restriction or broader scale approval."
        conditions = []

    rows = []
    for cnd in conditions:
        if not isinstance(cnd, dict):
            continue
        rows.append([
            cnd.get("condition") or cnd.get("title") or "-",
            cnd.get("owner", "-"),
            (cnd.get("due") or cnd.get("due_date") or "-")[:10],
            cnd.get("status", "-"),
            cnd.get("measure") or cnd.get("success_measure") or "-",
        ])

    story.append(card("Conditions Summary", [summary]))
    story.append(spacer())
    story.append(data_table(
        "Condition Table",
        ["Condition", "Owner", "Due", "Status", "Success Measure"],
        rows,
        col_widths=[150, 70, 55, 70, 155]
    ))
    story.append(spacer())
    story.append(card("Status Legend", ["Open = not yet satisfied   |   In Progress = active corrective work   |   Closed = condition met"]))

    doc.build(story)
    return buf.getvalue()
