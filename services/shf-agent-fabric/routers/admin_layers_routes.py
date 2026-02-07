from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from fabric.registry import list_agents
from fabric.agent_store import is_layer_enabled, set_layer_enabled, list_disabled_layers
from fabric.admin_auth import require_admin_key
from fabric.feedback import log_event

from fabric.layers.store import load_layer_registry, layer_index
from fabric.layers.check_registry import POLICY_CHECKS, RISK_CHECKS, ALIGNMENT_CHECKS

router = APIRouter(prefix="/admin/layers", tags=["admin-layers"], dependencies=[Depends(require_admin_key)])


class EnabledBody(BaseModel):
    enabled: bool
    # Hardening fields (required only when disabling)
    reason: str | None = Field(default=None, description="Required when disabling a layer")
    gov_approval: str | None = Field(default=None, description="Required when disabling a layer (ticket/approval id)")


def _layer_exists_or_404(layer_key: str) -> None:
    reg = load_layer_registry()
    idx = {L.get("layer_key") for L in reg.get("layers", []) if isinstance(L, dict)}
    if layer_key not in idx:
        raise HTTPException(status_code=404, detail="layer not found in layer_registry.json")


@router.get("")
def list_layers():
    """
    Registry-first layer listing:
    - shows all declared layers in layer_registry.json
    - includes enabled state from agent_store override mechanism
    """
    reg = load_layer_registry()
    overrides = list_disabled_layers()

    layers = []
    declared_keys = set()

    for L in reg.get("layers", []):
        if not isinstance(L, dict):
            continue
        lk = L.get("layer_key")
        if not lk:
            continue
        declared_keys.add(lk)
        layers.append(
            {
                "layer": lk,
                "name": L.get("name"),
                "status": L.get("status"),
                "enabled": is_layer_enabled(lk),
            }
        )

    # Optional drift check: agent layers that aren't declared in layer_registry.json
    agent_layers = sorted({a.get("layer") for a in list_agents() if a.get("layer")})
    undeclared = [x for x in agent_layers if x and x not in declared_keys]

    return {
        "layers": layers,
        "overrides": overrides,
        "undeclared_agent_layers": undeclared,
    }


@router.get("/{layer}/enabled")
def read_layer(layer: str):
    _layer_exists_or_404(layer)
    return {"layer": layer, "enabled": is_layer_enabled(layer)}


@router.post("/{layer}/enabled")
def update_layer(layer: str, body: EnabledBody):
    _layer_exists_or_404(layer)

    # HARDENING RULE:
    # disabling requires reason + governance approval ticket/id
    if body.enabled is False:
        if not body.reason or not str(body.reason).strip():
            raise HTTPException(status_code=400, detail="reason is required when disabling a layer")
        if not body.gov_approval or not str(body.gov_approval).strip():
            raise HTTPException(status_code=400, detail="gov_approval is required when disabling a layer")

    enabled = set_layer_enabled(layer, body.enabled, reason=body.reason, gov_approval=body.gov_approval)

    msg = f"layer enabled set to {enabled}"
    if body.enabled is False:
        msg = f"{msg} (DISABLED) reason={body.reason} gov_approval={body.gov_approval}"

    log_event(kind="admin", outcome="ok", layer=layer, message=msg)

    out = {"layer": layer, "enabled": enabled}
    if body.enabled is False:
        out["reason"] = body.reason
        out["gov_approval"] = body.gov_approval
    return out


@router.get("/registry")
def get_layer_registry():
    return load_layer_registry()


@router.get("/by-id/{layer_id}")
def get_layer_by_id(layer_id: int):
    reg = load_layer_registry()
    idx = layer_index(reg)
    if layer_id not in idx:
        raise HTTPException(status_code=404, detail="layer not found")
    return idx[layer_id]


@router.get("/coverage")
def get_layer_coverage():
    """
    Auditor-grade coverage view:
    - declared checks per layer
    - missing checks (declared but not registered)
    - enforced_ready = True only if at least one check is declared AND none are missing
    """
    reg = load_layer_registry()
    out = []

    for L in reg.get("layers", []):
        if not isinstance(L, dict):
            continue

        enf = L.get("enforcement", {}) or {}
        policy_checks = enf.get("policy_checks", []) or []
        risk_checks = enf.get("risk_checks", []) or []
        alignment_checks = enf.get("alignment_checks", []) or []

        if not isinstance(policy_checks, list):
            policy_checks = []
        if not isinstance(risk_checks, list):
            risk_checks = []
        if not isinstance(alignment_checks, list):
            alignment_checks = []

        missing_policy = [c for c in policy_checks if c not in POLICY_CHECKS]
        missing_risk = [c for c in risk_checks if c not in RISK_CHECKS]
        missing_alignment = [c for c in alignment_checks if c not in ALIGNMENT_CHECKS]

        missing = {
            "policy_checks": missing_policy,
            "risk_checks": missing_risk,
            "alignment_checks": missing_alignment,
        }

        declared_any = bool(policy_checks or risk_checks or alignment_checks)
        enforced_ready = declared_any and not (missing_policy or missing_risk or missing_alignment)

        out.append(
            {
                "layer_id": L.get("layer_id"),
                "layer_key": L.get("layer_key"),
                "name": L.get("name"),
                "status": L.get("status"),
                "enforcement_required": L.get("enforcement_required", True),
                "enforcement_mode": L.get("enforcement_mode"),
                "declared": {
                    "policy_checks": policy_checks,
                    "risk_checks": risk_checks,
                    "alignment_checks": alignment_checks,
                },
                "missing": missing,
                "enforced_ready": enforced_ready,
            }
        )

    
    # --- Global Gate status (auditor-grade: single source of truth in coverage output) ---
    inv = reg.get("system_invariants", {}) or {}
    gate_required = inv.get("global_gate_required_layers") or ["L01","L02","L03","L04","L05","L06","L07"]
    gate_required = [x for x in gate_required if isinstance(x, str) and x.strip()]

    # Build quick lookup from coverage rows we just computed
    by_layer = {row.get("layer_key"): row for row in out if isinstance(row, dict) and row.get("layer_key")}

    gate_blockers = []
    for lk in gate_required:
        row = by_layer.get(lk)
        if not row:
            gate_blockers.append({"layer": lk, "reason": "missing_from_coverage"})
            continue
        if not is_layer_enabled(lk):
            gate_blockers.append({"layer": lk, "reason": "layer_disabled"})
            continue
        if not bool(row.get("enforced_ready")):
            gate_blockers.append({"layer": lk, "reason": "not_enforced_ready"})

    gate_pass = (len(gate_blockers) == 0)

    if gate_pass:
        auditor_one_liner = f"GATE PASS: {len(gate_required)}/{len(gate_required)} required layers enabled + enforced_ready."
    else:
        # compact blockers string: L02(layer_disabled), L06(not_enforced_ready)
        compact = ", ".join([f"{b.get('layer')}({b.get('reason')})" for b in gate_blockers])
        auditor_one_liner = f"GATE FAIL: blockers={compact}"

    return {
        "schema_version": reg.get("schema_version"),
        "system_invariants": inv,
        "gate_required_layers": gate_required,
        "gate_pass": gate_pass,
        "auditor_one_liner": auditor_one_liner,
        "gate_blockers": gate_blockers,
        "coverage": out,
    }


@router.get("/gate/status")
def gate_status():
    """
    Auditor-grade global execution gate status.
    Single source of truth — no need to inspect layer coverage.
    """
    from fabric.layers.global_gate import assert_global_execution_allowed
    from fabric.layers.store import load_layer_registry
    from fabric.agent_store import is_layer_enabled

    reg = load_layer_registry()
    required = []
    blockers = []

    for L in reg.get("layers", []):
        if not isinstance(L, dict):
            continue
        lk = L.get("layer_key")
        if not lk:
            continue
        if not L.get("enforcement_required", True):
            continue
        if (L.get("status") or "active") != "active":
            continue

        required.append(lk)

        if not is_layer_enabled(lk):
            blockers.append({"layer": lk, "reason": "layer_disabled"})
            continue

        enf = L.get("enforcement") or {}
        declared_any = bool(
            enf.get("policy_checks") or
            enf.get("risk_checks") or
            enf.get("alignment_checks")
        )

        if not declared_any:
            blockers.append({"layer": lk, "reason": "not_enforced_ready"})

    gate_pass = len(blockers) == 0

    if gate_pass:
        one_liner = f"GATE PASS: {len(required)}/{len(required)} required layers enabled + enforced_ready."
    else:
        bl = ",".join(f"{b['layer']}({b['reason']})" for b in blockers)
        one_liner = f"GATE FAIL: blockers={bl}"

    return {
        "gate_pass": gate_pass,
        "auditor_one_liner": one_liner,
        "gate_required_layers": required,
        "gate_blockers": blockers,
    }

