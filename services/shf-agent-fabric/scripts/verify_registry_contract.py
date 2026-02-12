from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple


ROOT = Path(__file__).resolve().parents[1]  # services/shf-agent-fabric
REGISTRY = ROOT / "contracts/registry/registry.json"
MANIFEST = ROOT / "complianceProfiles/index.json"

ALLOWED_TYPES = {"business", "app", "agent"}


def die(msg: str) -> None:
    raise SystemExit(f"❌ REGISTRY CONTRACT FAIL: {msg}")


def load_json(p: Path) -> Dict[str, Any]:
    if not p.exists():
        die(f"Missing required file: {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def entity_payload(ent: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(ent.get("payload"), dict):
        return ent["payload"]
    return ent


def get_entity_type(ent: Dict[str, Any]) -> str:
    p = entity_payload(ent)
    for k in ("entityType", "type", "kind", "category"):
        v = p.get(k) or ent.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def required(p: Dict[str, Any], key: str, ctx: str) -> str:
    v = p.get(key)
    if not isinstance(v, str) or not v.strip():
        die(f"Missing required '{key}' in {ctx}")
    return v.strip()


def main() -> None:
    reg = load_json(REGISTRY)
    man = load_json(MANIFEST)

    entities: Dict[str, Any] = reg.get("entities") or {}
    if not isinstance(entities, dict) or not entities:
        die("registry.json must contain non-empty object 'entities'")

    policy_ids = set()
    g = man.get("global", {})
    if isinstance(g, dict):
        pid = g.get("policyId")
        if isinstance(pid, str) and pid.strip():
            policy_ids.add(pid.strip())

    for item in (man.get("profiles") or []):
        if isinstance(item, dict):
            pid = item.get("policyId")
            if isinstance(pid, str) and pid.strip():
                policy_ids.add(pid.strip())

    if not policy_ids:
        die("complianceProfiles/index.json contains no policyIds (global/profiles)")

    # Build business id set from entities (by entity key = registry key)
    business_keys = set()
    app_keys = set()

    errors = 0

    for eid, ent_any in entities.items():
        if not isinstance(ent_any, dict):
            die(f"Entity '{eid}' must be an object")
        ent = ent_any
        p = entity_payload(ent)
        et = get_entity_type(ent)

        if et not in ALLOWED_TYPES:
            die(f"Entity '{eid}' has invalid type '{et}'. Allowed: {sorted(ALLOWED_TYPES)}")

        # complianceProfileRef required for all 3 types
        cpr = required(p, "complianceProfileRef", f"{et}({eid})")
        if cpr not in policy_ids:
            die(f"{et}({eid}) complianceProfileRef='{cpr}' not found in complianceProfiles/index.json")

        if et == "business":
            business_keys.add(eid)

        if et == "app":
            app_keys.add(eid)

    # Second pass: agent owningAppId must exist as an app entity
    for eid, ent_any in entities.items():
        ent = ent_any
        pld = entity_payload(ent)
        et = get_entity_type(ent)
        if et != "agent":
            continue
        owning_app = required(pld, "owningAppId", f"agent({eid})")
        if owning_app not in app_keys:
            die(f"agent({eid}) owningAppId='{owning_app}' not found as an app entity in registry")

    # Second pass: app owningBusinessId must exist as a business entity
    for eid, ent_any in entities.items():
        ent = ent_any
        p = entity_payload(ent)
        et = get_entity_type(ent)
        if et != "app":
            continue
        owning = required(p, "owningBusinessId", f"app({eid})")
        if owning not in business_keys:
            die(f"app({eid}) owningBusinessId='{owning}' not found as a business entity in registry")

    print("✅ REGISTRY CONTRACT OK")
    print(f"   entities: {len(entities)}")
    print(f"   businesses: {len(business_keys)}")
    print(f"   apps: {len(app_keys)}")
    print(f"   policies known: {len(policy_ids)}")


if __name__ == "__main__":
    main()
