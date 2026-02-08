from __future__ import annotations

from typing import Any, Dict, List


def validate_adapter_meta_parity(
    adapters: Dict[str, Any],
    meta: Dict[str, Dict[str, Any]],
) -> List[str]:
    errs: List[str] = []

    if not isinstance(adapters, dict) or not adapters:
        errs.append("PROGRAM_ADAPTERS must be a non-empty dict")
        return errs

    if not isinstance(meta, dict) or not meta:
        errs.append("PROGRAM_ADAPTER_META must be a non-empty dict")
        return errs

    # Every adapter must have meta
    for program_id in adapters.keys():
        if program_id not in meta:
            errs.append(f"missing meta for adapter: {program_id}")

    # Meta should not contain unknown programs (optional but top-1% clean)
    for program_id in meta.keys():
        if program_id not in adapters:
            errs.append(f"meta exists for unknown adapter: {program_id}")

    # Basic shape checks (lightweight; contract test covers metrics)
    for program_id, m in meta.items():
        if not isinstance(m, dict):
            errs.append(f"{program_id}: meta must be dict")
            continue
        for k in ("label", "owner", "metrics_contract_version"):
            if k not in m:
                errs.append(f"{program_id}: meta missing key '{k}'")

    return errs


def assert_adapter_meta_parity(
    adapters: Dict[str, Any],
    meta: Dict[str, Dict[str, Any]],
) -> None:
    errs = validate_adapter_meta_parity(adapters, meta)
    if errs:
        msg = "Adapter↔Meta parity failed:\n  - " + "\n  - ".join(errs)
        raise RuntimeError(msg)
