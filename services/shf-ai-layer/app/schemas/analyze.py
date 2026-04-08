from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    county: str | None = None
    state: str | None = None
    metric: str | None = None
    value: float | int | str | None = None
    previous_value: float | int | str | None = None
    risk_score: float | None = None
    confidence_score: float | None = None
    funding_status: str | None = None
    recent_event: str | None = None
    benchmark: float | int | str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AnalyzeResponse(BaseModel):
    ok: bool = True
    result: str
    model: str
