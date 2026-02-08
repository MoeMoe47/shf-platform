from __future__ import annotations

from typing import Any, Dict, List

from fabric.loo.adapter_registry import PROGRAM_ADAPTERS


def _catalog_program_ids() -> List[str]:
    # In-process call (no HTTP)
    from routers.loo_routes import loo_programs  # type: ignore
    cat = loo_programs()
    programs = cat.get("programs") if isinstance(cat, dict) else []
    if not isinstance(programs, list):
        return []
    ids: List[str] = []
    for p in programs:
        if isinstance(p, dict):
            pid = str(p.get("program_id") or "").strip()
            if pid:
                ids.append(pid)
    return ids


def validate_program_adapter_parity() -> None:
    catalog_ids = set(_catalog_program_ids())
    adapter_ids = set(PROGRAM_ADAPTERS.keys())

    missing_adapters = sorted(catalog_ids - adapter_ids)
    orphan_adapters = sorted(adapter_ids - catalog_ids)

    errs: List[str] = []
    if missing_adapters:
        errs.append("Programs missing adapters: " + ", ".join(missing_adapters))
    if orphan_adapters:
        errs.append("Adapters missing programs: " + ", ".join(orphan_adapters))

    if errs:
        raise RuntimeError("LOO program/adapter parity failed:\n  - " + "\n  - ".join(errs))
