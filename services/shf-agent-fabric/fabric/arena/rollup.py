from __future__ import annotations

import json
import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from .config import ensure_db, AGENTS_JSON, ROUNDS_JSONL, SIGNALS_JSONL, APP_ID


# -------------------------------------------------------------------
# Time helpers
# -------------------------------------------------------------------

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_ts(ts: Any) -> Optional[datetime]:
    if not ts:
        return None
    if isinstance(ts, (int, float)):
        try:
            return datetime.fromtimestamp(float(ts), tz=timezone.utc)
        except Exception:
            return None
    if isinstance(ts, str):
        s = ts.strip()
        if not s:
            return None
        if s.endswith("Z"):
            s = s.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(s)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None
    return None


def _day_key(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d")


def _week_of(dt: datetime) -> str:
    y, w, _ = dt.isocalendar()
    return f"{y}-W{int(w):02d}"


def _week_start_utc(dt: datetime) -> datetime:
    """
    Monday 00:00:00Z for that ISO week.
    """
    d = dt.astimezone(timezone.utc)
    # ISO weekday: Mon=1..Sun=7
    delta_days = int(d.isoweekday()) - 1
    start = datetime(d.year, d.month, d.day, tzinfo=timezone.utc) - timedelta(days=delta_days)
    return start.replace(hour=0, minute=0, second=0, microsecond=0)


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return float(x)


# -------------------------------------------------------------------
# File readers
# -------------------------------------------------------------------

def _read_json(path, default: Any) -> Any:
    try:
        if not path.exists() or path.stat().st_size == 0:
            return default
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def _read_jsonl(path) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    try:
        if not path.exists() or path.stat().st_size == 0:
            return out
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if isinstance(obj, dict):
                    out.append(obj)
            except Exception:
                continue
    except Exception:
        return out
    return out


# -------------------------------------------------------------------
# Math helpers
# -------------------------------------------------------------------

def _safe_div(a: float, b: float) -> float:
    return (a / b) if b else 0.0


def _shannon_entropy(counts: Dict[str, int]) -> float:
    """
    Normalized entropy 0..1
    """
    total = sum(max(0, int(v)) for v in counts.values())
    if total <= 0:
        return 0.0
    probs = [v / total for v in counts.values() if v > 0]
    if len(probs) <= 1:
        return 0.0
    h = -sum(p * math.log(p, 2) for p in probs)
    hmax = math.log(len(probs), 2)
    return float(max(0.0, min(1.0, h / hmax)))


# -------------------------------------------------------------------
# Canonical active-agent logic (Arena + LOO shared)
# -------------------------------------------------------------------

def _collect_active_agents_from_window(
    *,
    signals_in_window: List[Dict[str, Any]],
    rounds_in_window: List[Dict[str, Any]],
) -> Set[str]:
    """
    Active if:
      - submitted ≥1 signal in window OR
      - appeared in ≥1 finalized round entry in window
    """
    active: Set[str] = set()

    for s in signals_in_window:
        aid = str(s.get("agentId") or "")
        if aid:
            active.add(aid)

    for r in rounds_in_window:
        results = r.get("results") if isinstance(r.get("results"), dict) else {}
        entries = results.get("entries") if isinstance(results.get("entries"), list) else []
        for e in entries:
            aid = str(e.get("agentId") or "")
            if aid:
                active.add(aid)

    return active


# -------------------------------------------------------------------
# Week-over-week baseline comparator
# -------------------------------------------------------------------

def _week_buckets(
    *,
    now: datetime,
    weeks: int,
) -> List[Tuple[str, datetime, datetime]]:
    """
    Returns list of (week_key, start_dt, end_dt) for last N ISO weeks.
    end_dt is exclusive.
    Ordered oldest -> newest.
    """
    weeks = max(2, int(weeks))
    now_ws = _week_start_utc(now)
    buckets: List[Tuple[str, datetime, datetime]] = []
    for i in reversed(range(weeks)):
        ws = now_ws - timedelta(days=7 * i)
        we = ws + timedelta(days=7)
        wk = _week_of(ws)
        buckets.append((wk, ws, we))
    return buckets


def _slice_window(
    rows: List[Dict[str, Any]],
    *,
    ts_getter,
    start: datetime,
    end: datetime,
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for r in rows:
        dt = ts_getter(r)
        if dt and start <= dt < end:
            out.append(r)
    return out


def _compute_week_metrics(
    *,
    week_key: str,
    week_start: datetime,
    week_end: datetime,
    agents_map: Dict[str, Any],
    rounds_all: List[Dict[str, Any]],
    signals_all: List[Dict[str, Any]],
) -> Dict[str, Any]:
    rounds_w = _slice_window(
        rounds_all,
        ts_getter=lambda r: _parse_ts(r.get("endedAt") or r.get("startedAt")),
        start=week_start,
        end=week_end,
    )
    signals_w = _slice_window(
        signals_all,
        ts_getter=lambda s: _parse_ts(s.get("ts") or s.get("timestamp") or s.get("createdAt")),
        start=week_start,
        end=week_end,
    )

    active_agents = _collect_active_agents_from_window(signals_in_window=signals_w, rounds_in_window=rounds_w)

    enrolled = float(len(agents_map))
    active = float(len(active_agents))
    active_rate = _safe_div(active, enrolled)

    signals_total = float(len(signals_w))
    rounds_total = float(len(rounds_w))

    # winner diversity for the week
    winner_counts: Dict[str, int] = {}
    for r in rounds_w:
        w = (r.get("results") or {}).get("winner")
        if isinstance(w, dict):
            s = str(w.get("strategyUsed") or "UNKNOWN")
            winner_counts[s] = winner_counts.get(s, 0) + 1
    diversity = _shannon_entropy(winner_counts)

    # A simple, stable "weekly health" 0..1 for deltas.
    # These weights are deterministic and can be versioned later.
    # - engagement: active_rate (dominant)
    # - iteration: rounds_total (scaled)
    # - diversity: diversity (small bonus)
    rounds_score = _clamp01(_safe_div(rounds_total, 10.0))  # 10 finals/week = "max" for v1 normalization
    health_01 = _clamp01((0.70 * active_rate) + (0.20 * rounds_score) + (0.10 * diversity))

    return {
        "week": week_key,
        "weekStart": week_start.isoformat().replace("+00:00", "Z"),
        "weekEnd": week_end.isoformat().replace("+00:00", "Z"),
        "enrolled_agents": int(enrolled),
        "active_agents": int(active),
        "active_rate": float(round(active_rate, 4)),
        "signals_total": int(signals_total),
        "rounds_finalized_total": int(rounds_total),
        "winner_strategy_diversity_01": float(round(diversity, 4)),
        "health_01": float(round(health_01, 4)),
    }


def _delta_score_pack(
    *,
    baseline: Dict[str, Any],
    current: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Produces a dashboard-friendly delta pack.
    """
    def g(d: Dict[str, Any], k: str) -> float:
        try:
            return float(d.get(k) or 0.0)
        except Exception:
            return 0.0

    delta = {
        "active_rate": round(g(current, "active_rate") - g(baseline, "active_rate"), 4),
        "signals_total": int(g(current, "signals_total") - g(baseline, "signals_total")),
        "rounds_finalized_total": int(g(current, "rounds_finalized_total") - g(baseline, "rounds_finalized_total")),
        "winner_strategy_diversity_01": round(g(current, "winner_strategy_diversity_01") - g(baseline, "winner_strategy_diversity_01"), 4),
        "health_01": round(g(current, "health_01") - g(baseline, "health_01"), 4),
    }

    # Convert health delta into a stable 0..1 "momentum" score.
    # -0.20 or worse => 0.0
    # +0.20 or better => 1.0
    momentum = _clamp01((delta["health_01"] + 0.20) / 0.40)
    if delta["health_01"] >= 0.03:
        band = "UP"
    elif delta["health_01"] <= -0.03:
        band = "DOWN"
    else:
        band = "FLAT"

    return {
        "baseline_week": baseline.get("week"),
        "current_week": current.get("week"),
        "delta": delta,
        "delta_score_01": float(round(momentum, 4)),
        "trend_band": band,
        "notes": "Week-over-week delta computed deterministically from spectator-safe weekly health_01.",
    }


# -------------------------------------------------------------------
# Arena metrics (windowed)
# -------------------------------------------------------------------

def build_arena_metrics(*, days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    """
    Institutional-grade, spectator-safe Arena metrics (deterministic),
    plus week-over-week baseline comparator.
    """
    ensure_db()

    now = _utc_now()
    start = now - timedelta(days=max(1, int(days)))

    agents_doc = _read_json(AGENTS_JSON, {"agents": {}})
    agents_map = agents_doc.get("agents") if isinstance(agents_doc, dict) else {}
    agents_map = agents_map if isinstance(agents_map, dict) else {}

    rounds = _read_jsonl(ROUNDS_JSONL)
    signals = _read_jsonl(SIGNALS_JSONL)

    # Window filter (days)
    rounds_w: List[Dict[str, Any]] = []
    for r in rounds:
        dt = _parse_ts(r.get("endedAt") or r.get("startedAt"))
        if dt and start <= dt <= now:
            rounds_w.append(r)

    signals_w: List[Dict[str, Any]] = []
    for s in signals:
        dt = _parse_ts(s.get("ts") or s.get("timestamp") or s.get("createdAt"))
        if dt and start <= dt <= now:
            signals_w.append(s)

    active_agents = _collect_active_agents_from_window(signals_in_window=signals_w, rounds_in_window=rounds_w)

    enrolled = float(len(agents_map))
    active = float(len(active_agents))

    signals_total = float(len(signals_w))
    rounds_total = float(len(rounds_w))
    days_f = float(max(1, int(days)))

    signals_per_day = _safe_div(signals_total, days_f)
    rounds_per_day = _safe_div(rounds_total, days_f)
    active_rate = _safe_div(active, enrolled)

    # Median gap between finalized rounds
    times = sorted(
        dt for dt in (
            _parse_ts(r.get("endedAt") or r.get("startedAt"))
            for r in rounds_w
        ) if dt
    )
    gaps = [
        (times[i] - times[i - 1]).total_seconds() / 60.0
        for i in range(1, len(times))
        if (times[i] - times[i - 1]).total_seconds() >= 0
    ]
    gaps.sort()
    median_gap = gaps[len(gaps) // 2] if gaps else 0.0

    # Strategy diversity (winners)
    winner_counts: Dict[str, int] = {}
    for r in rounds_w:
        w = (r.get("results") or {}).get("winner")
        if isinstance(w, dict):
            s = str(w.get("strategyUsed") or "UNKNOWN")
            winner_counts[s] = winner_counts.get(s, 0) + 1
    diversity = _shannon_entropy(winner_counts)

    # Program health band (window)
    program_health = (
        "GREEN" if active_rate >= 0.25 and rounds_per_day >= 0.10 else
        "YELLOW" if active_rate >= 0.10 else
        "RED"
    )

    # Week-over-week baseline comparator (global, not limited to days window)
    buckets = _week_buckets(now=now, weeks=int(baseline_weeks))
    weekly_series: List[Dict[str, Any]] = []
    for wk, ws, we in buckets:
        weekly_series.append(
            _compute_week_metrics(
                week_key=wk,
                week_start=ws,
                week_end=we,
                agents_map=agents_map,
                rounds_all=rounds,
                signals_all=signals,
            )
        )

    # baseline = previous week, current = latest week
    baseline_week = weekly_series[-2] if len(weekly_series) >= 2 else (weekly_series[-1] if weekly_series else {})
    current_week = weekly_series[-1] if weekly_series else {}

    baseline_compare = _delta_score_pack(baseline=baseline_week or {}, current=current_week or {}) if weekly_series else {
        "baseline_week": None,
        "current_week": None,
        "delta": {},
        "delta_score_01": 0.0,
        "trend_band": "FLAT",
        "notes": "No weekly data yet.",
    }

    return {
        "window_days": int(days),
        "enrolled_agents": int(enrolled),
        "active_agents": int(active),
        "active_rate": round(active_rate, 4),
        "signals_total": int(signals_total),
        "signals_per_day": round(signals_per_day, 4),
        "rounds_finalized_total": int(rounds_total),
        "rounds_per_day": round(rounds_per_day, 4),
        "median_minutes_between_rounds": round(median_gap, 2),
        "winner_strategy_counts": winner_counts,
        "winner_strategy_diversity_01": round(diversity, 4),
        "program_health": program_health,
        "baseline_weeks": int(baseline_weeks),
        "weekly_series": weekly_series,
        "baseline_compare": baseline_compare,
        "interpretation": {
            "active_rate": "Share of enrolled agents active in the window.",
            "signals_per_day": "Engagement proxy.",
            "rounds_per_day": "Iteration speed proxy.",
            "winner_strategy_diversity_01": "0=converged, 1=diverse winners.",
            "program_health": "Deterministic GREEN / YELLOW / RED bands.",
            "baseline_compare": "Week-over-week momentum pack (delta + delta_score_01 + trend_band).",
        },
    }


# -------------------------------------------------------------------
# LOO payload
# -------------------------------------------------------------------

def build_loo_payload(*, days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    """
    LOO-compatible payload with baseline comparator inside meta for ranking.
    """
    ensure_db()

    now = _utc_now()
    start = now - timedelta(days=max(1, int(days)))

    agents_doc = _read_json(AGENTS_JSON, {"agents": {}})
    agents_map = agents_doc.get("agents") if isinstance(agents_doc, dict) else {}
    agents_map = agents_map if isinstance(agents_map, dict) else {}

    rounds = _read_jsonl(ROUNDS_JSONL)
    signals = _read_jsonl(SIGNALS_JSONL)

    rounds_w = [
        r for r in rounds
        if (dt := _parse_ts(r.get("endedAt") or r.get("startedAt")))
        and start <= dt <= now
    ]

    signals_w = [
        s for s in signals
        if (dt := _parse_ts(s.get("ts") or s.get("timestamp") or s.get("createdAt")))
        and start <= dt <= now
    ]

    active_agents = _collect_active_agents_from_window(signals_in_window=signals_w, rounds_in_window=rounds_w)

    arena_metrics = build_arena_metrics(days=int(days), baseline_weeks=int(baseline_weeks))

    enrolled_count = float(len(agents_map))
    retained_count = float(len(active_agents))
    retention_rate = _safe_div(retained_count, enrolled_count)

    return {
        "monthly": {
            "app_id": APP_ID,
            "enrolled_count": int(enrolled_count),
            "retained_count": int(retained_count),
            "retention_rate": round(retention_rate, 4),
            "rounds_finalized_total": int(len(rounds_w)),
            "signals_total": int(len(signals_w)),
            "window_days": int(days),
            "program_health": arena_metrics.get("program_health"),
            # This is the ranking-friendly piece you’ll use across programs:
            "delta_score_01": float((arena_metrics.get("baseline_compare") or {}).get("delta_score_01") or 0.0),
            "trend_band": str((arena_metrics.get("baseline_compare") or {}).get("trend_band") or "FLAT"),
        },
        "meta": {
            "app_id": APP_ID,
            "generatedAt": now.isoformat().replace("+00:00", "Z"),
            "windowStart": start.isoformat().replace("+00:00", "Z"),
            "windowEnd": now.isoformat().replace("+00:00", "Z"),
            "arenaMetrics": arena_metrics,
            "baselineCompare": arena_metrics.get("baseline_compare"),
            "note": "Arena rollup payload (deterministic, spectator-safe) with week-over-week baseline comparator.",
        },
    }
