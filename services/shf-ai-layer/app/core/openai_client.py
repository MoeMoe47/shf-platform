from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from app.core.config import settings
from app.core.prompts import SYSTEM_PROMPT


def build_user_payload(data: dict[str, Any]) -> str:
    return json.dumps(data, indent=2, sort_keys=True)


def mock_analysis(data: dict[str, Any]) -> str:
    county = data.get("county", "Unknown County")
    metric = data.get("metric", "Unknown Metric")
    value = data.get("value", "N/A")
    prev = data.get("previous_value", "N/A")
    risk = data.get("risk_score", "N/A")
    funding_status = data.get("funding_status", "UNKNOWN")
    benchmark = data.get("benchmark", "N/A")
    recent_event = data.get("recent_event", "No recent event provided")

    return f"""[CURRENT STATE]
{county} is currently showing {metric} at {value}, with funding status set to {funding_status}. The benchmark is {benchmark}.

[WHAT CHANGED]
The previous value was {prev}. Recent event noted: {recent_event}.

[RISK ANALYSIS]
The current risk score is {risk}. This suggests the case should be reviewed for trend deterioration, verification gaps, or performance inconsistency.

[RECOMMENDED ACTION]
Route this case to analyst review and verify the underlying evidence before any funding-state change.

[REASONING]
The system shows a meaningful state snapshot, but action should be based on validated evidence and not metric movement alone.

[CONFIDENCE]
Medium"""
    

def run_analysis(data: dict[str, Any]) -> str:
    if settings.allow_mock_mode and not settings.openai_api_key:
        return mock_analysis(data)

    client = OpenAI(api_key=settings.openai_api_key)

    response = client.responses.create(
        model=settings.openai_model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_payload(data)},
        ],
    )

    return response.output_text.strip()
