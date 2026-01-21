from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _str(x: Any) -> Optional[str]:
    if x is None:
        return None
    if isinstance(x, str) and x.strip():
        return x.strip()
    try:
        s = str(x).strip()
        return s if s else None
    except Exception:
        return None


def _bool(x: Any) -> Optional[bool]:
    if x is None:
        return None
    if isinstance(x, bool):
        return x
    if isinstance(x, (int, float)):
        return bool(x)
    if isinstance(x, str):
        v = x.strip().lower()
        if v in ("true", "1", "yes", "y"):
            return True
        if v in ("false", "0", "no", "n"):
            return False
    return None


def _num(x: Any) -> Optional[float]:
    if x is None:
        return None
    try:
        return float(x)
    except Exception:
        return None


def _get_context(e: Dict[str, Any]) -> Dict[str, Any]:
    ctx = e.get("context")
    if isinstance(ctx, dict):
        return dict(ctx)
    return {}


def normalize_event(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Canonical SHF event schema (event-first architecture).
    Backward compatible: preserves original keys under `_raw` if needed.

    Canonical fields:
      - event_id: str (uuid)
      - ts: str (UTC ISO Z)
      - actor_type: str (student|staff|employer|agency|system|unknown)
      - action: str
      - context: dict { app_id, program_id, plan_id, run_id, step_id, session_id, cohort_id }
      - metrics: dict { duration_ms, cost_usd, effort, ... }
      - flags: dict { manual_override, reward, first_reward, pilot_mode }
      - outcome: str (optional)
      - schema_version: int
    """
    e = dict(raw or {})
    ctx = _get_context(e)

    # --- ids & timestamps ---
    event_id = _str(e.get("event_id")) or _str(e.get("id")) or str(uuid.uuid4())
    ts = _str(e.get("ts")) or _str(e.get("timestamp")) or _utc_iso()

    # --- actor ---
    actor_type = (_str(e.get("actor_type")) or _str(e.get("actor")) or "unknown").lower()
    if actor_type not in ("student", "staff", "employer", "agency", "system", "unknown"):
        actor_type = "unknown"

    # --- action ---
    action = _str(e.get("action")) or _str(e.get("event")) or _str(e.get("type")) or "unknown"

    # --- context normalization ---
    # Accept both top-level and context keys
    def ctx_pick(*keys: str) -> Optional[str]:
        for k in keys:
            v = _str(ctx.get(k))
            if v:
                return v
            v2 = _str(e.get(k))
            if v2:
                return v2
        return None

    context = {
        "app_id": ctx_pick("app_id", "app", "appId"),
        "program_id": ctx_pick("program_id", "program", "programId"),
        "plan_id": ctx_pick("plan_id", "plan", "planId"),
        "run_id": ctx_pick("run_id", "run", "runId"),
        "step_id": ctx_pick("step_id", "step", "stepId"),
        "session_id": ctx_pick("session_id", "session", "sessionId"),
        "cohort_id": ctx_pick("cohort_id", "cohort", "cohortId"),
    }
    # Remove Nones for cleanliness
    context = {k: v for k, v in context.items() if v is not None}

    # --- metrics normalization ---
    # Accept duration_ms, elapsed_ms, ms
    duration_ms = _num(e.get("duration_ms"))
    if duration_ms is None:
        duration_ms = _num(e.get("elapsed_ms"))
    if duration_ms is None:
        duration_ms = _num(e.get("ms"))

    cost_usd = _num(e.get("cost_usd"))
    if cost_usd is None:
        cost_usd = _num(e.get("cost"))

    effort = _num(e.get("effort"))

    metrics = dict(e.get("metrics")) if isinstance(e.get("metrics"), dict) else {}
    if duration_ms is not None:
        metrics.setdefault("duration_ms", duration_ms)
    if cost_usd is not None:
        metrics.setdefault("cost_usd", cost_usd)
    if effort is not None:
        metrics.setdefault("effort", effort)

    # --- flags normalization ---
    manual_override = _bool(e.get("manual_override"))
    if manual_override is None:
        manual_override = _bool(e.get("manual"))

    reward = _bool(e.get("reward"))
    first_reward = _bool(e.get("first_reward"))
    pilot_mode = _bool(e.get("pilot_mode"))

    flags = dict(e.get("flags")) if isinstance(e.get("flags"), dict) else {}
    if manual_override is not None:
        flags.setdefault("manual_override", manual_override)
    if reward is not None:
        flags.setdefault("reward", reward)
    if first_reward is not None:
        flags.setdefault("first_reward", first_reward)
    if pilot_mode is not None:
        flags.setdefault("pilot_mode", pilot_mode)

    # --- outcome ---
    outcome = _str(e.get("outcome"))

    normalized = {
        "schema_version": 1,
        "event_id": event_id,
        "ts": ts,
        "actor_type": actor_type,
        "action": action,
        "context": context,
        "metrics": metrics,
        "flags": flags,
    }
    if outcome:
        normalized["outcome"] = outcome

    # Keep a slim raw copy for forensic debug (optional)
    # Avoid storing huge blobs
    raw_keep = {}
    for k in ("id", "timestamp", "type", "event", "step", "step_id", "ms", "elapsed_ms", "duration_ms", "cost", "cost_usd", "manual", "manual_override"):
        if k in e:
            raw_keep[k] = e.get(k)
    if raw_keep:
        normalized["_raw"] = raw_keep

    return normalized
