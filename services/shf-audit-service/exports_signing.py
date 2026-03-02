from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonicalize_json(obj: Dict[str, Any]) -> bytes:
    s = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return s.encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def b64e(b: bytes) -> str:
    return base64.b64encode(b).decode("ascii")


def b64d(s: str) -> bytes:
    return base64.b64decode(s.encode("ascii"))


def _require_env(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        raise RuntimeError(f"Missing env var: {name}")
    return v


def _get_private_key() -> Ed25519PrivateKey:
    priv_b64 = _require_env("SHF_EXPORT_SIGNING_PRIVATE_KEY_B64")
    raw = b64d(priv_b64)
    if len(raw) != 32:
        raise RuntimeError("SHF_EXPORT_SIGNING_PRIVATE_KEY_B64 must be raw 32-byte Ed25519 private key (base64).")
    return Ed25519PrivateKey.from_private_bytes(raw)


def _get_public_key() -> Ed25519PublicKey:
    pub_b64 = _require_env("SHF_EXPORT_SIGNING_PUBLIC_KEY_B64")
    raw = b64d(pub_b64)
    if len(raw) != 32:
        raise RuntimeError("SHF_EXPORT_SIGNING_PUBLIC_KEY_B64 must be raw 32-byte Ed25519 public key (base64).")
    return Ed25519PublicKey.from_public_bytes(raw)


def sign_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    key_id = os.environ.get("SHF_EXPORT_SIGNING_KEY_ID", "shf-ed25519-v1")
    alg = "Ed25519"
    issued_at_utc = _utc_now_iso()

    canonical = canonicalize_json(payload)
    h = sha256_hex(canonical)

    priv = _get_private_key()
    sig = priv.sign(canonical)

    return {
        "key_id": key_id,
        "alg": alg,
        "issued_at_utc": issued_at_utc,
        "canonical_sha256": h,
        "signature_b64": b64e(sig),
    }


def verify_payload(payload: Dict[str, Any], signature_b64: str) -> Tuple[bool, str]:
    canonical = canonicalize_json(payload)
    h = sha256_hex(canonical)

    pub = _get_public_key()
    try:
        pub.verify(b64d(signature_b64), canonical)
        return True, h
    except Exception:
        return False, h


def generate_keypair_b64() -> Dict[str, str]:
    priv = Ed25519PrivateKey.generate()
    if hasattr(priv, "private_bytes_raw"):
        priv_raw = priv.private_bytes_raw()
        pub_raw = priv.public_key().public_bytes_raw()
    else:
        priv_raw = priv.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption(),
        )
        pub_raw = priv.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
    return {
        "key_id": "shf-ed25519-v1",
        "private_b64": b64e(priv_raw),
        "public_b64": b64e(pub_raw),
    }
