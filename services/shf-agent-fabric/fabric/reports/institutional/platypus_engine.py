from __future__ import annotations

from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate

from .platypus_pages import (
    build_program_profile_story,
    build_population_context_story,
    build_funding_recommendation_story,
    build_funding_conditions_story,
)

def build_platypus_preview(ctx: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=52,
        rightMargin=52,
        topMargin=72,
        bottomMargin=52,
    )

    story = []
    story += build_program_profile_story(ctx)
    story += build_population_context_story(ctx)
    story += build_funding_recommendation_story(ctx)
    story += build_funding_conditions_story(ctx)

    doc.build(story)
    return buf.getvalue()
