from ..layout import TOP_Y, X0, CONTENT_W, draw_standard_header, draw_standard_footer, rr, txt, draw_table, BAD

def render_operational_integrity_page(c, ctx, page_spec):
    draw_standard_header(c, ctx, page_spec["title"])
    oi = ctx.get("operational_integrity", {})

    y = TOP_Y
    rr(c, X0, y - 50, CONTENT_W, 50, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Verification Status", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 38, oi.get("verification_status", "Needs Review"), 12, color=BAD, font="Helvetica-Bold")
    y -= 64

    rows = [
        ["Events Seen After Filter", str(oi.get("events_seen_after_filter", 0))],
        ["Canonical Events Used", str(oi.get("canonical_events_used", 0))],
        ["Legacy Events Ignored", str(oi.get("legacy_events_ignored", 0))],
        ["Manual Override Rate", str(oi.get("manual_override_rate", 0))],
        ["p95 Duration (ms)", str(oi.get("p95_duration_ms", "-"))],
        ["Program Health Score", str(oi.get("program_health_score", 0.0))],
    ]
    y = draw_table(c, X0, y, CONTENT_W, "Integrity Indicators", ["Indicator", "Value"], rows, [70, 30], row_h=18) - 10

    rr(c, X0, y - 56, CONTENT_W, 56, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Integrity Summary", 10, font="Helvetica-Bold")
    txt(c, X0 + 16, y - 40, oi.get("integrity_summary", "Operational integrity indicators are present and should be strengthened as the verification layer matures."), 8, color="#475467")
    y -= 70

    rr(c, X0, y - 60, CONTENT_W, 60, 13, "#FBFDFF", "#D9E1EA")
    txt(c, X0 + 16, y - 20, "Integrity Flags", 10, font="Helvetica-Bold")
    flags = oi.get("integrity_flags") or ["Verification layer is still developing.", "Institutional integrity depth should increase before large-scale deployment."]
    yy = y - 40
    for f in flags[:3]:
        txt(c, X0 + 16, yy, f"-  {f}", 8, color="#475467")
        yy -= 12

    draw_standard_footer(c, ctx, page_spec["footer_label"])
