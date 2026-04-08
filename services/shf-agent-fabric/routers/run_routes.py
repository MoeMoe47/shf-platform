from fastapi import APIRouter
from pydantic import BaseModel
from fabric.registry import find_agent_by_name
from fabric.runtime_state import get_mode
from fabric.agent_state import agent_allowed
from fabric.feedback import log_event
from fabric.planner import build_plan
from fabric.layers.global_gate import assert_global_execution_allowed
import secrets
from services.ai_layer.orchestrator import run_orchestrator

router = APIRouter(tags=["run"])


class RunBody(BaseModel):
    agentName: str
    input: dict


class SimulateBody(BaseModel):
    case: str
    region: str | None = None
    issue: str | None = None
    priority: str | None = "HIGH"


class ExecuteBody(BaseModel):
    case: str
    region: str | None = None
    issue: str | None = None
    priority: str | None = "HIGH"
    action: str | None = "EXECUTE INTERVENTION"


def _normalize_text(value) -> str:
    return str(value or "").strip()


def _case_support_analysis(payload: dict) -> dict:
    case_key = _normalize_text(payload.get("case"))
    region = _normalize_text(payload.get("region")) or "Unknown region"
    issue = _normalize_text(payload.get("issue"))
    priority = _normalize_text(payload.get("priority")).upper() or "MEDIUM"

    case_label_map = {
        "jason": "Jason T.",
        "sophia": "Sophia M.",
        "emily": "Emily S.",
    }
    case_label = case_label_map.get(case_key.lower(), case_key or "Selected Case")

    drivers = []
    issue_l = issue.lower()

    if "iep" in issue_l:
        drivers.append("IEP workflow risk requires immediate operator review")
    if "intervention" in issue_l:
        drivers.append("Intervention flow must be confirmed and documented")
    if "risk" in issue_l:
        drivers.append("Current case signals indicate elevated support urgency")

    risk_score = 72
    funding_impact = "Moderate funding exposure"
    urgency = "48 hours"
    dollar_impact = 1800
    compliance_status = "Watch"
    projected_risk_if_action = 58
    projected_risk_if_no_action = 84

    if case_key.lower() == "jason":
        drivers.extend([
            "Low engagement trend remains unresolved",
            "Reading recovery appears stalled",
            "Documentation timing may affect funding-safe reporting",
        ])
        risk_score = 91
        funding_impact = "High funding-safe reporting risk"
        urgency = "24 hours"
        dollar_impact = 4200
        compliance_status = "At Risk"
        projected_risk_if_action = 78
        projected_risk_if_no_action = 97
    elif case_key.lower() == "sophia":
        drivers.extend([
            "Attendance instability is increasing intervention risk",
            "Follow-through verification is needed",
            "Family contact and support alignment should be confirmed",
        ])
        risk_score = 78
        funding_impact = "Moderate funding exposure"
        urgency = "48 hours"
        dollar_impact = 2400
        compliance_status = "Watch"
        projected_risk_if_action = 61
        projected_risk_if_no_action = 88
    elif case_key.lower() == "emily":
        drivers.extend([
            "Positive momentum should be preserved",
            "Verification evidence should remain current",
            "Improvement should be documented to stay audit-ready",
        ])
        risk_score = 34
        funding_impact = "Low funding exposure"
        urgency = "Routine"
        dollar_impact = 650
        compliance_status = "Stable"
        projected_risk_if_action = 22
        projected_risk_if_no_action = 41
    else:
        drivers.append("Support plan should be reviewed against current case conditions")

    if priority == "HIGH":
        risk_score = min(100, risk_score + 2)
        projected_risk_if_no_action = min(100, projected_risk_if_no_action + 2)
    elif priority == "LOW":
        risk_score = max(0, risk_score - 8)
        projected_risk_if_action = max(0, projected_risk_if_action - 5)

    if risk_score >= 90:
        confidence = 93
        risk_level = "High"
    elif risk_score >= 75:
        confidence = 88
        risk_level = "Moderate"
    elif risk_score >= 50:
        confidence = 84
        risk_level = "Moderate"
    else:
        confidence = 96
        risk_level = "Low"

    if case_key.lower() == "jason":
        next_step = "Assign intervention and verify within 24 hours"
        action_label = "EXECUTE INTERVENTION"
        summary = (
            f"{case_label} is the current operating focus in {region}. "
            f"Primary concern is delayed intervention flow with funding-safe documentation risk."
        )
    elif case_key.lower() == "sophia":
        next_step = "Stabilize attendance and verify contact steps"
        action_label = "START ATTENDANCE PLAN"
        summary = (
            f"{case_label} requires attendance stabilization in {region}. "
            f"Intervention alignment should be confirmed before risk escalates."
        )
    elif case_key.lower() == "emily":
        next_step = "Document gains and lock verification evidence"
        action_label = "LOCK VERIFICATION"
        summary = (
            f"{case_label} shows positive progress in {region}. "
            f"Priority is keeping verification current and audit-ready."
        )
    else:
        next_step = "Review case and confirm support plan"
        action_label = "REVIEW CASE"
        summary = (
            f"{case_label} requires a support review in {region}. "
            f"Operator should validate case status, timing, and documentation."
        )


    # 🔥 AI ORCHESTRATOR EXECUTION
    orchestrated = run_orchestrator({
        "region": region,
        "issue": issue,
        "priority": priority,
        "confidence": confidence,
        "funding": funding_impact,
        "status": compliance_status
    })

    return {
        "type": "analysis",
        "headline": f"{action_label} → {case_label.upper()}",
        "summary": summary,
        "drivers": drivers[:4],
        "riskLevel": risk_level,
        "riskScore": risk_score,
        "recommendedAction": next_step,
        "actionLabel": action_label,
        "confidence": confidence,
        "fundingImpact": funding_impact,
        "urgency": urgency,
        "dollarImpact": dollar_impact,
        "complianceStatus": compliance_status,
        "projection": {
            "risk_if_action": projected_risk_if_action,
            "risk_if_no_action": projected_risk_if_no_action,
            "funding_if_action": "Moderate recoverable exposure" if projected_risk_if_action >= 60 else "Low recoverable exposure",
            "funding_if_no_action": "Escalates to unrecoverable reporting exposure" if projected_risk_if_no_action >= 90 else "Elevated reporting exposure",
            "compliance_if_action": "Stabilizes with verification",
            "compliance_if_no_action": "Remains at risk",
        },
        "case": case_label,
        "region": region,
        "priority": priority,
        "ai": orchestrated,
    }


@router.post("/execute-intervention")
def execute_intervention(body: ExecuteBody):
    assert_global_execution_allowed(route="/execute-intervention")
    request_id = secrets.token_hex(6)

    if get_mode() != "ON":
        return {"ok": False, "requestId": request_id, "reason": "FABRIC_MODE=OFF"}

    payload = {
        "case": body.case,
        "region": body.region or "Unknown region",
        "issue": body.issue or "IEP risk + intervention flow",
        "priority": body.priority or "HIGH",
    }

    analysis = _case_support_analysis(payload)

    risk_now = analysis.get("riskScore", 0)
    risk_after = max(0, risk_now - 18)

    output = {
        "type": "execution",
        "headline": f"EXECUTION COMPLETE → {analysis.get('case', 'CASE').upper()}",
        "summary": f"{body.action or 'EXECUTE INTERVENTION'} was logged for {analysis.get('case', 'Selected Case')} in {analysis.get('region', 'Unknown region')}.",
        "actionTaken": body.action or "EXECUTE INTERVENTION",
        "case": analysis.get("case"),
        "region": analysis.get("region"),
        "riskBefore": risk_now,
        "riskAfter": risk_after,
        "fundingImpact": analysis.get("fundingImpact"),
        "dollarImpact": analysis.get("dollarImpact"),
        "complianceStatus": "Intervention Logged",
        "nextStatus": "FOLLOW-UP REQUIRED",
        "auditMessage": "Execution recorded and ready for verification workflow.",
        "ai": analysis.get("ai"),
    }

    log_event(
        kind="execute_intervention",
        outcome="ok",
        message="intervention executed",
        request_id=request_id,
    )

    return {
        "ok": True,
        "requestId": request_id,
        "output": output,
    }

@router.post("/simulate-outcome")
def simulate_outcome(body: SimulateBody):
    assert_global_execution_allowed(route="/simulate-outcome")
    request_id = secrets.token_hex(6)

    if get_mode() != "ON":
        return {"ok": False, "requestId": request_id, "reason": "FABRIC_MODE=OFF"}

    payload = {
        "case": body.case,
        "region": body.region or "Unknown region",
        "issue": body.issue or "IEP risk + intervention flow",
        "priority": body.priority or "HIGH",
    }

    analysis = _case_support_analysis(payload)
    projection = analysis.get("projection", {}) or {}

    output = {
        "type": "simulation",
        "headline": f"SIMULATION → {analysis.get('case', 'CASE').upper()}",
        "summary": f"If action is taken, projected risk moves to {projection.get('risk_if_action', 'N/A')}/100. If no action is taken, projected risk moves to {projection.get('risk_if_no_action', 'N/A')}/100.",
        "riskNow": analysis.get("riskScore"),
        "riskIfAction": projection.get("risk_if_action"),
        "riskIfNoAction": projection.get("risk_if_no_action"),
        "fundingIfAction": projection.get("funding_if_action"),
        "fundingIfNoAction": projection.get("funding_if_no_action"),
        "complianceIfAction": projection.get("compliance_if_action"),
        "complianceIfNoAction": projection.get("compliance_if_no_action"),
        "dollarImpact": analysis.get("dollarImpact"),
        "urgency": analysis.get("urgency"),
        "case": analysis.get("case"),
        "region": analysis.get("region"),
        "ai": analysis.get("ai"),
    }

    log_event(
        kind="simulate_outcome",
        outcome="ok",
        message="simulation executed",
        request_id=request_id,
    )

    return {
        "ok": True,
        "requestId": request_id,
        "output": output,
    }

@router.post("/run")
def run(body: RunBody):
    assert_global_execution_allowed(route="/run")
    request_id = secrets.token_hex(6)

    if get_mode() != "ON":
        log_event(kind="run", outcome="blocked", message="FABRIC_MODE=OFF", request_id=request_id)
        return {"ok": False, "requestId": request_id, "blocked": True, "reason": "FABRIC_MODE=OFF"}

    agent = find_agent_by_name(body.agentName)
    if not agent:
        log_event(kind="run", outcome="error", message=f"unknown agent {body.agentName}", request_id=request_id)
        return {"ok": False, "requestId": request_id, "error": "unknown agent"}

    if not agent_allowed(agent):
        log_event(
            kind="run",
            outcome="blocked",
            agent_name=agent.get("name"),
            agent_id=agent.get("agentId"),
            layer=agent.get("layer"),
            message="agent or layer disabled",
            request_id=request_id,
        )
        return {"ok": False, "requestId": request_id, "blocked": True, "reason": "agent or layer disabled"}

    policy = agent.get("policy") or {}
    if policy.get("humanApproval", False):
        plan_obj = build_plan(agent, body.input)
        msg = "humanApproval=true. Use POST /plan then POST /runs/execute (admin-only) with approved=true."
        log_event(
            kind="run",
            outcome="blocked",
            agent_name=agent.get("name"),
            agent_id=agent.get("agentId"),
            layer=agent.get("layer"),
            message=msg,
            request_id=request_id,
        )
        return {
            "ok": False,
            "requestId": request_id,
            "blocked": True,
            "reason": "approval required",
            "plan": plan_obj,
        }

    if body.agentName == "Layer09CaseSupportAgent":
        output = _case_support_analysis(body.input)
        log_event(
            kind="run",
            outcome="ok",
            agent_name=agent.get("name"),
            agent_id=agent.get("agentId"),
            layer=agent.get("layer"),
            message="case support analysis executed",
            request_id=request_id,
        )
        return {
            "ok": True,
            "requestId": request_id,
            "agent": {
                "name": agent.get("name"),
                "layer": agent.get("layer"),
                "agentId": agent.get("agentId"),
            },
            "output": output,
        }

    output = {
        "type": "draft",
        "note": "Stub executor. Real logic not yet wired for this agent.",
        "echo": body.input,
    }

    log_event(
        kind="run",
        outcome="ok",
        agent_name=agent.get("name"),
        agent_id=agent.get("agentId"),
        layer=agent.get("layer"),
        message="stub run executed",
        request_id=request_id,
    )

    return {
        "ok": True,
        "requestId": request_id,
        "agent": {
            "name": agent.get("name"),
            "layer": agent.get("layer"),
            "agentId": agent.get("agentId"),
        },
        "output": output,
    }
