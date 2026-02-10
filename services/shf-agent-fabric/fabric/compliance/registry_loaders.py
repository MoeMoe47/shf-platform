from __future__ import annotations

from typing import Any, Dict, List
from fabric.registry_canon import load_registry


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
