from __future__ import annotations

from typing import Any, Dict, List


def _load_program_catalog_in_process() -> List[Dict[str, Any]]:
    """
    Load /loo/programs in-process (no HTTP).
    """
    from routers.loo_routes import loo_programs  # type: ignore

    cat = loo_programs()
    if not isinstance(cat, dict):
        return []
    progs = cat.get("programs")
    return progs if isinstance(progs, list) else []


def validate_program_catalog_parity(program_adapters: Dict[str, Any]) -> None:
    """
    Enforces:
      - Every program_id in /loo/programs has a registered adapter.
      - No adapters exist that aren't listed in /loo/programs.
    Raises RuntimeError on mismatch.
    """
    programs = _load_program_catalog_in_process()
    if not programs:
        raise RuntimeError("Program catalog empty: /loo/programs returned no programs")

    catalog_ids = sorted({str(p.get("program_id") or "") for p in programs if isinstance(p, dict) and p.get("program_id")})
    adapter_ids = sorted({str(k) for k in (program_adapters or {}).keys()})

    missing = sorted(set(catalog_ids) - set(adapter_ids))
    extra = sorted(set(adapter_ids) - set(catalog_ids))

    errs: List[str] = []
    if missing:
        errs.append(f"Missing adapters for program_id(s): {missing}")
    if extra:
        errs.append(f"Adapters registered but not in /loo/programs: {extra}")

    if errs:
        raise RuntimeError("Catalog↔Adapter parity failed:\n  - " + "\n  - ".join(errs))
