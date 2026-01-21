from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional

SwarmState = Literal["OFF", "LIMITED", "ON"]
RiskLevel = Literal["low", "medium", "high"]
Decision = Literal["allowed", "blocked", "allowed_with_limits"]

SAFE_CAPS_DEFAULT = ["read", "summarize", "draft_text", "draft_report"]

class RateLimits(BaseModel):
    rpm: int = 60
    daily_budget_usd: float = 25.0

class SwarmPolicy(BaseModel):
    state: SwarmState = "LIMITED"
    allowed_agents: List[str] = Field(default_factory=list)
    blocked_agents: List[str] = Field(default_factory=list)
    allowed_capabilities: List[str] = Field(default_factory=list)
    blocked_capabilities: List[str] = Field(default_factory=list)

class AppManifest(BaseModel):
    app_id: str
    display_name: str
    owner: str = "admin"
    risk_profile: str = "medium"
    data_scopes: List[str] = Field(default_factory=list)
    rate_limits: RateLimits = Field(default_factory=RateLimits)
    swarm: SwarmPolicy = Field(default_factory=SwarmPolicy)
    last_seen_at: Optional[str] = None

class AlignRequest(BaseModel):
    app_id: str
    user_id: str
    request_id: str
    purpose: str
    risk_level: RiskLevel = "low"
    requested_agents: List[str] = Field(default_factory=list)
    requested_capabilities: List[str] = Field(default_factory=list)
    payload: Dict[str, Any] = Field(default_factory=dict)

class AlignResponse(BaseModel):
    request_id: str
    decision: Decision
    reason: str
    enforced_state: SwarmState
    limits_applied: List[str] = Field(default_factory=list)
    result: Dict[str, Any] = Field(default_factory=dict)
    audit_ref: str = ""
