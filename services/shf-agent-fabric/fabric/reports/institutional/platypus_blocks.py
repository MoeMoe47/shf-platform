from __future__ import annotations

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, KeepTogether

styles = getSampleStyleSheet()

TITLE = ParagraphStyle(
    "InstitutionTitle",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=18,
    leading=22,
    textColor=colors.HexColor("#0B1220"),
    spaceAfter=8,
)

SECTION = ParagraphStyle(
    "InstitutionSection",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=14,
    textColor=colors.HexColor("#0B1220"),
    spaceAfter=6,
)

BODY = ParagraphStyle(
    "InstitutionBody",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#475467"),
    alignment=TA_LEFT,
    spaceAfter=2,
)

SMALL = ParagraphStyle(
    "InstitutionSmall",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=7.5,
    leading=9,
    textColor=colors.HexColor("#98A2B3"),
    alignment=TA_LEFT,
)

CENTER_SMALL = ParagraphStyle(
    "InstitutionCenterSmall",
    parent=SMALL,
    alignment=TA_CENTER,
)

BANNER = ParagraphStyle(
    "InstitutionBanner",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=13,
    leading=15,
    textColor=colors.HexColor("#F97316"),
    spaceAfter=2,
)

def p(text: str, style=BODY):
    return Paragraph(str(text or "-"), style)

def spacer(h: float = 0.12 * inch):
    return Spacer(1, h)

def section_title(text: str):
    return Paragraph(text, SECTION)

def card(title: str, body_lines: list[str]):
    content = [Paragraph(title, SECTION), Spacer(1, 4)]
    for line in body_lines:
        content.append(Paragraph(str(line or "-"), BODY))
    table = Table([[KeepTogether(content)]], colWidths=["100%"])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBFDFF")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9E1EA")),
        ("ROUNDEDCORNERS", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return table

def metric_banner(label: str, value: str, tone: str = "neutral", subtitle: str | None = None):
    color_map = {
        "good": colors.HexColor("#12B76A"),
        "warn": colors.HexColor("#F79009"),
        "bad": colors.HexColor("#F04438"),
        "neutral": colors.HexColor("#F97316"),
    }
    value_style = ParagraphStyle(
        "MetricValue",
        parent=BANNER,
        textColor=color_map.get(tone, color_map["neutral"]),
    )
    content = [
        Paragraph(label, SECTION),
        Paragraph(value, value_style),
    ]
    if subtitle:
        content.append(Paragraph(subtitle, BODY))
    table = Table([[KeepTogether(content)]], colWidths=["100%"])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBFDFF")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9E1EA")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return table

def data_table(title: str, headers: list[str], rows: list[list[str]], col_widths=None):
    if not rows:
        rows = [["-"] * len(headers)]

    header_row = [Paragraph(h, SMALL) for h in headers]
    body_rows = [[Paragraph(str(cell or "-"), BODY) for cell in row] for row in rows]
    data = [[Paragraph(title, SECTION)]] + [[
        Table([header_row] + body_rows, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    ]]

    outer = Table(data, colWidths=["100%"])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D9E1EA")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))

    inner = outer._cellvalues[1][0]
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
    return outer
