from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter

from fabric.loo.adapter_registry import PROGRAM_ADAPTERS

# Resilient meta: never crash boot if meta missing in some branch
try:
    from fabric.loo.adapter_registry import PROGRAM_ADAPTER_META  # type: ignore
except Exception:
    PROGRAM_ADAPTER_META = {}  # type: ignore

from fabric.loo.adapter_contract import validate_metrics_shape

router = APIRouter(prefix="/loo", tags=["loo"])


def _load_program_catalog() -> Dict[str, Dict[str, Any]]:
    """Return map: program_id -> catalog entry (in-process, no HTTP)."""
    try:
        from routers.loo_routes import loo_programs  # type: ignore
        cat = loo_programs()
        progs = cat.get("programs") if isinstance(cat, dict) else None
        out: Dict[str, Dict[str, Any]] = {}
        if isinstance(progs, list):
            for p in progs:
                if isinstance(p, dict):
                    pid = str(p.get("program_id") or "")
                    if pid:
                        out[pid] = p
        return out
    except Exception:
        return {}


def _default_meta_for(program_id: str, adapter: object) -> Dict[str, Any]:
    name = getattr(adapter, "__name__", "adapter")
    mod = getattr(adapter, "__module__", "unknown")
    return {
        "label": program_id,
        "owner": mod.split(".")[1] if mod.startswith("fabric.") else "unknown",
        "metrics_contract_version": "v1",
        "adapter_version": "v1",
        "supports_baseline_weeks": True,
        "notes": f"default meta (adapter={name}, module={mod})",
    }


def _safe_str(x: Any, default: str = "") -> str:
    return default if x is None else str(x)


@router.get("/adapters")
def loo_adapters_status(days: int = 30, baseline_weeks: int = 8) -> Dict[str, Any]:
    catalog = _load_program_catalog()

    rows: List[Dict[str, Any]] = []
    for program_id, adapter in PROGRAM_ADAPTERS.items():
        meta = PROGRAM_ADAPTER_META.get(program_id) or _default_meta_for(program_id, adapter)
        cat = catalog.get(program_id, {})

        label = _safe_str(cat.get("label") or meta.get("label") or program_id, program_id)
        app_id = _safe_str(cat.get("app_id") or meta.get("app_id") or "", "")
        owner = _safe_str(meta.get("owner") or "unknown", "unknown")

        meta_obj = {
            "program_id": program_id,
            "app_id": app_id,
            "label": label,
            "owner": owner,
            "metrics_contract_version_expected": _safe_str(meta.get("metrics_contract_version") or "v1", "v1"),
            "adapter_version": _safe_str(meta.get("adapter_version") or "v1", "v1"),
            "notes": _safe_str(meta.get("notes") or "", ""),
        }

        try:
            metrics = adapter(days=int(days), baseline_weeks=int(baseline_weeks))
            errs = validate_metrics_shape(program_id, metrics)
            got_ver = _safe_str(metrics.get("metrics_contract_version"), "")
            rows.append(
                {
                    **meta_obj,
                    "ok": len(errs) == 0,
                    "errors": errs,
                    "metrics_contract_version_seen": got_ver or None,
                }
            )
        except Exception as ex:
            rows.append(
                {
                    **meta_obj,
                    "ok": False,
                    "errors": [f"{type(ex).__name__}: {ex}"],
                    "metrics_contract_version_seen": None,
                }
            )

    rows.sort(key=lambda r: (r.get("ok") is True, r.get("program_id", "")), reverse=True)

    return {
        "ok": True,
        "days": int(days),
        "baseline_weeks": int(baseline_weeks),
        "count": len(rows),
        "adapters": rows,
        "note": "Status board runs adapters in-process and validates the metrics contract.",
    }
