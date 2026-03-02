from __future__ import annotations

from typing import Any, Dict, List
from fabric.registry_canon import load_registry



import json
from pathlib import Path

def _load_registry_entities() -> dict:
    """Load canonical registry contract entities."""
    # registry_loaders.py is at: services/shf-agent-fabric/fabric/compliance/registry_loaders.py
    # service_root = .../services/shf-agent-fabric
    service_root = Path(__file__).resolve().parents[2]
    reg_path = service_root / "contracts" / "registry" / "registry.json"
    if not reg_path.exists():
        raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Registry contract missing: {reg_path}")
    reg = json.loads(reg_path.read_text(encoding="utf-8"))
    ents = reg.get("entities", {})
    if not isinstance(ents, dict):
        raise RuntimeError("[COMPLIANCE_BOOT_FAIL] registry.json.entities must be an object/dict")
    return ents

def _get_payload(entity: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(entity.get("payload"), dict):
        return entity["payload"]
    return entity


def _infer_entity_type(entity_id: str, entity: Dict[str, Any], payload: Dict[str, Any]) -> str:
    for k in ("entityType", "type", "kind", "category"):
        v = payload.get(k) or entity.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip().lower()
    return ""


def _required(payload: Dict[str, Any], key: str, ctx: str) -> Any:
    v = payload.get(key)
    if v is None or (isinstance(v, str) and not v.strip()):
        raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Missing required field '{key}' in {ctx}")
    return v


def load_business_registry() -> List[Dict[str, Any]]:
    reg = load_registry()
    entities = reg.get("entities") or {}
    out: List[Dict[str, Any]] = []

    for entity_id, entity in entities.items():
        payload = _get_payload(entity)
        et = _infer_entity_type(entity_id, entity, payload)
        if et != "business":
            continue

        business_id = payload.get("businessId") or payload.get("id") or entity_id
        compliance_ref = _required(payload, "complianceProfileRef", f"business({business_id})")
        out.append({"businessId": business_id, "complianceProfileRef": compliance_ref})

    if not out:
        raise RuntimeError("[COMPLIANCE_BOOT_FAIL] No business entities found in registry.json (Gate G requires businesses).")
    return out


def load_app_registry() -> List[Dict[str, Any]]:
    reg = load_registry()
    entities = reg.get("entities") or {}
    out: List[Dict[str, Any]] = []

    for entity_id, entity in entities.items():
        payload = _get_payload(entity)
        et = _infer_entity_type(entity_id, entity, payload)
        if et != "app":
            continue

        app_id = payload.get("appId") or payload.get("id") or entity_id
        owning_business_id = _required(payload, "owningBusinessId", f"app({app_id})")
        compliance_ref = _required(payload, "complianceProfileRef", f"app({app_id})")

        out.append({
            "appId": app_id,
            "owningBusinessId": owning_business_id,
            "complianceProfileRef": compliance_ref,
        })

    if not out:
        raise RuntimeError("[COMPLIANCE_BOOT_FAIL] No app entities found in registry.json (Gate G requires apps).")
    return out


def load_agent_registry() -> list[dict]:
    entities = _load_registry_entities()
    agents: list[dict] = []

    for entity_key, ent_any in entities.items():
        payload = ent_any.get("payload") if isinstance(ent_any, dict) and isinstance(ent_any.get("payload"), dict) else ent_any
        if not isinstance(payload, dict):
            continue

        et = payload.get("entityType") or payload.get("type") or payload.get("kind") or payload.get("category")
        if et != "agent":
            continue

        agent_id = payload.get("agentId") or payload.get("id") or payload.get("name")
        if not isinstance(agent_id, str) or not agent_id.strip():
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Agent missing agentId in {entity_key}")

        owning_app_id = _required(payload, "owningAppId", f"agent({agent_id})")
        compliance_ref = _required(payload, "complianceProfileRef", f"agent({agent_id})")

        agents.append({
            "agentId": agent_id,
            "owningAppId": owning_app_id,
            "complianceProfileRef": compliance_ref,
        })

    if not agents:
        raise RuntimeError("[COMPLIANCE_BOOT_FAIL] No agent entities found (Gate G requires agents).")

    return agents
