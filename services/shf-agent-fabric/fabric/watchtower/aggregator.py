from __future__ import annotations

from typing import Any, Dict, List, Tuple

from fabric.watchtower.integrity import compute_integrity
from fabric.watchtower.alerts import build_watchtower_alerts
from fabric.watchtower.risk_engine import apply_risk_fields
from fabric.watchtower.store import get_quarantine_map, record_risk_snapshot
from fabric.watchtower.audit import log_event


DEFAULT_WINDOW_DAYS = 7


def _load_program_catalog() -> List[Dict[str, Any]]:
    """
    Pull the canonical program catalog from the LOO route function.
    This is intentionally defensive: Watchtower must tolerate partial outages.
    """
    try:
        from routers.loo_routes import loo_programs  # type: ignore

        cat = loo_programs()  # route function returns dict
        progs = cat.get("programs") if isinstance(cat, dict) else None
        return progs if isinstance(progs, list) else []
    except Exception:
        return []


def _get_rankings(days: int, baseline_weeks: int) -> Dict[str, Any]:
    """
    Pull rankings from the LOO route function.
    Defensive: if rankings fail, Watchtower still returns program rows (degraded).
    """
    try:
        from routers.loo_rankings_routes import loo_rankings  # type: ignore

        return loo_rankings(days=int(days), baseline_weeks=int(baseline_weeks))  # type: ignore
    except Exception as ex:
        return {"ok": False, "error": f"RANKINGS_FAILED:{type(ex).__name__}:{ex}", "rankings": []}


def _as_list(x: Any) -> List[Any]:
    return x if isinstance(x, list) else []


def _risk_band_for_row(row: Dict[str, Any]) -> Tuple[str, bool, List[str]]:
    """
    Returns (risk_band, quarantine, reasons)

    Bands:
      - GREEN: healthy
      - YELLOW: warning
      - RED: high risk
      - QUARANTINE: unsafe to score / trust
    """
    reasons: List[str] = []

    adapter_ok = bool(row.get("adapter_ok"))
    ok = bool(row.get("ok"))
    evidence = row.get("evidence") if isinstance(row.get("evidence"), dict) else {}
    contract_errors = _as_list(evidence.get("contract_errors"))

    # Quarantine triggers (contract / missing / untrusted)
    if not ok:
        reasons.append("ok=false")
    if not adapter_ok:
        reasons.append("adapter_ok=false")
    if contract_errors:
        reasons.append("contract_errors")
    if str(row.get("adapter_error") or "") in {"NO_RANKING_ROW", "RANKINGS_FAILED"}:
        reasons.append("no_ranking_row")

    quarantine = bool(reasons) and (not adapter_ok or contract_errors or "no_ranking_row" in reasons or not ok)

    if quarantine:
        return "QUARANTINE", True, reasons

    # Numeric risk signals
    health = float(row.get("health_01") or 0.0)
    rank_score = float(row.get("rank_score_01") or 0.0)
    delta = float(row.get("delta_score_01") or 0.0)
    trend = str(row.get("trend_band") or "")

    # RED conditions
    if health < 0.40:
        return "RED", False, ["health<0.40"]
    if rank_score < 0.30 and health < 0.60:
        return "RED", False, ["rank_score low + health<0.60"]
    if trend == "DOWN" and delta < -0.20:
        return "RED", False, ["trend down + delta<-0.20"]

    # YELLOW conditions
    if health < 0.70:
        return "YELLOW", False, ["health<0.70"]
    if rank_score < 0.50:
        return "YELLOW", False, ["rank_score<0.50"]
    if trend == "DOWN":
        return "YELLOW", False, ["trend down"]

    return "GREEN", False, []


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

        base: Dict[str, Any] = {
            "program_id": pid,
            "app_id": str(p.get("app_id") or ""),
            "label": str(p.get("label") or pid),
            "window_days": days,
            "baseline_weeks": baseline_weeks,
        }

        r = by_id.get(pid) or {}
        if isinstance(r, dict) and r:
            row: Dict[str, Any] = {**base, **r}
        else:
            # Deterministic “missing row” shape (so UI + downstream code never breaks)
            row = {
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

        # Risk + quarantine (shared engine + persisted manual quarantine)
        apply_risk_fields(row)
        qmap = get_quarantine_map()
        if row.get("program_id") in qmap:
            row["risk_band"] = "QUARANTINE"
            row["quarantined"] = True
            row["watchtower_action"] = "QUARANTINE"
            row["quarantine_reasons"] = ["manual_quarantine"]
            row["manual_quarantine"] = qmap.get(row.get("program_id"))
        # Audit + history (best-effort)
        try:
            log_event({"risk_band": row.get("risk_band"), "quarantined": row.get("quarantined"), "reasons": row.get("quarantine_reasons")}, kind="watchtower_risk", program_id=str(row.get("program_id") or ""))
            record_risk_snapshot(row, window_days=days, baseline_weeks=baseline_weeks)
        except Exception:
            pass

        rows.append(row)

    # Deterministic ordering: ranked first, then label
    rows.sort(key=lambda x: ((x.get("rank") is None), x.get("rank") or 10**9, str(x.get("label") or "")))

    integrity = compute_integrity(rows, catalog=catalog)
    summary: Dict[str, Any] = {**integrity}

    # Alerts (existing)
    alerts = build_watchtower_alerts(summary)
    summary["alerts_count"] = len(alerts)
    summary["alerts"] = alerts

    # Risk rollups (NEW)
    risk_counts = {"GREEN": 0, "YELLOW": 0, "RED": 0, "QUARANTINE": 0}
    quarantine_count = 0
    for r in rows:
        band = str(r.get("risk_band") or "GREEN")
        if band not in risk_counts:
            band = "GREEN"
        risk_counts[band] += 1
        if bool(r.get("quarantined")):
            quarantine_count += 1

    summary["risk_counts"] = risk_counts
    summary["quarantine_count"] = quarantine_count
    summary["worst_risk_band"] = "QUARANTINE" if quarantine_count > 0 else ("RED" if risk_counts["RED"] > 0 else ("YELLOW" if risk_counts["YELLOW"] > 0 else "GREEN"))

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
    _ = int(window_days)  # kept for signature compatibility
    return build_watchtower_program_rows(days=days, baseline_weeks=baseline_weeks)


def compute_watchtower_summary(*, days: int = 30, baseline_weeks: int = 8, top_n: int = 10):
    # legacy name used by early tests
    return build_watchtower_summary(days=days, baseline_weeks=baseline_weeks, top_n=top_n)
