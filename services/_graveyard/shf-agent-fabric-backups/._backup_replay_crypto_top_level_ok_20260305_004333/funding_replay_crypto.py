from __future__ import annotations

from typing import Any, Optional
from pathlib import Path
import uuid

from fastapi import APIRouter, HTTPException, Request

from fabric.funding.middleware_ruleset_sha import _find_ruleset_file, _sha256_bytes
from fabric.funding.manifest_signed import get_signed_manifest

try:
    # preferred: durable journal API if present
    from fabric.funding.journal.decision_journal import journal_append, journal_get  # type: ignore
    HAVE_JOURNAL = True
except Exception:
    HAVE_JOURNAL = False
    _JOURNAL: dict[str, dict[str, Any]] = {}

router = APIRouter(prefix="/api/funding", tags=["funding_replay_crypto"])


def _sha256_file(fp: Path) -> str:
    return _sha256_bytes(fp.read_bytes())


def _journal_append(doc: dict[str, Any]) -> str:
    if HAVE_JOURNAL:
        return journal_append(doc)  # type: ignore[name-defined]
    decision_id = str(uuid.uuid4())
    _JOURNAL[decision_id] = dict(doc)
    return decision_id


def _journal_get(decision_id: str) -> Optional[dict[str, Any]]:
    if HAVE_JOURNAL:
        return journal_get(decision_id)  # type: ignore[name-defined]
    return _JOURNAL.get(decision_id)


@router.post("/replay/decisions_crypto")
async def record_crypto(request: Request) -> dict[str, Any]:
    """
    Records a decision with:
      - ruleset file sha256 (if ruleset_filename provided and found)
      - signed manifest hash + signature + public key (from get_signed_manifest)
    """
    payload = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="payload must be a JSON object")

    # 1) Ruleset sha from actual file bytes
    ruleset_filename = (payload.get("ruleset_filename") or payload.get("filename") or "").strip()
    if ruleset_filename:
        fp = _find_ruleset_file(ruleset_filename)
        if fp is None:
            raise HTTPException(status_code=400, detail=f"ruleset file not found: {ruleset_filename}")
        payload["ruleset_filename"] = ruleset_filename
        payload["ruleset_sha256"] = _sha256_file(fp)

    # 2) Signed manifest stamps
    signed = get_signed_manifest()
    payload["manifest_sha256"] = signed.get("manifest_sha256")
    payload["manifest_signature_b64"] = signed.get("signature_b64")
    payload["manifest_public_key_b64"] = signed.get("public_key_b64")

    decision_id = _journal_append(payload)
    return {"decision_id": decision_id}


@router.get("/replay/crypto/{decision_id}")
async def replay_crypto(decision_id: str) -> dict[str, Any]:
    """
    Returns the stored decision + verification block:
      - ruleset_ok (hash matches file)
      - manifest_ok (hash matches current signed manifest hash)
      - signature_present (signature + pubkey exist)
    """
    doc = _journal_get(decision_id)
    if not doc:
        raise HTTPException(status_code=404, detail="decision_id not found")

    verified = {"ruleset_ok": None, "manifest_ok": None, "signature_present": None}

    # Verify ruleset file hash
    try:
        filename = (doc.get("ruleset_filename") or "").strip()
        sha = (doc.get("ruleset_sha256") or "").strip()
        if filename and sha:
            fp = _find_ruleset_file(filename)
            verified["ruleset_ok"] = (fp is not None and _sha256_file(fp) == sha)
        elif filename and not sha:
            verified["ruleset_ok"] = False
    except Exception:
        verified["ruleset_ok"] = False

    # Verify manifest hash matches current signed manifest
    try:
        signed = get_signed_manifest()
        verified["manifest_ok"] = (doc.get("manifest_sha256") == signed.get("manifest_sha256"))
        verified["signature_present"] = bool(signed.get("signature_b64") and signed.get("public_key_b64"))
    except Exception:
        verified["manifest_ok"] = False
        verified["signature_present"] = False

    out = dict(doc)
    out["decision_id"] = decision_id
    out["verified"] = verified
    return out
