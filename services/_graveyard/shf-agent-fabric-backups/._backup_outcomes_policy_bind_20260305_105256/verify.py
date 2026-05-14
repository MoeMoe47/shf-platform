from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

# We reuse the existing submission store
from fabric.outcomes.store import get_submission_by_id


def _resolve_policy_meta() -> tuple[str, str]:
    """
    Resolve the active policy identifiers used for verification.
    Returns:
        (ruleset_sha256, manifest_fingerprint)
    """

    ruleset_sha256 = "UNKNOWN"
    manifest_fingerprint = "UNKNOWN"

    # Ruleset SHA
    try:
        from fabric.funding.ruleset_hash import attach_ruleset_sha256
        tmp = attach_ruleset_sha256({})
        rs = (tmp.get("ruleset_sha256") or "").strip()
        if rs:
            ruleset_sha256 = rs
    except Exception:
        pass

    # Manifest fingerprint
    try:
        import fabric.funding.manifest_signed as ms

        for name in (
            "get_manifest_fingerprint",
            "manifest_fingerprint",
            "current_manifest_fingerprint",
            "fingerprint",
        ):
            fn = getattr(ms, name, None)
            if callable(fn):
                val = fn()
                if isinstance(val, str) and val.strip():
                    manifest_fingerprint = val.strip()
                    break

        if manifest_fingerprint == "UNKNOWN":
            for cname in ("MANIFEST_FINGERPRINT", "MANIFEST_FP", "FINGERPRINT"):
                val = getattr(ms, cname, None)
                if isinstance(val, str) and val.strip():
                    manifest_fingerprint = val.strip()
                    break
    except Exception:
        pass

    return ruleset_sha256, manifest_fingerprint

VERIFIER_VERSION = "outcomes_verifier_v1"

def _canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def _safe_get_ruleset_and_manifest() -> Tuple[str, str]:
    """
    Best-effort integration with your funding contract layer.

    If a stable API exists in fabric.funding.* we use it.
    Otherwise we return UNKNOWN values (still deterministic + replayable),
    and you can tighten this to your exact manifest/ruleset getter next.
    """
    ruleset_sha = "UNKNOWN"
    manifest_fp = "UNKNOWN"

    # Try common names without assuming too much.
    # (We do NOT want this layer to break funding if imports change.)
    try:
        from fabric.funding.ruleset_hash import current_ruleset_sha256  # type: ignore
        v = current_ruleset_sha256()
        if isinstance(v, str) and v:
            ruleset_sha = v
    except Exception:
        pass

    try:
        from fabric.funding.manifest_signed import manifest_fingerprint  # type: ignore
        v = manifest_fingerprint()
        if isinstance(v, str) and v:
            manifest_fp = v
    except Exception:
        pass

    return ruleset_sha, manifest_fp

def compute_decision_hash(submission: Dict[str, Any], ruleset_sha256: str, manifest_fingerprint: str) -> str:
    # Ensure artifact_ids is stable (sorted)
    artifact_ids = submission.get("artifact_ids") or []
    artifact_ids_sorted = sorted(list(artifact_ids))

    payload = {
        "verifier": VERIFIER_VERSION,
        "submission": {
            "submission_id": submission["submission_id"],
            "idempotency_key": submission["idempotency_key"],
            "participant_id": submission["participant_id"],
            "program_id": submission["program_id"],
            "outcome_type": submission["outcome_type"],
            "evidence_root_hash": submission["evidence_root_hash"],
            "artifact_ids": artifact_ids_sorted,
        },
        "policy": {
            "ruleset_sha256": ruleset_sha256,
            "manifest_fingerprint": manifest_fingerprint,
        },
    }
    return sha256_hex(_canonical_json(payload))

def default_credit_for_outcome(outcome_type: str) -> int:
    """
    Pilot default credit rules (USD cents).
    Keep this deterministic and simple. You can wire this to your ruleset engine next.
    """
    table = {
        "JOB_90D": 250_00,       # $250.00
        "JOB_180D": 500_00,      # $500.00
        "CERT_EARNED": 150_00,   # $150.00
        "RECOVERY_30D": 100_00,  # $100.00
    }
    return int(table.get(outcome_type, 0))

@dataclass(frozen=True)
class VerificationResult:
    decision_hash: str
    status: str
    ruleset_sha256: str
    manifest_fingerprint: str
    amount_cents: int
    currency: str

def verify_submission(submission_id: str) -> VerificationResult:
    sub = get_submission_by_id(submission_id)
    if not sub:
        raise KeyError("submission not found")

    ruleset_sha, manifest_fp = _safe_get_ruleset_and_manifest()
    decision_hash = compute_decision_hash(sub, ruleset_sha, manifest_fp)

    # MVP: accept all submissions as VERIFIED if amount >= 0 (always true).
    # You will later gate this with evidence requirements + LOO scoring + policy.
    status = "VERIFIED"

    amount = default_credit_for_outcome(sub["outcome_type"])
    currency = "USD"

    return VerificationResult(
        decision_hash=decision_hash,
        status=status,
        ruleset_sha256=ruleset_sha,
        manifest_fingerprint=manifest_fp,
        amount_cents=amount,
        currency=currency,
    )

def replay_verify(submission_id: str, stored_decision_hash: str, stored_ruleset_sha256: str, stored_manifest_fingerprint: str) -> Dict[str, Any]:
    sub = get_submission_by_id(submission_id)
    if not sub:
        raise KeyError("submission not found")

    recomputed = compute_decision_hash(sub, stored_ruleset_sha256, stored_manifest_fingerprint)
    return {
        "submission_id": submission_id,
        "stored_decision_hash": stored_decision_hash,
        "recomputed_decision_hash": recomputed,
        "match": (recomputed == stored_decision_hash),
    }
