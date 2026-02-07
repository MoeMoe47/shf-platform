"""
Central registry of enforceable checks.
Phase 1: declarative existence checking (coverage ✅/❌).
Phase 2: execution wiring (policy_engine/risk_engine/alignment).
"""

from __future__ import annotations

from typing import Callable, Dict

# Policy checks that can be referenced by layer_registry.json
POLICY_CHECKS: Dict[str, Callable] = {}

# Risk checks that can be referenced by layer_registry.json
RISK_CHECKS: Dict[str, Callable] = {}

# Alignment checks that can be referenced by layer_registry.json
ALIGNMENT_CHECKS: Dict[str, Callable] = {}

class CheckRegistryError(Exception):
    pass

def register_policy_check(name: str):
    def deco(fn: Callable):
        if name in POLICY_CHECKS:
            raise CheckRegistryError(f"Duplicate POLICY check: {name}")
        POLICY_CHECKS[name] = fn
        return fn
    return deco

def register_risk_check(name: str):
    def deco(fn: Callable):
        if name in RISK_CHECKS:
            raise CheckRegistryError(f"Duplicate RISK check: {name}")
        RISK_CHECKS[name] = fn
        return fn
    return deco

def register_alignment_check(name: str):
    def deco(fn: Callable):
        if name in ALIGNMENT_CHECKS:
            raise CheckRegistryError(f"Duplicate ALIGNMENT check: {name}")
        ALIGNMENT_CHECKS[name] = fn
        return fn
    return deco
def run_layer_checks(layer_key: str, ctx: dict) -> dict:
    """
    Executes checks registered in POLICY_CHECKS / RISK_CHECKS / ALIGNMENT_CHECKS.

    Input:
      layer_key: e.g. "L01"
      ctx: a dict containing request context (route, agent, input, etc.)

    Output:
      {
        "ok": bool,
        "layer": layer_key,
        "results": [
          {"name": "...", "ok": bool, "detail": "...", "domain": "policy|risk|alignment"}
        ]
      }
    """
    results = []

    def _run(domain: str, registry: Dict[str, Callable]):
        for name, fn in registry.items():
            try:
                r = fn(ctx)  # check functions accept ctx: dict
                if not isinstance(r, dict):
                    r = {"ok": bool(r), "detail": "non-dict result coerced"}
                ok = bool(r.get("ok", False))
                detail = r.get("detail")
                results.append({"name": name, "ok": ok, "detail": detail, "domain": domain})
            except Exception as e:
                results.append({"name": name, "ok": False, "detail": f"exception: {e}", "domain": domain})

    _run("policy", POLICY_CHECKS)
    _run("risk", RISK_CHECKS)
    _run("alignment", ALIGNMENT_CHECKS)

    ok = all(r["ok"] for r in results) if results else True
    return {"ok": ok, "layer": layer_key, "results": results}
