from __future__ import annotations
import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict

def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00","Z")

def _sha256_bytes(b: bytes) -> str:
    h=hashlib.sha256()
    h.update(b)
    return h.hexdigest()

def _sha256_json(obj: Any) -> str:
    b=json.dumps(obj, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode("utf-8")
    return _sha256_bytes(b)

def build_proof_pack(run_id: str, report: Dict[str, Any], pdf_bytes: bytes, base_url: str = "http://127.0.0.1:8090") -> Dict[str, Any]:
    clean_report=report if isinstance(report, dict) else {}
    return {
        "ok": True,
        "generated_ts": _utc_iso(),
        "run_id": run_id,
        "report_sha256": _sha256_json(clean_report),
        "pdf_sha256": _sha256_bytes(pdf_bytes or b""),
        "report_bytes": len(json.dumps(clean_report, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode("utf-8")),
        "pdf_bytes": len(pdf_bytes or b""),
        "urls": {
            "report": f"{base_url}/runs/report/{run_id}",
            "pdf": f"{base_url}/runs/report/{run_id}/pdf",
            "proof": f"{base_url}/runs/report/{run_id}/proof"
        }
    }

def verify_proof_pack(run_id: str, report: dict, pdf_bytes: bytes, expected: dict) -> dict:
    got = build_proof_pack(run_id, report, pdf_bytes)
    exp_report = (expected or {}).get("report_sha256")
    exp_pdf = (expected or {}).get("pdf_sha256")
    return {
        "ok": True,
        "run_id": run_id,
        "expected": {"report_sha256": exp_report, "pdf_sha256": exp_pdf},
        "actual": {"report_sha256": got.get("report_sha256"), "pdf_sha256": got.get("pdf_sha256")},
        "pass": (exp_report == got.get("report_sha256") and exp_pdf == got.get("pdf_sha256"))
    }
