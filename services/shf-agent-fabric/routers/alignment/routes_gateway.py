from __future__ import annotations
import os
from fastapi import APIRouter, Header, HTTPException
from .models import AlignRequest, AlignResponse
from .store import get_app, touch_last_seen
from .policy import l25_decide
from .containment import get_l26_effect
from .audit import write_audit
from routers.runs_routes import execute_run

router = APIRouter(prefix="/align", tags=["alignment"])

def require_app_gateway_key(x_app_key: str | None):
    expected = (os.getenv("APP_GATEWAY_KEY", "") or "").strip()
    if not expected:
        raise HTTPException(status_code=500, detail="APP_GATEWAY_KEY not set on server")
    if not x_app_key or x_app_key.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/run", response_model=AlignResponse)
def run(req: AlignRequest, x_app_key: str | None = Header(default=None)):
    require_app_gateway_key(x_app_key)
    app = get_app(req.app_id)
    if not app:
        audit_ref = write_audit({"kind":"align_run","decision":"blocked","reason":"unknown app_id","app_id":req.app_id,"request_id":req.request_id})
        return AlignResponse(request_id=req.request_id, decision="blocked", reason="blocked: unknown app_id", enforced_state="OFF", audit_ref=audit_ref)
    touch_last_seen(req.app_id)
    l26 = get_l26_effect(req.app_id, req.requested_agents, req.requested_capabilities)
    forced = l26.get("forced_app_state")
    if forced in ("OFF", "LIMITED", "ON") and forced != app.swarm.state:
        order = {"ON": 2, "LIMITED": 1, "OFF": 0}
        if order[forced] < order[app.swarm.state]:
            app.swarm.state = forced
    if l26["blocked_agents_now"]:
        reason = f"blocked: L26 blocked agents {l26['blocked_agents_now']}"
        audit_ref = write_audit({"kind":"align_run","decision":"blocked","reason":reason,"app_id":req.app_id,"request_id":req.request_id,"l26":l26})
        return AlignResponse(request_id=req.request_id, decision="blocked", reason=reason, enforced_state=app.swarm.state, audit_ref=audit_ref)
    if l26["blocked_caps_now"]:
        reason = f"blocked: L26 blocked capabilities {l26['blocked_caps_now']}"
        audit_ref = write_audit({"kind":"align_run","decision":"blocked","reason":reason,"app_id":req.app_id,"request_id":req.request_id,"l26":l26})
        return AlignResponse(request_id=req.request_id, decision="blocked", reason=reason, enforced_state=app.swarm.state, audit_ref=audit_ref)
    decision_reason, limits = l25_decide(app, req)
    if not decision_reason.startswith("allowed"):
        audit_ref = write_audit({"kind":"align_run","decision":"blocked","reason":decision_reason,"app_id":req.app_id,"request_id":req.request_id,"limits":limits,"l26":l26})
        return AlignResponse(request_id=req.request_id, decision="blocked", reason=decision_reason, enforced_state=app.swarm.state, limits_applied=limits, audit_ref=audit_ref)
    run_payload = dict(req.payload or {})
    plan_id = run_payload.get("planId")
    if not plan_id:
        reason = "blocked: planId required in payload for execute_run"
        audit_ref = write_audit({"kind":"align_run","decision":"blocked","reason":reason,"app_id":req.app_id,"request_id":req.request_id})
        return AlignResponse(request_id=req.request_id, decision="blocked", reason=reason, enforced_state=app.swarm.state, audit_ref=audit_ref)

    requested_approved = bool(run_payload.get("approved"))
    if requested_approved and app.swarm.state != "ON":
        run_payload["approved"] = False
    else:
        run_payload["approved"] = requested_approved

    try:
        result = execute_run(run_payload, x_admin_key=os.getenv("ADMIN_API_KEY"))
    except HTTPException as e:
        reason = f"blocked: run engine: {getattr(e, 'detail', str(e))}"
        audit_ref = write_audit({"kind":"align_run","decision":"blocked","reason":reason,"app_id":req.app_id,"request_id":req.request_id,"planId":plan_id})
        return AlignResponse(request_id=req.request_id, decision="blocked", reason=reason, enforced_state=app.swarm.state, audit_ref=audit_ref)

    audit_ref = write_audit({"kind":"align_run","decision":"allowed","reason":"allowed","app_id":req.app_id,"request_id":req.request_id,"limits":limits,"l26":l26})
    return AlignResponse(request_id=req.request_id, decision="allowed" if not limits else "allowed_with_limits", reason="allowed", enforced_state=app.swarm.state, limits_applied=limits, result=result, audit_ref=audit_ref)
