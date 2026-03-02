from __future__ import annotations
from pathlib import Path

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from .manifest_loader import load_compliance_manifest
from .gate_g import detect_downgrade
def _as_path(p) -> Path:
    """
    Normalize inputs (str|Path) into Path.
    This prevents TypeError when code does: repo_root / "..."
    """
    if isinstance(p, Path):
        return p
    return Path(str(p)).expanduser().resolve()


def _is_str(x: Any) -> bool:
    return isinstance(x, str) and x.strip() != ""


def _biz_key_from_any(v: Any) -> Optional[str]:
    """
    Normalize owningBusinessId references into an entity-key:
      - "business:shf_nonprofit" -> "business:shf_nonprofit"
      - "shf_nonprofit" -> "business:shf_nonprofit"
    """
    if not _is_str(v):
        return None
    s = str(v).strip()
    if s.startswith("business:"):
        return s
    return f"business:{s}"


def _biz_keys_for_business_obj(b: Dict[str, Any]) -> List[str]:
    """
    Return all possible keys that can refer to this business:
      - entityKey (preferred)
      - business:<businessId> (fallback)
    """
    keys: List[str] = []
    ek = b.get("entityKey")
    if _is_str(ek):
        keys.append(str(ek).strip())

    bid = b.get("businessId") or b.get("id") or b.get("name")
    bk = _biz_key_from_any(bid)
    if bk:
        keys.append(bk)

    # de-dupe while preserving order
    seen = set()
    out: List[str] = []
    for k in keys:
        if k not in seen:
            out.append(k)
            seen.add(k)
    return out


def _app_id_from_obj(a: Dict[str, Any]) -> Optional[str]:
    v = a.get("appId") or a.get("id") or a.get("name")
    return str(v).strip() if _is_str(v) else None


def _agent_id_from_obj(ag: Dict[str, Any]) -> Optional[str]:
    v = ag.get("agentId") or ag.get("id") or ag.get("name")
    return str(v).strip() if _is_str(v) else None


def _policy(cm, policy_id: str) -> Dict[str, Any]:
    if policy_id not in cm.policy_by_id:
        raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] Unknown policyId ref: {policy_id}")
    return cm.policy_by_id[policy_id]


@dataclass(frozen=True)
class PolicyResolver:
    """
    Contract:
      Effective policy inheritance is enforced as:
        Global → Business → App → Agent
      Where "downgrade" means: child loosens/expands risk/permissions vs parent.
    """

    repo_root: Any
    businesses: List[Dict[str, Any]]
    apps: List[Dict[str, Any]]
    agents: Optional[List[Dict[str, Any]]] = None

    _cm: Any = field(init=False, repr=False)
    _biz_by_key: Dict[str, Dict[str, Any]] = field(init=False, repr=False)
    _app_by_id: Dict[str, Dict[str, Any]] = field(init=False, repr=False)
    _agent_by_id: Dict[str, Dict[str, Any]] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        from pathlib import Path
        if not isinstance(self.repo_root, Path):
            self.repo_root = Path(self.repo_root)
        cm = load_compliance_manifest(_as_path(self.repo_root))
        object.__setattr__(self, "_cm", cm)

        # Build business map keyed by ALL possible business keys
        biz_map: Dict[str, Dict[str, Any]] = {}
        for b in self.businesses:
            if not isinstance(b, dict):
                continue
            for k in _biz_keys_for_business_obj(b):
                biz_map[k] = b
        object.__setattr__(self, "_biz_by_key", biz_map)

        # Apps keyed by appId
        app_map: Dict[str, Dict[str, Any]] = {}
        for a in self.apps:
            if not isinstance(a, dict):
                continue
            aid = _app_id_from_obj(a)
            if aid:
                app_map[aid] = a
        object.__setattr__(self, "_app_by_id", app_map)

        # Agents keyed by agentId
        agent_map: Dict[str, Dict[str, Any]] = {}
        for ag in (self.agents or []):
            if not isinstance(ag, dict):
                continue
            gid = _agent_id_from_obj(ag)
            if gid:
                agent_map[gid] = ag
        object.__setattr__(self, "_agent_by_id", agent_map)

    # ---------- Key helpers ----------

    def business_key_of(self, b: Dict[str, Any]) -> str:
        keys = _biz_keys_for_business_obj(b)
        if not keys:
            raise RuntimeError("[COMPLIANCE_BOOT_FAIL] business missing entityKey/businessId")
        # Prefer entityKey if present; else business:<id>
        return keys[0]

    def normalize_business_ref(self, owning_business_id: Any) -> str:
        k = _biz_key_from_any(owning_business_id)
        if not k:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] invalid owningBusinessId: {owning_business_id!r}")
        return k

    # ---------- Resolution ----------

    def resolve_effective_policy_for_business(self, business_key: str) -> Dict[str, Any]:
        if business_key not in self._biz_by_key:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] unknown business key: {business_key}")

        b = self._biz_by_key[business_key]
        b_pol_id = b.get("complianceProfileRef")
        if not _is_str(b_pol_id):
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] business {business_key} missing complianceProfileRef")

        G = self._cm.global_policy
        B = _policy(self._cm, str(b_pol_id).strip())

        errs = detect_downgrade(G, B, "Global→Business")
        if errs:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] GateG downgrade for business {business_key}: " + "; ".join(errs))
        return B

    def resolve_effective_policy_for_app(self, app_id: str) -> Dict[str, Any]:
        if app_id not in self._app_by_id:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] unknown appId: {app_id}")

        a = self._app_by_id[app_id]
        owning = a.get("owningBusinessId")
        biz_key = self.normalize_business_ref(owning)
        if biz_key not in self._biz_by_key:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] app {app_id} references unknown owningBusinessId: {owning}")

        b = self._biz_by_key[biz_key]
        b_pol_id = b.get("complianceProfileRef")
        a_pol_id = a.get("complianceProfileRef")
        if not _is_str(b_pol_id):
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] business {biz_key} missing complianceProfileRef")
        if not _is_str(a_pol_id):
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] app {app_id} missing complianceProfileRef")

        G = self._cm.global_policy
        B = _policy(self._cm, str(b_pol_id).strip())
        A = _policy(self._cm, str(a_pol_id).strip())

        errs: List[str] = []
        errs += detect_downgrade(G, B, "Global→Business")
        errs += detect_downgrade(G, A, "Global→App")
        errs += detect_downgrade(B, A, "Business→App")
        if errs:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] GateG downgrade for app {app_id}: " + "; ".join(errs))
        return A

    def resolve_effective_policy_for_agent(self, agent_id: str) -> Dict[str, Any]:
        if agent_id not in self._agent_by_id:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] unknown agentId: {agent_id}")

        ag = self._agent_by_id[agent_id]
        owning_app = ag.get("owningAppId")
        if not _is_str(owning_app):
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] agent {agent_id} missing owningAppId")

        app_id = str(owning_app).strip()
        if app_id not in self._app_by_id:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] agent {agent_id} owningAppId '{app_id}' not found as an app")

        a = self._app_by_id[app_id]
        owning = a.get("owningBusinessId")
        biz_key = self.normalize_business_ref(owning)
        if biz_key not in self._biz_by_key:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] agent {agent_id} app '{app_id}' references unknown business '{owning}'")

        b = self._biz_by_key[biz_key]

        b_pol_id = b.get("complianceProfileRef")
        a_pol_id = a.get("complianceProfileRef")
        ag_pol_id = ag.get("complianceProfileRef")
        if not _is_str(b_pol_id):
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] business {biz_key} missing complianceProfileRef")
        if not _is_str(a_pol_id):
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] app {app_id} missing complianceProfileRef")
        if not _is_str(ag_pol_id):
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] agent {agent_id} missing complianceProfileRef")

        G = self._cm.global_policy
        B = _policy(self._cm, str(b_pol_id).strip())
        A = _policy(self._cm, str(a_pol_id).strip())
        AG = _policy(self._cm, str(ag_pol_id).strip())

        errs: List[str] = []
        errs += detect_downgrade(G, B, "Global→Business")
        errs += detect_downgrade(G, A, "Global→App")
        errs += detect_downgrade(B, A, "Business→App")
        errs += detect_downgrade(G, AG, "Global→Agent")
        errs += detect_downgrade(B, AG, "Business→Agent")
        errs += detect_downgrade(A, AG, "App→Agent")
        if errs:
            raise RuntimeError(f"[COMPLIANCE_BOOT_FAIL] GateG downgrade for agent {agent_id}: " + "; ".join(errs))
        return AG


# ---------------------------------------------------------------------------
# Drop-in debug / explain method (shape-tolerant)
# Adds: PolicyResolver.explain(...)
#
# Usage:
#   resolver.explain(app_id="admin")
#   resolver.explain(agent_id="Layer23OrchestratorAgent")
# ---------------------------------------------------------------------------

def _pr__to_plain(obj):
    """Best-effort conversion to JSON-serializable plain dict/list/scalars."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: _pr__to_plain(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_pr__to_plain(x) for x in obj]
    # dataclass-ish / object
    d = getattr(obj, "__dict__", None)
    if isinstance(d, dict):
        return {k: _pr__to_plain(v) for k, v in d.items()}
    # fallback string
    return repr(obj)

def _pr__get_attr_first(self, names, default=None):
    for n in names:
        if hasattr(self, n):
            return getattr(self, n)
    return default

def _pr__normalize_business_key(biz_ref):
    # Accept "business:xxx" OR raw "xxx"
    if not isinstance(biz_ref, str) or not biz_ref.strip():
        return biz_ref
    if biz_ref.startswith("business:"):
        return biz_ref
    return f"business:{biz_ref}"

def _policyresolver_explain(self, *, app_id: str | None = None, agent_id: str | None = None) -> dict:
    """
    Explain the policy chain + effective policy resolution for an app or agent.

    Returns a JSON-serializable dict:
      - target
      - owning (business/app)
      - policyRefs (global/business/app/agent)
      - effectivePolicy (best-effort)
      - notes (shape warnings)
    """
    notes = []

    # Try to access internal maps using multiple possible attribute names
    app_by_id = _pr__get_attr_first(self, ["_app_by_id", "app_by_id", "apps_by_id", "_apps_by_id"], default={}) or {}
    biz_by_key = _pr__get_attr_first(self, ["_biz_by_key", "biz_by_key", "business_by_key", "_business_by_key"], default={}) or {}
    agent_by_id = _pr__get_attr_first(self, ["_agent_by_id", "agent_by_id", "agents_by_id", "_agents_by_id"], default={}) or {}

    cm = _pr__get_attr_first(self, ["cm", "_cm", "manifest", "_manifest"], default=None)

    # Global policy id (best-effort)
    global_policy_ref = None
    if cm is not None:
        gp = getattr(cm, "global_policy", None)
        if isinstance(gp, dict):
            global_policy_ref = gp.get("policyId") or gp.get("id")
        else:
            # could be dataclass/object
            global_policy_ref = getattr(gp, "policyId", None) or getattr(gp, "id", None)

    target = {"type": None, "id": None}
    owning = {"appId": None, "owningBusinessId": None, "owningBusinessKey": None}
    policy_refs = {"global": global_policy_ref, "business": None, "app": None, "agent": None}
    effective = None

    # Helper to read complianceProfileRef field safely
    def _get_policy_ref(ent):
        if not isinstance(ent, dict):
            return None
        return ent.get("complianceProfileRef") or ent.get("policyId") or ent.get("policyRef")

    # Resolve APP
    if app_id:
        target = {"type": "app", "id": app_id}

        app_ent = app_by_id.get(app_id)
        if not app_ent:
            notes.append(f"app '{app_id}' not found in resolver map (app_by_id keys: {len(app_by_id)})")
        else:
            owning_business_id = app_ent.get("owningBusinessId") or app_ent.get("businessId") or app_ent.get("owningBusiness")
            owning["appId"] = app_id
            owning["owningBusinessId"] = owning_business_id
            owning["owningBusinessKey"] = _pr__normalize_business_key(owning_business_id)

            policy_refs["app"] = _get_policy_ref(app_ent)

            biz_ent = biz_by_key.get(owning["owningBusinessKey"]) or biz_by_key.get(owning_business_id)
            if not biz_ent:
                notes.append(f"business '{owning['owningBusinessKey']}' not found in resolver map (biz_by_key keys: {len(biz_by_key)})")
            else:
                policy_refs["business"] = _get_policy_ref(biz_ent)

        # Effective policy (best-effort)
        if hasattr(self, "resolve_effective_policy_for_app"):
            try:
                effective = self.resolve_effective_policy_for_app(app_id)
            except Exception as e:
                notes.append(f"resolve_effective_policy_for_app failed: {e!r}")
        else:
            notes.append("resolver missing method resolve_effective_policy_for_app")

    # Resolve AGENT
    if agent_id:
        target = {"type": "agent", "id": agent_id}

        ag_ent = agent_by_id.get(agent_id)
        if not ag_ent:
            notes.append(f"agent '{agent_id}' not found in resolver map (agent_by_id keys: {len(agent_by_id)})")
        else:
            owning_app = ag_ent.get("owningAppId") or ag_ent.get("appId") or ag_ent.get("owningApp")
            owning["appId"] = owning_app
            policy_refs["agent"] = _get_policy_ref(ag_ent)

            # pull app -> business chain too
            if owning_app and owning_app in app_by_id:
                app_ent = app_by_id[owning_app]
                owning_business_id = app_ent.get("owningBusinessId") or app_ent.get("businessId") or app_ent.get("owningBusiness")
                owning["owningBusinessId"] = owning_business_id
                owning["owningBusinessKey"] = _pr__normalize_business_key(owning_business_id)
                policy_refs["app"] = _get_policy_ref(app_ent)

                biz_ent = biz_by_key.get(owning["owningBusinessKey"]) or biz_by_key.get(owning_business_id)
                if biz_ent:
                    policy_refs["business"] = _get_policy_ref(biz_ent)
                else:
                    notes.append(f"business for agent chain not found: {owning['owningBusinessKey']}")
            else:
                notes.append(f"owning app for agent not found in app map: {owning_app!r}")

        # Effective policy (best-effort)
        if hasattr(self, "resolve_effective_policy_for_agent"):
            try:
                effective = self.resolve_effective_policy_for_agent(agent_id)
            except Exception as e:
                notes.append(f"resolve_effective_policy_for_agent failed: {e!r}")
        else:
            notes.append("resolver missing method resolve_effective_policy_for_agent")

    if not app_id and not agent_id:
        notes.append("call explain(app_id=...) or explain(agent_id=...)")

    return {
        "target": target,
        "owning": owning,
        "policyRefs": policy_refs,
        "effectivePolicy": _pr__to_plain(effective),
        "notes": notes,
    }

# Attach method to class (safe + idempotent)
try:
    PolicyResolver  # type: ignore[name-defined]
except NameError:
    # If file order changes, this still avoids crashing import.
    pass
else:
    if not hasattr(PolicyResolver, "explain"):
        PolicyResolver.explain = _policyresolver_explain  # type: ignore[attr-defined]

    def explain(self, *, kind: str, entity_id: str) -> dict:
        """
        Drop-in explain method:
          kind: "business" | "app" | "agent"
          entity_id: id (business key/id, appId, agentId)
        Returns a dict with:
          chain: [{level, policyId}]
          effective: policyId
          diffs: list[str] describing relax/tighten deltas vs parents
        """
        kind = (kind or "").strip().lower()
        if kind not in {"business", "app", "agent"}:
            raise ValueError("kind must be one of: business|app|agent")

        # Resolve effective policy by calling existing resolver methods
        if kind == "business":
            out = self.resolve_effective_policy_for_business(entity_id)
        elif kind == "app":
            out = self.resolve_effective_policy_for_app(entity_id)
        else:
            out = self.resolve_effective_policy_for_agent(entity_id)

        # out is expected to be a dict-like payload from your PolicyResolver implementation.
        # We normalize a friendly explain shape.
        chain = out.get("chain") if isinstance(out, dict) else None
        effective = out.get("effectivePolicyId") if isinstance(out, dict) else None
        diffs = out.get("diffs") if isinstance(out, dict) else None

        return {
            "kind": kind,
            "entity_id": entity_id,
            "chain": chain,
            "effectivePolicyId": effective,
            "diffs": diffs,
        }
    def explain(
        self,
        entity_type: str | None = None,
        entity_id: str | None = None,
        *,
        kind: str | None = None,
        id: str | None = None,
    ) -> dict:
        """
        Explain effective policy resolution for an entity.

        Accepts:
          - explain("app", "admin")
          - explain(entity_type="app", entity_id="admin")
          - explain(kind="app", entity_id="admin")
          - explain(kind="agent", id="Layer09CaseSupportAgent")

        Returns a dict describing:
          - chain (Global -> Business -> App -> Agent)
          - policy ids used at each level
          - effective policy id for the entity
          - any downgrade violations found (should be empty on PASS)
        """
        # Normalize args
        if entity_type is None and kind is not None:
            entity_type = kind
        if entity_id is None and id is not None:
            entity_id = id

        if not entity_type or not entity_id:
            raise TypeError("explain() requires (entity_type, entity_id) or (kind, entity_id/id).")

        et = str(entity_type).strip().lower()
        eid = str(entity_id).strip()

        # These helpers/members are expected in your PolicyResolver contract:
        # - self.global_policy_id
        # - self._cm (ComplianceManifest)
        # - self._biz_by_key, self._app_by_id, self._agent_by_id (shape-tolerant maps)
        # - self.resolve_effective_policy_for_business / _for_app / _for_agent
        # - detect_downgrade()

        cm = getattr(self, "_cm", None)
        if cm is None:
            raise RuntimeError("[COMPLIANCE_BOOT_FAIL] PolicyResolver missing _cm (ComplianceManifest).")

        out: dict = {
            "entity": {"type": et, "id": eid},
            "chain": {},
            "effectivePolicyId": None,
            "violations": [],
        }

        # Global
        G = cm.global_policy
        out["chain"]["global"] = {"policyId": getattr(G, "policy_id", None) or "global"}

        if et == "business":
            # Resolve business effective policy
            eff = self.resolve_effective_policy_for_business(eid)
            out["effectivePolicyId"] = eff.get("effectivePolicyId")
            out["chain"]["business"] = eff.get("chain", {}).get("business") or eff.get("business") or {}

            # Violations (Global -> Business)
            B = cm.policy_by_id[out["effectivePolicyId"]]
            from fabric.compliance.gate_g import detect_downgrade
            out["violations"] = detect_downgrade(G, B, "Global→Business")
            return out

        if et == "app":
            eff = self.resolve_effective_policy_for_app(eid)
            out["effectivePolicyId"] = eff.get("effectivePolicyId")
            out["chain"].update(eff.get("chain", {}))

            # Violations (Global -> Business -> App)
            from fabric.compliance.gate_g import detect_downgrade
            biz_pid = out["chain"].get("business", {}).get("policyId")
            app_pid = out["chain"].get("app", {}).get("policyId") or out["effectivePolicyId"]

            viol = []
            if biz_pid:
                viol += detect_downgrade(G, cm.policy_by_id[biz_pid], "Global→Business")
            if app_pid:
                viol += detect_downgrade(G, cm.policy_by_id[app_pid], "Global→App")
                if biz_pid:
                    viol += detect_downgrade(cm.policy_by_id[biz_pid], cm.policy_by_id[app_pid], "Business→App")
            out["violations"] = viol
            return out

        if et == "agent":
            eff = self.resolve_effective_policy_for_agent(eid)
            out["effectivePolicyId"] = eff.get("effectivePolicyId")
            out["chain"].update(eff.get("chain", {}))

            # Violations (Global -> Business -> App -> Agent)
            from fabric.compliance.gate_g import detect_downgrade
            biz_pid = out["chain"].get("business", {}).get("policyId")
            app_pid = out["chain"].get("app", {}).get("policyId")
            ag_pid  = out["chain"].get("agent", {}).get("policyId") or out["effectivePolicyId"]

            viol = []
            if biz_pid:
                viol += detect_downgrade(G, cm.policy_by_id[biz_pid], "Global→Business")
            if app_pid:
                viol += detect_downgrade(G, cm.policy_by_id[app_pid], "Global→App")
                if biz_pid:
                    viol += detect_downgrade(cm.policy_by_id[biz_pid], cm.policy_by_id[app_pid], "Business→App")
            if ag_pid:
                viol += detect_downgrade(G, cm.policy_by_id[ag_pid], "Global→Agent")
                if biz_pid:
                    viol += detect_downgrade(cm.policy_by_id[biz_pid], cm.policy_by_id[ag_pid], "Business→Agent")
                if app_pid:
                    viol += detect_downgrade(cm.policy_by_id[app_pid], cm.policy_by_id[ag_pid], "App→Agent")
            out["violations"] = viol
            return out

        raise ValueError("explain(): entity_type must be one of: business | app | agent")

# --- PolicyResolver explain() (injected) ---

    def explain(self, kind=None, entity_id=None, *args, **kwargs):
        """Explain the policy chain + effective policy resolution.

        Accepts BOTH:
          - explain(kind='app', entity_id='admin')
          - explain('app', 'admin')

        kind: 'global' | 'business' | 'app' | 'agent'
        entity_id: business key/id OR appId OR agentId
        """
        # Support positional fallbacks
        if kind is None and len(args) >= 1:
            kind = args[0]
        if entity_id is None and len(args) >= 2:
            entity_id = args[1]

        # Support keyword aliases (just in case)
        if kind is None:
            kind = kwargs.get('k') or kwargs.get('type')
        if entity_id is None:
            entity_id = kwargs.get('id') or kwargs.get('entity')

        if not isinstance(kind, str) or not kind.strip():
            raise TypeError("explain() requires kind='global|business|app|agent'")
        kind = kind.strip().lower()

        # Build a response that is safe even if internal fields differ
        out = {
            'kind': kind,
            'entity_id': entity_id,
            'chain': {},
        }

        # Global
        cm = getattr(self, '_cm', None) or getattr(self, 'cm', None)
        global_policy = None
        if cm is not None:
            global_policy = getattr(cm, 'global_policy', None)
        if global_policy is None:
            global_policy = getattr(self, 'global_policy', None)
        out['chain']['global'] = getattr(global_policy, 'policyId', None) or getattr(global_policy, 'id', None) or 'global'

        # Resolve effective policy via existing resolver methods
        if kind == 'global':
            out['effective'] = getattr(global_policy, 'policy', None) or getattr(global_policy, '__dict__', None) or global_policy
            return out

        if entity_id is None:
            raise TypeError("explain() requires entity_id for kind != 'global'")

        if kind == 'business':
            fn = getattr(self, 'resolve_effective_policy_for_business', None)
            if not callable(fn):
                raise AttributeError("PolicyResolver missing resolve_effective_policy_for_business()")
            eff = fn(entity_id)
            out['effective'] = eff
            # best-effort chain hints
            out['chain']['business'] = entity_id
            return out

        if kind == 'app':
            fn = getattr(self, 'resolve_effective_policy_for_app', None)
            if not callable(fn):
                raise AttributeError("PolicyResolver missing resolve_effective_policy_for_app()")
            eff = fn(entity_id)
            out['effective'] = eff
            out['chain']['app'] = entity_id
            # Try to include owning business if present
            app_map = getattr(self, '_app_by_id', None) or getattr(self, 'app_by_id', None)
            if isinstance(app_map, dict) and entity_id in app_map:
                out['chain']['business'] = app_map[entity_id].get('owningBusinessId')
            return out

        if kind == 'agent':
            fn = getattr(self, 'resolve_effective_policy_for_agent', None)
            if not callable(fn):
                raise AttributeError("PolicyResolver missing resolve_effective_policy_for_agent()")
            eff = fn(entity_id)
            out['effective'] = eff
            out['chain']['agent'] = entity_id
            # Try to include owning app/business if present
            ag_map = getattr(self, '_agent_by_id', None) or getattr(self, 'agent_by_id', None)
            if isinstance(ag_map, dict) and entity_id in ag_map:
                out['chain']['app'] = ag_map[entity_id].get('owningAppId')
            app_map = getattr(self, '_app_by_id', None) or getattr(self, 'app_by_id', None)
            if isinstance(ag_map, dict) and isinstance(app_map, dict):
                aid = out['chain'].get('app')
                if aid in app_map:
                    out['chain']['business'] = app_map[aid].get('owningBusinessId')
            return out

        raise ValueError(f"Unknown kind: {kind} (expected global|business|app|agent)")



# __EXPLAIN_KW_SAFE_V1__
def _policyresolver_explain_kw_safe(self, kind=None, entity_id=None, *args, **kwargs):
    """Keyword-safe explain() wrapper.

    Accepts BOTH:
      - explain(kind="app", entity_id="admin")
      - explain("app", "admin")

    This wrapper is appended at EOF so it overrides older bindings.
    """
    # Positional fallback
    if kind is None and args:
        kind = args[0]
    if entity_id is None and len(args) >= 2:
        entity_id = args[1]

    # Keyword override
    if "kind" in kwargs:
        kind = kwargs["kind"]
    if "entity_id" in kwargs:
        entity_id = kwargs["entity_id"]

    if kind is None or entity_id is None:
        raise TypeError("explain() requires kind and entity_id")

    # Preferred: class provides a real implementation (if you have one)
    impl = getattr(self, "_explain_impl", None)
    if callable(impl):
        return impl(kind, entity_id)

    # Fallback: older helper function name(s)
    for name in ("_policyresolver_explain_impl", "_policyresolver_explain"):
        fn = globals().get(name)
        if callable(fn) and fn is not _policyresolver_explain_kw_safe:
            return fn(self, kind, entity_id)

    raise RuntimeError("No explain implementation found on PolicyResolver")

try:
    PolicyResolver.explain = _policyresolver_explain_kw_safe  # type: ignore[name-defined]
except Exception:
    pass



# === SHF FINAL EXPLAIN REBIND (AUTOGENERATED) ===
# This block intentionally APPENDS a fresh explain() and hard-rebinds PolicyResolver.explain
# to avoid conflicts with earlier experimental monkeypatches.

def _shf_find_in_list(items, *, key, alt_keys=()):
    for it in items or []:
        if not isinstance(it, dict):
            continue
        if it.get(key) is not None:
            yield it
        else:
            for ak in alt_keys:
                if it.get(ak) is not None:
                    yield it
                    break

def _shf_get_id(d: dict, *keys: str):
    for k in keys:
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v
    return None

def _shf_policyresolver_explain_final(self, kind=None, entity_id=None, *args, **kwargs):
    """
    Keyword-safe, positional-safe explain().

    Usage:
      explain("app","admin")
      explain(kind="app", entity_id="admin")
      explain("agent","Layer09CaseSupportAgent")
      explain("business","business:shf_nonprofit")

    Returns a dict with:
      - resolved chain (global -> business -> app -> agent)
      - policy ids used at each level
      - a best-effort 'effective' snapshot (not a deep merge if merge helper isn't present)
    """
    # Accept either kwargs or positional
    if kind is None and args:
        kind = args[0]
    if entity_id is None and len(args) >= 2:
        entity_id = args[1]

    # Also tolerate alternate kw names
    kind = kind if kind is not None else kwargs.get("level") or kwargs.get("scope")
    entity_id = entity_id if entity_id is not None else kwargs.get("id") or kwargs.get("entity")

    if not isinstance(kind, str) or not kind.strip():
        raise TypeError("explain() requires kind (business|app|agent)")
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise TypeError("explain() requires entity_id (string)")

    kind = kind.strip().lower()
    entity_id = entity_id.strip()

    # Compliance manifest (fresh load to avoid depending on internal fields)
    try:
        from fabric.compliance.manifest_loader import load_compliance_manifest
        cm = load_compliance_manifest(self.repo_root)
    except Exception as e:
        return {"ok": False, "error": f"manifest_load_failed: {e!r}", "kind": kind, "entity_id": entity_id}

    # Registry lists (tolerate different shapes/keys)
    businesses = getattr(self, "businesses", None) or []
    apps = getattr(self, "apps", None) or []
    agents = getattr(self, "agents", None) or []

    # Helpers for policy lookup
    def pol(pid: str):
        try:
            return cm.policy_by_id[pid]
        except Exception:
            return None

    # Global
    G = getattr(cm, "global_policy", None)
    G_id = None
    if isinstance(G, dict):
        G_id = _shf_get_id(G, "policyId", "id", "name")
    if G_id is None:
        # sometimes cm may store separately
        G_id = getattr(cm, "global_policy_id", None)

    # Resolve chain depending on kind
    B_rec = None
    A_rec = None
    AG_rec = None

    if kind == "business":
        # allow entityKey OR raw businessId
        for b in businesses:
            if not isinstance(b, dict):
                continue
            b_key = _shf_get_id(b, "entityKey", "businessKey", "key")
            b_id  = _shf_get_id(b, "businessId", "id", "slug")
            if entity_id == b_key or entity_id == b_id or entity_id == f"business:{b_id}":
                B_rec = b
                break

    elif kind == "app":
        for a in apps:
            if not isinstance(a, dict):
                continue
            a_id = _shf_get_id(a, "appId", "id", "slug", "name")
            if entity_id == a_id:
                A_rec = a
                break
        if A_rec:
            owning = _shf_get_id(A_rec, "owningBusinessId", "owningBusinessKey", "business")
            # find business by entityKey or businessId
            for b in businesses:
                if not isinstance(b, dict):
                    continue
                b_key = _shf_get_id(b, "entityKey", "businessKey", "key")
                b_id  = _shf_get_id(b, "businessId", "id", "slug")
                if owning == b_key or owning == b_id or (isinstance(owning,str) and owning.startswith("business:") and owning == f"business:{b_id}"):
                    B_rec = b
                    break

    elif kind == "agent":
        for ag in agents:
            if not isinstance(ag, dict):
                continue
            ag_id = _shf_get_id(ag, "agentId", "id", "name")
            if entity_id == ag_id:
                AG_rec = ag
                break
        if AG_rec:
            owning_app = _shf_get_id(AG_rec, "owningAppId", "owningApp", "appId")
            for a in apps:
                if not isinstance(a, dict):
                    continue
                a_id = _shf_get_id(a, "appId", "id", "slug", "name")
                if owning_app == a_id:
                    A_rec = a
                    break
        if A_rec:
            owning = _shf_get_id(A_rec, "owningBusinessId", "owningBusinessKey", "business")
            for b in businesses:
                if not isinstance(b, dict):
                    continue
                b_key = _shf_get_id(b, "entityKey", "businessKey", "key")
                b_id  = _shf_get_id(b, "businessId", "id", "slug")
                if owning == b_key or owning == b_id or (isinstance(owning,str) and owning.startswith("business:") and owning == f"business:{b_id}"):
                    B_rec = b
                    break
    else:
        raise ValueError("kind must be one of: business, app, agent")

    # Policy IDs
    B_pid = _shf_get_id(B_rec or {}, "complianceProfileRef", "policyId", "policyRef")
    A_pid = _shf_get_id(A_rec or {}, "complianceProfileRef", "policyId", "policyRef")
    AG_pid = _shf_get_id(AG_rec or {}, "complianceProfileRef", "policyId", "policyRef")

    # Best-effort policy objects
    out = {
        "ok": True,
        "kind": kind,
        "entity_id": entity_id,
        "chain": {
            "global": {"policyId": G_id, "policy": pol(G_id) if G_id else G},
            "business": {"entity": B_rec, "policyId": B_pid, "policy": pol(B_pid) if B_pid else None},
            "app": {"entity": A_rec, "policyId": A_pid, "policy": pol(A_pid) if A_pid else None},
            "agent": {"entity": AG_rec, "policyId": AG_pid, "policy": pol(AG_pid) if AG_pid else None},
        },
        "notes": [],
    }

    # If a merge helper exists on the resolver, use it; otherwise just report the chain.
    merge_fn = getattr(self, "_merge_policies", None) or getattr(self, "merge_policies", None)
    if callable(merge_fn):
        try:
            base = pol(G_id) if G_id else G
            eff = base
            for pid in (B_pid, A_pid, AG_pid):
                if pid:
                    eff = merge_fn(eff, pol(pid))
            out["effectivePolicy"] = eff
        except Exception as e:
            out["notes"].append(f"effective_merge_failed: {e!r}")

    return out

# Hard rebind (overwrites any previous explain monkeypatches)
try:
    PolicyResolver.explain = _shf_policyresolver_explain_final  # type: ignore[name-defined]
except Exception:
    pass


# --- SHF explain() final keyword-safe hard rebind ---
### SHF_FINAL_EXPLAIN_REBIND_V1 ###

def _shf_policyresolver_explain_impl(self, kind, entity_id):
    """
    Returns a dict explanation of the effective policy chain and downgrade checks.

    kind: "global" | "business" | "app" | "agent"
    entity_id: identifier for the selected kind
    """
    kind = (kind or "").strip().lower()
    entity_id = (entity_id or "").strip()

    out = {
        "kind": kind,
        "entity_id": entity_id,
        "repo_root": str(getattr(self, "repo_root", "")),
        "notes": [],
        "resolved": {},
    }

    # Most PolicyResolver versions already store:
    # - self.cm (ComplianceManifest)
    # - maps for business/app/agent
    cm = getattr(self, "cm", None)
    if cm is None:
        out["notes"].append("ComplianceManifest not attached on resolver; cannot explain fully.")
        return out

    # Helper to safely fetch a policy by id
    def _p(pid):
        return cm.policy_by_id.get(pid) if hasattr(cm, "policy_by_id") else None

    # Global
    G = getattr(cm, "global_policy", None)
    if G is None:
        out["notes"].append("global_policy missing from manifest")
    else:
        out["resolved"]["globalPolicyId"] = getattr(G, "policyId", None) or getattr(G, "id", None)

    # Use resolver methods if they exist (preferred)
    if kind == "global":
        out["resolved"]["effectivePolicyId"] = out["resolved"].get("globalPolicyId")
        return out

    if kind == "business":
        fn = getattr(self, "resolve_effective_policy_for_business", None)
        if callable(fn):
            eff = fn(entity_id)
            out["resolved"]["effectivePolicyId"] = getattr(eff, "policyId", None) or getattr(eff, "id", None)
            return out
        out["notes"].append("resolve_effective_policy_for_business() not found")
        return out

    if kind == "app":
        fn = getattr(self, "resolve_effective_policy_for_app", None)
        if callable(fn):
            eff = fn(entity_id)
            out["resolved"]["effectivePolicyId"] = getattr(eff, "policyId", None) or getattr(eff, "id", None)
            return out
        out["notes"].append("resolve_effective_policy_for_app() not found")
        return out

    if kind == "agent":
        fn = getattr(self, "resolve_effective_policy_for_agent", None)
        if callable(fn):
            eff = fn(entity_id)
            out["resolved"]["effectivePolicyId"] = getattr(eff, "policyId", None) or getattr(eff, "id", None)
            return out
        out["notes"].append("resolve_effective_policy_for_agent() not found")
        return out

    out["notes"].append(f"Unknown kind: {kind}")
    return out


def _shf_policyresolver_explain(self, *args, **kwargs):
    """
    Keyword + positional safe wrapper.

    Accepts:
      explain(kind="app", entity_id="admin")
      explain("app", "admin")
    """
    if kwargs:
        kind = kwargs.get("kind", None)
        entity_id = kwargs.get("entity_id", None)
    else:
        kind = args[0] if len(args) > 0 else None
        entity_id = args[1] if len(args) > 1 else None

    return _shf_policyresolver_explain_impl(self, kind, entity_id)


# Hard rebind: the class exists in this module; override its explain every time.
try:
    PolicyResolver.explain = _shf_policyresolver_explain  # type: ignore[name-defined]
except Exception:
    pass

