from __future__ import annotations

from pathlib import Path
from typing import Optional, List, Dict, Any
import hashlib
import json
import re

from fastapi import APIRouter, Query
from fastapi import Depends
from fabric.admin_auth import require_admin_key
from fastapi import HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi import Header
from fabric.force_mode import apply_force
from fabric.force_ledger import append_force_event

from fabric.reports.funder_report import build_funder_report
from fabric.reports.pdf_report import build_funder_report_pdf


# ---------------------------
# Publish helpers (compat)
# ---------------------------
import hashlib
from typing import Any, Dict, Optional

def _sha256_json(obj: Any) -> str:
    import json
    b = json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(b).hexdigest()

def _sha256_pdf_bytes(b: bytes) -> str:
    return hashlib.sha256(b or b"").hexdigest()

def _build_report_object(run_id: str, limit: int = 5000, since: Optional[str] = None) -> Dict[str, Any]:
    """
    Build the canonical JSON report object for a run.
    This is a thin wrapper over fabric.reports.funder_report.
    """
    from fabric.reports import funder_report as fr

    # Preferred names (in order)
    if hasattr(fr, "build_funder_report"):
        return fr.build_funder_report(run_id=run_id, limit=limit, since=since)
    if hasattr(fr, "build_report"):
        return fr.build_report(run_id=run_id, limit=limit, since=since)
    if hasattr(fr, "render_report"):
        return fr.render_report(run_id=run_id, limit=limit, since=since)

    # Last resort: find any callable that looks right
    for name in dir(fr):
        if name.startswith("_"): 
            continue
        fn = getattr(fr, name)
        if callable(fn) and "report" in name.lower():
            try:
                return fn(run_id=run_id, limit=limit, since=since)
            except TypeError:
                pass

    raise RuntimeError("No funder report builder found in fabric.reports.funder_report")

def _build_report_pdf_bytes(report_obj: Dict[str, Any]) -> bytes:
    """
    Build a PDF bytes payload for a report object.
    This is a thin wrapper over fabric.reports.pdf_report.
    """
    from fabric.reports import pdf_report as pr

    # Preferred names (in order)
    if hasattr(pr, "build_report_pdf_bytes"):
        return pr.build_report_pdf_bytes(report_obj)
    if hasattr(pr, "render_pdf_bytes"):
        return pr.render_pdf_bytes(report_obj)
    if hasattr(pr, "build_pdf_bytes"):
        return pr.build_pdf_bytes(report_obj)

    # Sometimes PDF builder wants run_id instead of report_obj
    rid = (report_obj or {}).get("run_id")

    if hasattr(pr, "build_pdf_report") and rid:
        try:
            out = pr.build_pdf_report(run_id=rid)
            return out if isinstance(out, (bytes, bytearray)) else bytes(out)
        except TypeError:
            pass

    # Last resort: try any callable with 'pdf' in the name
    for name in dir(pr):
        if name.startswith("_"):
            continue
        fn = getattr(pr, name)
        if callable(fn) and "pdf" in name.lower():
            # Try (report_obj) then (run_id)
            try:
                out = fn(report_obj)
                return out if isinstance(out, (bytes, bytearray)) else bytes(out)
            except TypeError:
                if rid:
                    try:
                        out = fn(rid)
                        return out if isinstance(out, (bytes, bytearray)) else bytes(out)
                    except TypeError:
                        pass

    raise RuntimeError("No PDF builder found in fabric.reports.pdf_report")


router = APIRouter(prefix="/runs", tags=["runs-report"])

def _assert_publish_helpers():
    required = [
        "_build_report_object",
        "_build_report_pdf_bytes",
        "_sha256_json",
        "_sha256_pdf_bytes",
    ]
    missing = [n for n in required if n not in globals()]
    if missing:
        raise RuntimeError(f"publish helpers missing: {missing}")

_assert_publish_helpers()



# --- publish helpers (injected) ---
from pathlib import Path as _Path

def _service_root() -> _Path:
    # service root is the folder that contains this routers/ directory
    return _Path(__file__).resolve().parents[1]

def _rid(run_id: str) -> str:
    # normalize run_id for filesystem + URL safety
    return (run_id or "").strip()
# --- end publish helpers ---


def _append_audit(event: dict) -> None:
    base = Path(__file__).resolve().parents[1]
    audit_dir = base / "registry" / "audit"
    audit_dir.mkdir(parents=True, exist_ok=True)
    audit_path = audit_dir / "audit.log.jsonl"
    with audit_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")

def _load_run_meta(run_id: str) -> dict:
    from pathlib import Path
    import json
    fp = Path(__file__).resolve().parent.parent / "registry" / "runs" / f"{_rid(run_id)}.json"
    if fp.exists():
        return json.loads(fp.read_text(encoding="utf-8"))
    return {}

def _policy_check_run_meta(meta: dict) -> dict:
    run_obj = meta.get("run") if isinstance(meta.get("run"), dict) else meta
    mode = (run_obj.get("mode") or "").upper()
    issues = []
    if mode not in ("PILOT", "SYSTEM"):
        issues.append("mode_missing_or_invalid")
    if not run_obj.get("app_id"):
        issues.append("app_id_missing")
    if not run_obj.get("site"):
        issues.append("site_missing")
    if not run_obj.get("start_ts"):
        issues.append("start_ts_missing")
    if not run_obj.get("end_ts"):
        issues.append("end_ts_missing")
    ok = (len(issues) == 0)
    return {"ok": ok, "mode": mode, "issues": issues}


def _policy_check(run_obj: dict) -> dict:
    mode = (run_obj.get("mode") or "").upper()
    issues = []

    if mode not in ("PILOT", "SYSTEM"):
        issues.append("mode_missing_or_invalid")

    if not run_obj.get("app_id"):
        issues.append("app_id_missing")

    if not run_obj.get("site"):
        issues.append("site_missing")

    if not run_obj.get("start_ts"):
        issues.append("start_ts_missing")

    if not run_obj.get("end_ts"):
        issues.append("end_ts_missing")

    ok = (len(issues) == 0)
    return {"ok": ok, "mode": mode, "issues": issues}


from datetime import datetime, timezone

def _runs_dir() -> Path:
    d = _service_root() / "registry" / "runs"
    d.mkdir(parents=True, exist_ok=True)
    return d

def _write_run_stub(run_id: str, meta: Dict[str, Any]) -> Path:
    rid = _rid(run_id)
    fp = _runs_dir() / f"{rid}.json"
    doc = {"run_id": rid, "meta": meta or {}, "created_ts": datetime.now(timezone.utc).isoformat()}
    fp.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return fp

@router.get("/reports/{run_id}/policy")
def get_run_policy(run_id: str):
    rid = _rid(run_id)

    base = _service_root()
    run_fp = base / "registry" / "runs" / f"{rid}.json"
    if not run_fp.exists():
        raise HTTPException(status_code=404, detail={"ok": False, "error": "run_not_found", "run_id": rid})

    doc = json.loads(run_fp.read_text(encoding="utf-8"))

    run_obj = doc.get("run") if isinstance(doc.get("run"), dict) else doc
    policy = doc.get("policy") if isinstance(doc.get("policy"), dict) else {}

    status = _policy_check_run_meta(doc)

    pub_dir = base / "registry" / "published" / rid
    proof_fp = pub_dir / "proof.json"
    published = proof_fp.exists()
    proof = json.loads(proof_fp.read_text(encoding="utf-8")) if published else None

    publish_allowed = bool(policy.get("publish_allowed", True))
    data_allowed = bool(policy.get("data_allowed", True))
    visibility = (policy.get("visibility") or "PRIVATE").upper()

    can_publish = bool(status.get("ok")) and publish_allowed and data_allowed and (visibility in ("PUBLIC", "PRIVATE"))

    fixes = []
    for x in status.get("issues", []):
        if x == "mode_missing_or_invalid":
            fixes.append('Set run.mode to "PILOT" or "SYSTEM"')
        elif x == "app_id_missing":
            fixes.append('Set run.app_id (example: "curriculum")')
        elif x == "site_missing":
            fixes.append('Set run.site (example: "gladden_community_center")')
        elif x == "start_ts_missing":
            fixes.append('Set run.start_ts (example: "2026-01-13T00:00:00Z")')
        elif x == "end_ts_missing":
            fixes.append('Set run.end_ts (example: "2026-01-20T00:00:00Z")')

    out = {
        "ok": True,
        "run_id": rid,
        "published": published,
        "can_publish": can_publish,
        "policy": {
            "mode": (policy.get("mode") or (run_obj.get("mode") if isinstance(run_obj, dict) else None)),
            "visibility": visibility,
            "data_allowed": data_allowed,
            "publish_allowed": publish_allowed,
            "funding_frame": policy.get("funding_frame"),
            "audit_required": bool(policy.get("audit_required", True)),
        },
        "required_fields": status,
        "fixes": fixes,
        "proof": proof,
        "urls": {
            "report": f"http://127.0.0.1:8090/runs/report/{rid}",
            "pdf": f"http://127.0.0.1:8090/runs/report/{rid}/pdf",
            "proof": f"http://127.0.0.1:8090/runs/report/{rid}/proof",
            "verify": f"http://127.0.0.1:8090/runs/report/{rid}/verify",
            "publish": f"http://127.0.0.1:8090/runs/reports/{rid}/publish",
            "published_report": f"http://127.0.0.1:8090/runs/published/{rid}",
            "published_pdf": f"http://127.0.0.1:8090/runs/published/{rid}/pdf",
            "published_proof": f"http://127.0.0.1:8090/runs/published/{rid}/proof",
        },
    }
    return JSONResponse(out)
@router.post("/reports/{run_id}/publish", dependencies=[Depends(require_admin_key)])
def publish_report(run_id: str, x_force: str | None = Header(default=None), x_force_reason: str | None = Header(default=None)):
    import json
    from pathlib import Path
    from fastapi import HTTPException
    from fastapi.responses import JSONResponse
    from datetime import datetime, timezone

    rid = _rid(run_id)
    _append_audit({"event": "publish_attempt", "run_id": rid})

    base = _service_root()
    runs_dir = base / "registry" / "runs"
    pub_dir = base / "registry" / "published" / rid
    pub_dir.mkdir(parents=True, exist_ok=True)

    run_file = runs_dir / f"{rid}.json"
    if not run_file.exists():
        raise HTTPException(status_code=404, detail={"ok": False, "error": "run_not_found", "run_id": rid})

    run_doc = json.loads(run_file.read_text(encoding="utf-8"))
    policy = run_doc.get("policy") if isinstance(run_doc.get("policy"), dict) else {}
    visibility = (policy.get("visibility") or "PRIVATE").upper()

    meta_check = _policy_check_run_meta(run_doc)
    issues = list(meta_check.get("issues") or [])

    force_requested = ((x_force or "").strip().lower() in ("1","true","yes","on"))
    forced, issues, force_meta = apply_force(issues, force_requested, x_force_reason)
    if force_requested:
        append_force_event({"event":"force_request","run_id":rid,"reason":force_meta.get("force_reason"),"enabled":force_meta.get("force_enabled"),"forced":bool(force_meta.get("forced")),"overridden":force_meta.get("force_overridden"),"kept":force_meta.get("force_kept")})

    # Publish requires PUBLIC visibility (hard rule)
    if visibility != "PUBLIC":
        issues.append("visibility_not_public")

    if issues:
        raise HTTPException(status_code=403, detail={"ok": False, "error": "policy_blocked", "run_id": rid, "issues": issues})

    proof_path = pub_dir / "proof.json"
    if proof_path.exists():
        proof = json.loads(proof_path.read_text(encoding="utf-8"))
        raise HTTPException(status_code=409, detail={"ok": False, "error": "already_published", "run_id": rid, "proof": proof})

    # Build report + pdf bytes using existing helpers
    report_obj = _build_report_object(rid, limit=5000, since=None)
    report_sha = _sha256_json(report_obj)

    pdf_bytes = _build_report_pdf_bytes(report_obj)
    pdf_sha = _sha256_pdf_bytes(pdf_bytes)

    (pub_dir / "report.json").write_text(json.dumps(report_obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (pub_dir / "report.pdf").write_bytes(pdf_bytes)

    published_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    proof = {
        "ok": True,
        "run_id": rid,
        "published_at": published_at,
        "report_sha256": report_sha,
        "pdf_sha256": pdf_sha,
        "forced": bool(forced),
        "force": force_meta,
        "urls": {
            "report": f"http://127.0.0.1:8090/runs/published/{rid}",
            "pdf": f"http://127.0.0.1:8090/runs/published/{rid}/pdf",
            "proof": f"http://127.0.0.1:8090/runs/published/{rid}/proof"
        }
    }

    proof_path.write_text(json.dumps(proof, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    run_doc["published_at"] = published_at
    run_doc["published"] = {"report_sha256": report_sha, "pdf_sha256": pdf_sha, "urls": proof["urls"]}
    run_file.write_text(json.dumps(run_doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    _append_audit({"event": "publish", "run_id": rid, "ts": published_at, "report_sha256": report_sha, "pdf_sha256": pdf_sha})

    return JSONResponse(proof)

@router.get("/published/{run_id}")
def published_report(run_id: str):
    import json
    from fastapi.responses import Response
    from fastapi import HTTPException

    rid = _rid(run_id)
    fp = _service_root() / "registry" / "published" / rid / "report.json"
    if not fp.exists():
        raise HTTPException(status_code=404, detail={"ok": False, "error": "published_not_found", "run_id": rid})
    return Response(fp.read_text(encoding="utf-8"), media_type="application/json")

@router.get("/published/{run_id}/pdf")
def published_pdf(run_id: str):
    from fastapi.responses import Response
    from fastapi import HTTPException

    rid = _rid(run_id)
    fp = _service_root() / "registry" / "published" / rid / "report.pdf"
    if not fp.exists():
        raise HTTPException(status_code=404, detail={"ok": False, "error": "published_not_found", "run_id": rid})
    return Response(fp.read_bytes(), media_type="application/pdf")

@router.get("/published/{run_id}/proof")
def published_proof(run_id: str):
    from fastapi.responses import Response
    from fastapi import HTTPException

    rid = _rid(run_id)
    fp = _service_root() / "registry" / "published" / rid / "proof.json"
    if not fp.exists():
        raise HTTPException(status_code=404, detail={"ok": False, "error": "published_not_found", "run_id": rid})
    return Response(fp.read_text(encoding="utf-8"), media_type="application/json")

from fastapi import Request

@router.get("/public/{run_id}")
def runs_public(request: Request, run_id: str):
    base = Path(__file__).resolve().parents[1]
    reg = base / "registry"
    run_file = reg / "runs" / f"{run_id}.json"

    pub_dir = reg / "published" / run_id
    pub_report = pub_dir / "report.json"
    pub_pdf = pub_dir / "report.pdf"
    pub_proof = pub_dir / "proof.json"

    origin = str(request.base_url).rstrip("/")

    live_urls = {
        "report": f"{origin}/runs/report/{run_id}",
        "pdf": f"{origin}/runs/report/{run_id}/pdf",
        "proof": f"{origin}/runs/report/{run_id}/proof",
        "verify": f"{origin}/runs/report/{run_id}/verify"
    }

    if not run_file.exists() and not pub_dir.exists():
        raise HTTPException(status_code=404, detail={"ok": False, "error": "run_not_found", "run_id": run_id})

    published_ok = pub_report.exists() and pub_pdf.exists() and pub_proof.exists()

    out = {"ok": True, "run_id": run_id, "published": bool(published_ok), "urls": live_urls}

    if published_ok:
        out["urls"] = {
            "report": f"{origin}/runs/published/{run_id}",
            "pdf": f"{origin}/runs/published/{run_id}/pdf",
            "proof": f"{origin}/runs/published/{run_id}/proof"
        }

    return out