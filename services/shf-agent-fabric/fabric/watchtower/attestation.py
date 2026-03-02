from __future__ import annotations

import datetime
import hashlib
import hmac
import json
import os
from typing import Any, Dict, Optional, Tuple, List


def _canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _env(name: str, default: str = "") -> str:
    return str(os.getenv(name, default) or "").strip()


def _now_utc_iso() -> str:
    # timezone-aware UTC timestamp (no deprecated utcnow)
    return datetime.datetime.now(datetime.UTC).isoformat().replace("+00:00", "Z")


def _load_keyring_from_env_or_file() -> Dict[str, str]:
    """
    Supports BOTH:
      1) Env-only:
         SHF_ATTEST_KEYRING_JSON='{"k1":"secret1","k2":"secret2"}'
      2) File-backed:
         SHF_ATTEST_KEYRING_PATH=/path/to/keyring.json
         File can be:
           a) {"k1":"secret","k2":"secret2"}
           b) {"active_kid":"k2","keys":{"k1":"secret","k2":"secret2"}}
    """
    raw = _env("SHF_ATTEST_KEYRING_JSON", "")
    if raw:
        try:
            kr = json.loads(raw)
        except Exception as e:
            raise RuntimeError(f"ATTEST_KEYRING_BAD_JSON: {type(e).__name__}: {e}")
        if isinstance(kr, dict):
            # allow either direct dict or {keys:{...}}
            if "keys" in kr and isinstance(kr.get("keys"), dict):
                kr = kr["keys"]
            out: Dict[str, str] = {}
            for k, v in kr.items():
                kid = str(k).strip()
                sec = str(v).strip()
                if kid and sec:
                    out[kid] = sec
            if not out:
                raise RuntimeError("ATTEST_KEYRING_INVALID: empty after normalize")
            return out
        raise RuntimeError("ATTEST_KEYRING_INVALID: must be JSON object")

    path = _env("SHF_ATTEST_KEYRING_PATH", "")
    if path:
        try:
            with open(path, "r", encoding="utf-8") as f:
                kr = json.load(f)
        except FileNotFoundError:
            raise RuntimeError(f"ATTEST_KEYRING_FILE_MISSING: {path}")
        except Exception as e:
            raise RuntimeError(f"ATTEST_KEYRING_FILE_BAD_JSON: {type(e).__name__}: {e}")

        if isinstance(kr, dict):
            if "keys" in kr and isinstance(kr.get("keys"), dict):
                kr = kr["keys"]
            out2: Dict[str, str] = {}
            for k, v in kr.items():
                kid = str(k).strip()
                sec = str(v).strip()
                if kid and sec:
                    out2[kid] = sec
            if not out2:
                raise RuntimeError("ATTEST_KEYRING_FILE_INVALID: empty after normalize")
            return out2

        raise RuntimeError("ATTEST_KEYRING_FILE_INVALID: must be JSON object")

    raise RuntimeError("ATTEST_KEYRING_MISSING: set SHF_ATTEST_KEYRING_JSON or SHF_ATTEST_KEYRING_PATH")


def load_keyring_or_die() -> Tuple[str, Dict[str, str]]:
    """
    Returns: (active_kid, keyring_dict)
    Active kid selection:
      - SHF_ATTEST_ACTIVE_KID, else lexicographically last kid (stable)
    """
    keyring = _load_keyring_from_env_or_file()

    active_kid = _env("SHF_ATTEST_ACTIVE_KID", "")
    if not active_kid:
        active_kid = sorted(keyring.keys())[-1]

    if active_kid not in keyring:
        raise RuntimeError(f"ATTEST_ACTIVE_KID_NOT_FOUND: {active_kid}")

    return active_kid, keyring


def sign_attestation_payload(payload: Dict[str, Any], *, kid: str, secret: str) -> str:
    msg = _canonical_json(payload).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return sig


def create_attestation(program_ids: Optional[List[str]] = None, top_n: int = 10) -> Dict[str, Any]:
    """
    Contract expected by tests/routes:
      returns dict with:
        payload: {..., kid: <active kid>}
        sig: <hex hmac>
    """
    active_kid, keyring = load_keyring_or_die()
    secret = keyring[active_kid]

    pids = [p.strip() for p in (program_ids or []) if str(p).strip()]
    created_utc = _now_utc_iso()

    # Simple deterministic root for now (can later bind to snapshot store/global chain root)
    root_material = _canonical_json({"created_utc": created_utc, "program_ids": pids, "top_n": int(top_n)})
    root_hash = _sha256_hex(root_material)

    payload: Dict[str, Any] = {
        "kid": active_kid,
        "created_utc": created_utc,
        "root_hash": root_hash,
        "program_ids": pids,
        "top_n": int(top_n),
        # auditor-friendly spot check sample (tips) without dumping full state
        "proof_tips": pids[: max(0, min(int(top_n), len(pids)))],
    }

    sig = sign_attestation_payload(payload, kid=active_kid, secret=secret)
    return {"payload": payload, "sig": sig}


def verify_attestation_payload(payload: Dict[str, Any], sig: str, **_ignore: Any) -> Dict[str, Any]:
    """
    Strict verifier: payload dict + sig string.
    Returns a stable response shape for routes/tests.
    """
    try:
        if not isinstance(payload, dict):
            return {"ok": False, "verified": False, "kid": None, "error": "payload_not_dict"}

        kid = str(payload.get("kid") or "").strip()
        if not kid:
            return {"ok": False, "verified": False, "kid": None, "error": "kid_missing_in_payload"}

        _active, keyring = load_keyring_or_die()
        if kid not in keyring:
            return {"ok": False, "verified": False, "kid": kid, "error": "kid_not_in_keyring"}

        expected = sign_attestation_payload(payload, kid=kid, secret=keyring[kid])
        verified = hmac.compare_digest(str(expected), str(sig))

        return {"ok": bool(verified), "verified": bool(verified), "kid": kid, "error": None if verified else "bad_sig"}
    except Exception as e:
        return {"ok": False, "verified": False, "kid": None, "error": f"{type(e).__name__}: {e}"}


def verify_attestation_signature(
    payload: Optional[Dict[str, Any]] = None,
    sig: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """
    Contract-HARD wrapper:
    - Supports verify_attestation_signature(payload=..., sig=...)
    - Also supports accidental call style verify_attestation_signature(**payload, sig="...")

    This prevents the recurring "unexpected keyword argument 'kid'" failures.
    """
    if payload is None:
        # Build payload from kwargs excluding signature fields
        payload = {k: v for k, v in kwargs.items() if k not in ("sig", "signature")}
    if sig is None:
        sig = str(kwargs.get("sig") or kwargs.get("signature") or "")

    return verify_attestation_payload(payload=payload, sig=sig)


