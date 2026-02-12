from __future__ import annotations
DEFAULT_WINDOW_DAYS = 7


from typing import Any, Dict, List, Tuple

from fabric.watchtower.integrity import compute_integrity
from fabric.watchtower.alerts import build_watchtower_alerts

def _load_program_catalog() -> List[Dict[str, Any]]:
    try:
        from routers.loo_routes import loo_programs  # type: ignore
        cat = loo_programs()
        progs = cat.get("programs") if isinstance(cat, dict) else None
        return progs if isinstance(progs, list) else []
    except Exception:
        return []

def _get_rankings(days: int, baseline_weeks: int) -> Dict[str, Any]:
    try:
        from routers.loo_rankings_routes import loo_rankings  # type: ignore
        return loo_rankings(days=int(days), baseline_weeks=int(baseline_weeks))  # type: ignore
    except Exception as ex:
        return {"ok": False, "error": f"RANKINGS_FAILED:{type(ex).__name__}", "rankings": []}

def build_watchtower_program_rows(*, days: int = 30, baseline_weeks: int = 8) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    days = int(days)
    baseline_weeks = int(baseline_weeks)

    catalog = _load_program_catalog()
    rankings_payload = _get_rankings(days, baseline_weeks)
    rankings = rankings_payload.get("rankings") if isinstance(rankings_payload, dict) else None
    rankings_list: List[Dict[str, Any]] = rankings if isinstance(rankings, list) else []

    by_id: Dict[str, Dict[str, Any]] = {}
    for r in rankings_list:
        if isinstance(r, dict):
            pid = str(r.get("program_id") or "")
            if pid:
                by_id[pid] = r

    rows: List[Dict[str, Any]] = []
    for p in catalog:
        if not isinstance(p, dict):
            continue
        pid = str(p.get("program_id") or "")
        if not pid:
            continue

        base = {
            "program_id": pid,
            "app_id": str(p.get("app_id") or ""),
            "label": str(p.get("label") or pid),
        }

        r = by_id.get(pid) or {}
        if isinstance(r, dict) and r:
            row = {**base, **r}
        else:
            row = {
        "window_days": window_days,
                **base,
                "ok": False,
                "adapter_ok": False,
                "adapter_error": "NO_RANKING_ROW",
                "metrics_contract_version": "",
                "health_01": 0.0,
                "delta_score_01": 0.0,
                "trend_band": "DOWN",
                "volume_01": 0.0,
                "quality_01": 0.0,
                "rank_score_01": 0.0,
                "rank_formula_version": "v1",
                "rank": None,
                "evidence": {"meta": {}, "contract_errors": ["NO_RANKING_ROW"]},
            }

        row["window_days"] = days
        row["baseline_weeks"] = baseline_weeks

        rows.append(row)
    rows.sort(key=lambda x: ((x.get("rank") is None), x.get("rank") or 10**9, str(x.get("label") or "")))

    integrity = compute_integrity(rows, catalog=catalog)
    summary = {**integrity}

    alerts = build_watchtower_alerts(summary)
    summary["alerts_count"] = len(alerts)
    summary["alerts"] = alerts
    return rows, summary

def build_watchtower_summary(*, days: int = 30, baseline_weeks: int = 8, top_n: int = 10) -> Dict[str, Any]:
    rows, integrity = build_watchtower_program_rows(days=days, baseline_weeks=baseline_weeks)
    top_n = max(1, int(top_n))
    top = rows[:top_n]
    return {
        "ok": True,
        "days": int(days),
        "baseline_weeks": int(baseline_weeks),
        "count": len(rows),
        **integrity,
        "top": top,
        "notes": "Watchtower is infrastructure-level, cross-program, adapter-driven observability.",
    }

# ------------------------------------------------------------
# Backward-compat aliases (tests/contracts may import old names)
# ------------------------------------------------------------
def compute_watchtower_rows(*, days: int = 30, baseline_weeks: int = 8, window_days: int = 30):
    # legacy name used by early tests
    return build_watchtower_program_rows(days=days, baseline_weeks=baseline_weeks)

def compute_watchtower_summary(*, days: int = 30, baseline_weeks: int = 8, top_n: int = 10):
    # legacy name used by early tests
    return build_watchtower_summary(days=days, baseline_weeks=baseline_weeks, top_n=top_n)
