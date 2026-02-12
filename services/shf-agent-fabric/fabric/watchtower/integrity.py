from __future__ import annotations

from typing import Any, Dict, List, Optional


def compute_integrity(
    rows: List[Dict[str, Any]],
    *,
    catalog: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Compute Watchtower integrity/coverage stats.

    - rows: watchtower program rows (already include adapter_ok + contract_errors evidence)
    - catalog: optional map program_id -> catalog entry (lets us compute total coverage)
    """
    # Coverage base
    coverage_total = len(catalog) if isinstance(catalog, dict) else len(rows)

    coverage_with_adapter = 0
    coverage_adapter_ok = 0
    contract_ok = 0
    contract_fail = 0

    alerts_count = 0  # filled by alerts module; kept here for stable shape

    for r in rows:
        if not isinstance(r, dict):
            continue

        # Adapter coverage
        adapter_ok = bool(r.get("adapter_ok") is True)
        adapter_error = str(r.get("adapter_error") or "")
        has_adapter = adapter_ok or (adapter_error != "NO_ADAPTER" and adapter_error != "")

        if has_adapter:
            coverage_with_adapter += 1
        if adapter_ok:
            coverage_adapter_ok += 1

        # Contract check
        evidence = r.get("evidence")
        contract_errors: List[str] = []
        if isinstance(evidence, dict):
            ce = evidence.get("contract_errors")
            if isinstance(ce, list):
                contract_errors = [str(x) for x in ce]

        if contract_errors:
            contract_fail += 1
        else:
            contract_ok += 1

    adapter_ok_rate = (coverage_adapter_ok / coverage_total) if coverage_total else 0.0
    contract_ok_rate = (contract_ok / coverage_total) if coverage_total else 0.0

    return {
        "coverage_total": int(coverage_total),
        "coverage_with_adapter": int(coverage_with_adapter),
        "coverage_adapter_ok": int(coverage_adapter_ok),
        "contract_ok": int(contract_ok),
        "contract_fail": int(contract_fail),
        "adapter_ok_rate": float(adapter_ok_rate),
        "contract_ok_rate": float(contract_ok_rate),
        "alerts_count": int(alerts_count),
    }
