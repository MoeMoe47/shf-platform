from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent.parent.parent
DB = BASE / "db"
RUNS_LOG = DB / "runs.jsonl"


def _read_jsonl(path: Path, limit: int = 5000) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
    return rows[-limit:]


def _parse_ts(ts: Any) -> Optional[datetime]:
    """
    Parses ISO timestamps like:
      - 2026-01-10T12:34:56Z
      - 2026-01-10T12:34:56.123Z
      - 2026-01-10T12:34:56+00:00
    Returns aware UTC datetime or None.
    """
    if not isinstance(ts, str) or not ts.strip():
        return None
    s = ts.strip()
    try:
        if s.endswith("Z"):
            s2 = s[:-1] + "+00:00"
            return datetime.fromisoformat(s2).astimezone(timezone.utc)
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def _ctx(e: Dict[str, Any]) -> Dict[str, Any]:
    c = e.get("context")
    return c if isinstance(c, dict) else {}


def _match_filters(e: Dict[str, Any], app_id: Optional[str], run_id: Optional[str], since_dt: Optional[datetime]) -> bool:
    c = _ctx(e)

    if app_id:
        v = c.get("app_id")
        if not isinstance(v, str) or v != app_id:
            return False

    if run_id:
        v = c.get("run_id")
        if not isinstance(v, str) or v != run_id:
            return False

    if since_dt:
        dt = _parse_ts(e.get("ts"))
        if not dt:
            # if we can't parse ts, exclude it in filtered mode
            return False
        if dt < since_dt:
            return False

    return True


def compute_loe_signals(
    limit: int = 5000,
    app_id: Optional[str] = None,
    run_id: Optional[str] = None,
    since: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Canonical-only LOE reader with filtering.
    Uses ONLY normalized schema (schema_version=1):
      - metrics.duration_ms
      - metrics.cost_usd
      - flags.manual_override
      - flags.reward / flags.first_reward
      - context.step_id / context.app_id / context.run_id
      - outcome
    Filters:
      - app_id: match context.app_id
      - run_id: match context.run_id
      - since: ISO timestamp string (UTC recommended), e.g. 2026-01-10T00:00:00Z
    """
    events_all = _read_jsonl(RUNS_LOG, limit=limit)

    since_dt = _parse_ts(since) if since else None

    # Apply filters first (so we don't dilute with unrelated streams)
    filtered_seen = []
    for e in events_all:
        if isinstance(e, dict) and _match_filters(e, app_id, run_id, since_dt):
            filtered_seen.append(e)

    total_seen = len(filtered_seen)

    canonical_events = []
    legacy_count = 0
    for e in filtered_seen:
        if isinstance(e, dict) and e.get("schema_version") == 1:
            canonical_events.append(e)
        else:
            legacy_count += 1

    total = len(canonical_events)

    manual_count = 0
    durations: List[float] = []
    costs: List[float] = []
    step_counts: Dict[str, int] = {}
    first_reward_index = None
    completed_count = 0

    for idx, e in enumerate(canonical_events):
        metrics = e.get("metrics") or {}
        flags = e.get("flags") or {}
        context = e.get("context") or {}

        if flags.get("manual_override") is True:
            manual_count += 1

        d = metrics.get("duration_ms")
        if isinstance(d, (int, float)):
            durations.append(float(d))

        c = metrics.get("cost_usd")
        if isinstance(c, (int, float)):
            costs.append(float(c))

        step = context.get("step_id")
        if isinstance(step, str):
            step_counts[step] = step_counts.get(step, 0) + 1

        if first_reward_index is None and (flags.get("reward") or flags.get("first_reward")):
            first_reward_index = idx

        outcome = e.get("outcome")
        if isinstance(outcome, str) and outcome.lower() in ("complete", "completed", "success", "placed"):
            completed_count += 1

    avg_duration_ms = (sum(durations) / len(durations)) if durations else 0.0
    p95_duration_ms = 0.0
    if durations:
        ds = sorted(durations)
        p95_duration_ms = ds[int(0.95 * (len(ds) - 1))]

    avg_cost = (sum(costs) / len(costs)) if costs else 0.0
    total_cost = sum(costs) if costs else 0.0

    manual_rate = (manual_count / total) if total else 0.0

    top_steps: List[Tuple[str, int]] = sorted(step_counts.items(), key=lambda kv: kv[1], reverse=True)[:5]
    friction_steps = [{"step_id": sid, "event_count": cnt} for sid, cnt in top_steps]

    flags_out = []
    if (app_id or run_id or since_dt) and total_seen == 0:
        flags_out.append({
            "code": "NO_EVENTS_MATCH_FILTER",
            "level": "INFO",
            "message": "No events matched the requested filters."
        })

    if legacy_count > 0:
        flags_out.append({
            "code": "LEGACY_EVENTS_PRESENT",
            "level": "INFO",
            "message": f"{legacy_count} legacy events ignored (missing schema_version)."
        })
    if manual_rate > 0.20:
        flags_out.append({
            "code": "MANUAL_HIGH",
            "level": "YELLOW",
            "message": "Manual override rate is elevated."
        })
    if p95_duration_ms > 60000:
        flags_out.append({
            "code": "LATENCY_P95_HIGH",
            "level": "YELLOW",
            "message": "High p95 duration suggests process drag."
        })
    if completed_count == 0 and total > 200:
        flags_out.append({
            "code": "NO_COMPLETIONS",
            "level": "YELLOW",
            "message": "No completion outcomes observed in canonical window."
        })

    health = "GREEN"
    if any(f["level"] == "YELLOW" for f in flags_out):
        health = "YELLOW"
    if sum(1 for f in flags_out if f["level"] == "YELLOW") >= 2:
        health = "RED"

    derived = {
        "events_seen_after_filter": total_seen,
        "canonical_events_used": total,
        "legacy_events_ignored": legacy_count,
        "manual_override_rate": manual_rate,
        "avg_duration_ms": avg_duration_ms,
        "p95_duration_ms": p95_duration_ms,
        "avg_cost_usd": avg_cost,
        "total_cost_usd": total_cost,
        "first_reward_event_index": first_reward_index,
        "completed_count_in_window": completed_count,
        "friction_steps": friction_steps,
    }

    return {
        "ok": True,
        "health": health,
        "flags": flags_out,
        "derived": derived,
        "filters": {
            "app_id": app_id,
            "run_id": run_id,
            "since": since,
        },
        "source": {"runs_log": str(RUNS_LOG), "limit": limit},
    }
