from __future__ import annotations

from collections import deque
import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from fabric.admin_auth import require_admin_key
from fabric.layers.store import load_layer_registry
from fabric.layers.check_registry import POLICY_CHECKS, RISK_CHECKS, ALIGNMENT_CHECKS
from fabric.agent_store import is_layer_enabled, get_layer_disable_meta

router = APIRouter(
    prefix="/admin/gate",
    tags=["admin-gate"],
    dependencies=[Depends(require_admin_key)],
)

ROOT = Path(__file__).resolve().parents[1]
DB_DIR = ROOT / "db"
HISTORY_PATH = DB_DIR / "gate_history.jsonl"


def _find_layer(reg: dict[str, Any], layer_key: str) -> dict[str, Any] | None:
    for L in reg.get("layers", []) or []:
        if isinstance(L, dict) and L.get("layer_key") == layer_key:
            return L
    return None


def _enforced_ready(layer: dict[str, Any]) -> tuple[bool, dict[str, Any]]:
    enf = (layer.get("enforcement") or {})
    policy = list(enf.get("policy_checks") or [])
    risk = list(enf.get("risk_checks") or [])
    align = list(enf.get("alignment_checks") or [])

    missing_policy = [c for c in policy if c not in POLICY_CHECKS]
    missing_risk = [c for c in risk if c not in RISK_CHECKS]
    missing_align = [c for c in align if c not in ALIGNMENT_CHECKS]

    declared_any = bool(policy or risk or align)
    ok = declared_any and not (missing_policy or missing_risk or missing_align)

    return ok, {
        "declared_any": declared_any,
        "missing": {
            "policy_checks": missing_policy,
            "risk_checks": missing_risk,
            "alignment_checks": missing_align,
        },
        "declared": {
            "policy_checks": policy,
            "risk_checks": risk,
            "alignment_checks": align,
        },
    }


def _gate_required_layers(reg: dict[str, Any]) -> list[str]:
    inv = reg.get("system_invariants") or {}
    req = inv.get("global_gate_required_layers")
    if isinstance(req, list) and all(isinstance(x, str) for x in req):
        return list(req)
    # Fallback: only active + enforcement_required layers (can be large; but safe)
    out: list[str] = []
    for L in reg.get("layers", []) or []:
        if not isinstance(L, dict):
            continue
        lk = L.get("layer_key")
        if not lk:
            continue
        if (L.get("status") or "active") != "active":
            continue
        if not bool(L.get("enforcement_required", True)):
            continue
        out.append(lk)
    return out


def _compute_gate(reg: dict[str, Any]) -> dict[str, Any]:
    required_layers = _gate_required_layers(reg)
    blockers: list[dict[str, Any]] = []

    for lk in required_layers:
        L = _find_layer(reg, lk)
        if not L:
            blockers.append({"layer": lk, "reason": "missing_layer_definition"})
            continue

        # If layer is disabled (admin override), it's a hard blocker
        if not is_layer_enabled(lk):
            meta = get_layer_disable_meta(lk) or {}
            blockers.append(
                {
                    "layer": lk,
                    "reason": "layer_disabled",
                    "meta": meta,
                }
            )
            continue

        ok, details = _enforced_ready(L)
        if not ok:
            blockers.append(
                {
                    "layer": lk,
                    "reason": "layer_not_enforced_ready",
                    "details": details,
                }
            )

    gate_pass = (len(blockers) == 0)
    total = len(required_layers)
    if gate_pass:
        auditor_one_liner = f"GATE PASS: {total}/{total} required layers enabled + enforced_ready."
    else:
        tags = ",".join([f"{b.get('layer')}({b.get('reason')})" for b in blockers])
        auditor_one_liner = f"GATE FAIL: blockers={tags}"

    return {
        "gate_required_layers": required_layers,
        "gate_pass": gate_pass,
        "auditor_one_liner": auditor_one_liner,
        "gate_blockers": blockers,
    }


@router.get("/status")
def gate_status():
    """
    Auditor-friendly gate snapshot.
    """
    reg = load_layer_registry()
    out = {
        "schema_version": reg.get("schema_version"),
        "system_invariants": reg.get("system_invariants", {}),
    }
    out.update(_compute_gate(reg))
    return out


@router.get("/history")
def gate_history(limit: int = 50):
    """
    Minimal audit trail of enable/disable events.
    Reads db/gate_history.jsonl if present (append-only).
    """
    limit = int(limit)
    if limit < 1:
        limit = 1
    if limit > 500:
        limit = 500

    if not HISTORY_PATH.exists():
        return {"history": [], "note": "history file not found yet (db/gate_history.jsonl)"}

    q: deque[dict[str, Any]] = deque(maxlen=limit)
    try:
        with HISTORY_PATH.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    q.append(json.loads(line))
                except Exception:
                    continue
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"could not read history: {e}")

    return {"history": list(q)}
