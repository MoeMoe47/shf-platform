from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

BASE = Path(__file__).resolve().parent
CONTRACT_PATH = BASE / "evidence_contract_v1.json"

def load_contract() -> Dict[str, Any]:
    return json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))

def _get_run_obj(report: Dict[str, Any]) -> Dict[str, Any]:
    r = report.get("run")
    if isinstance(r, dict):
        return r
    r = report.get("predict_summary", {}).get("run")
    if isinstance(r, dict):
        return r
    return {}

def _get_run_meta(run_obj: Dict[str, Any]) -> Dict[str, Any]:
    meta = run_obj.get("meta")
    if isinstance(meta, dict):
        return meta
    return {}

def _get_outcome_metrics(report: Dict[str, Any]) -> Dict[str, Any]:
    m = report.get("loo", {}).get("metrics")
    if isinstance(m, dict):
        return m
    return {}

def _get_integrity_signals(report: Dict[str, Any]) -> Dict[str, Any]:
    d = report.get("loe_summary", {}).get("derived")
    if isinstance(d, dict):
        return d
    d = report.get("snapshot", {})
    if isinstance(d, dict):
        return d
    return {}

def validate_evidence_contract(report: Dict[str, Any], contract: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if contract is None:
        contract = load_contract()

    run_obj = _get_run_obj(report)
    run_meta = _get_run_meta(run_obj)
    outcome = _get_outcome_metrics(report)
    integrity = _get_integrity_signals(report)

    missing_run: List[str] = []
    for k in contract.get("required_run_fields", []):
        v = run_obj.get(k)
        if v is None or (isinstance(v, str) and not v.strip()):
            missing_run.append(k)

    missing_meta: List[str] = []
    for k in contract.get("required_run_meta_fields", []):
        v = run_meta.get(k)
        if v is None or (isinstance(v, str) and not v.strip()):
            missing_meta.append(f"meta.{k}")

    missing_outcomes: List[str] = []
    for k in contract.get("required_outcome_metrics", []):
        if k not in outcome:
            missing_outcomes.append(f"loo.metrics.{k}")

    missing_integrity: List[str] = []
    for k in contract.get("required_integrity_signals", []):
        if k not in integrity:
            missing_integrity.append(f"loe_summary.derived.{k}")

    ok = not (missing_run or missing_meta or missing_outcomes or missing_integrity)

    return {
        "contract_id": contract.get("contract_id", "EVIDENCE_CONTRACT_V1"),
        "version": contract.get("version", "1.0"),
        "ok": ok,
        "missing": {
            "run": missing_run,
            "meta": missing_meta,
            "outcomes": missing_outcomes,
            "integrity": missing_integrity
        }
    }

def attach_evidence_contract(report: Dict[str, Any]) -> Dict[str, Any]:
    ev = validate_evidence_contract(report)
    report["evidence_contract"] = ev
    return report
