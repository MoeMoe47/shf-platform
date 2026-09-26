from __future__ import annotations

"""
Last-known verification results for the Agent Fabric Command Center.

WRITE: only the privileged verification actions (/admin/infra/verify,
/admin/observability/verify) record their outcome here, after they run.
READ: Command Center read projections load the last record. Reading never
runs verification, creates directories, or writes anything.

Records hold only check names, pass/fail, and reason codes — never stdout,
stderr, exception text, paths, or key material.
"""

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from fabric.command.sanitize import safe_reason_code

KINDS = ("infrastructure", "observability")
RECORD_CONTRACT = "afcc.verification_result.v1"


def _service_root() -> Path:
    # fabric/command/verification_results.py -> fabric/command -> fabric -> services/shf-agent-fabric
    return Path(__file__).resolve().parents[2]


def results_dir() -> Path:
    p = os.getenv("SHF_COMMAND_VERIFICATION_DIR", "")
    if p.strip():
        return Path(p).expanduser().resolve()
    return _service_root() / "var" / "command_verification"


def _record_path(kind: str) -> Path:
    if kind not in KINDS:
        raise ValueError(f"unknown verification kind: {kind}")
    return results_dir() / f"{kind}.latest.json"


def utc_now_z() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _verdict(checks: list[Dict[str, Any]]) -> str:
    oks = [c["ok"] for c in checks if isinstance(c.get("ok"), bool)]
    if oks and all(oks):
        return "PASS"
    if any(oks):
        return "DEGRADED"
    return "FAIL"


def record_verification_result(kind: str, checks: Iterable[Dict[str, Any]], *, trigger: str) -> Optional[Dict[str, Any]]:
    """
    Persist a sanitized result. Best-effort: a storage failure must never change
    the verification response, so errors are swallowed and None is returned.
    """
    try:
        normalized = []
        for check in checks:
            ok = check.get("ok")
            normalized.append(
                {
                    "name": safe_reason_code(str(check.get("name") or "").upper(), "UNNAMED_CHECK").lower(),
                    "ok": ok if isinstance(ok, bool) else None,
                    "reason_code": None if ok is True else safe_reason_code(check.get("reason_code"), "CHECK_FAILED"),
                }
            )
        record = {
            "contract": RECORD_CONTRACT,
            "kind": kind,
            "verified_at": utc_now_z(),
            "trigger": safe_reason_code(trigger.upper(), "UNSPECIFIED").lower(),
            "status": _verdict(normalized),
            "checks": normalized,
        }
        path = _record_path(kind)
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(prefix=f".{kind}.", dir=str(path.parent))
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(record, f, sort_keys=True)
        os.replace(tmp, path)
        return record
    except Exception:
        return None


def read_verification_result(kind: str) -> Optional[Dict[str, Any]]:
    """Pure read. Returns None when no result has been recorded or the record is unreadable."""
    path = _record_path(kind)
    try:
        with path.open("r", encoding="utf-8") as f:
            record = json.load(f)
    except (FileNotFoundError, NotADirectoryError):
        return None
    except (OSError, ValueError):
        return {"contract": RECORD_CONTRACT, "kind": kind, "unreadable": True}
    if not isinstance(record, dict) or record.get("contract") != RECORD_CONTRACT:
        return {"contract": RECORD_CONTRACT, "kind": kind, "unreadable": True}
    return record
