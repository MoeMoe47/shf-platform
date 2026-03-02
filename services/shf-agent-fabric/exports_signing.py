from __future__ import annotations
import base64, hashlib, json, os
from datetime import datetime, timezone
from typing import Any, Dict, Tuple
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

def _b64d(s: str) -> bytes:
    return base64.b64decode(s.encode("ascii"))

def _b64e(b: bytes) -> str:
    return base64.b64encode(b).decode("ascii")

def _canonical(obj: Dict[str, Any]) -> bytes:
    s = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return s.encode("utf-8")

def _sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _get_private():
    key_b64 = os.getenv("SHF_EXPORT_SIGNING_PRIVATE_KEY_B64")
    if not key_b64:
        raise RuntimeError("Missing SHF_EXPORT_SIGNING_PRIVATE_KEY_B64")
    return Ed25519PrivateKey.from_private_bytes(_b64d(key_b64))

def _get_public():
    key_b64 = os.getenv("SHF_EXPORT_SIGNING_PUBLIC_KEY_B64")
    if not key_b64:
        raise RuntimeError("Missing SHF_EXPORT_SIGNING_PUBLIC_KEY_B64")
    return Ed25519PublicKey.from_public_bytes(_b64d(key_b64))

def sign_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    priv = _get_private()
    canonical = _canonical(payload)
    h = _sha256_hex(canonical)
    sig = priv.sign(canonical)

    return {
        "key_id": os.getenv("SHF_EXPORT_SIGNING_KEY_ID", "shf-ed25519-v1"),
        "alg": "ed25519",
        "issued_at_utc": datetime.now(timezone.utc).isoformat(),
        "canonical_sha256": h,
        "signature_b64": _b64e(sig),
    }

def verify_payload(payload: Dict[str, Any], signature_b64: str) -> Tuple[bool, str]:
    canonical = _canonical(payload)
    h = _sha256_hex(canonical)
    pub = _get_public()
    try:
        pub.verify(_b64d(signature_b64), canonical)
        return True, h
    except Exception:
        return False, h
