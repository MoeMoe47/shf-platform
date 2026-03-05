from __future__ import annotations

import base64
import hashlib
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Uses the same dir discovery as middleware for consistency.
from fabric.funding.middleware_ruleset_sha import _candidate_ruleset_dirs, _find_ruleset_file


def _sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _stable_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def build_manifest() -> Dict[str, Any]:
    """
    Canonical manifest of all ruleset JSON files:
    { schema_version, count, items:[{filename, sha256}], status }
    """
    files: List[Path] = []
    seen = set()

    for d in _candidate_ruleset_dirs():
        if not d.exists() or not d.is_dir():
            continue
        for p in sorted(d.glob("*.json")):
            key = str(p.resolve())
            if key in seen:
                continue
            seen.add(key)
            files.append(p)

    items = []
    for p in sorted(files, key=lambda x: x.name):
        items.append({"filename": p.name, "sha256": _sha256_bytes(p.read_bytes())})

    return {
        "schema_version": "AIM_RULESET_MANIFEST_V1",
        "status": "active",
        "count": len(items),
        "items": items,
    }


def _load_or_generate_keypair() -> Tuple[bytes, bytes]:
    """
    Returns (private_key_raw_32, public_key_raw_32)

    Priority:
      1) FUNDING_MANIFEST_ED25519_PRIVATE_B64 (raw 32 bytes, base64)
      2) services/shf-agent-fabric/var/keys/funding_manifest_ed25519_private.b64
      3) generate and write to var/keys (git-ignored recommended)
    """
    b64 = os.getenv("FUNDING_MANIFEST_ED25519_PRIVATE_B64", "").strip()
    keyfile = Path(__file__).resolve().parents[3] / "var" / "keys" / "funding_manifest_ed25519_private.b64"
    keyfile.parent.mkdir(parents=True, exist_ok=True)

    if not b64 and keyfile.exists():
        b64 = keyfile.read_text(encoding="utf-8").strip()

    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization
    except Exception as e:
        raise RuntimeError(
            "cryptography is required for ed25519 signing. Install: pip install cryptography"
        ) from e

    if b64:
        raw = base64.b64decode(b64)
        if len(raw) != 32:
            raise ValueError("Private key must be raw 32 bytes (base64-encoded).")
        priv = Ed25519PrivateKey.from_private_bytes(raw)
    else:
        priv = Ed25519PrivateKey.generate()
        raw = priv.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption(),
        )
        keyfile.write_text(base64.b64encode(raw).decode("utf-8"), encoding="utf-8")

    pub = priv.public_key()
    pub_raw = pub.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )

    priv_raw = priv.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return priv_raw, pub_raw


def sign_manifest(manifest: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns:
      {
        schema_version, manifest, manifest_sha256, signature_b64, public_key_b64
      }
    """
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    except Exception as e:
        raise RuntimeError(
            "cryptography is required for ed25519 signing. Install: pip install cryptography"
        ) from e

    priv_raw, pub_raw = _load_or_generate_keypair()
    priv = Ed25519PrivateKey.from_private_bytes(priv_raw)

    payload = _stable_json(manifest).encode("utf-8")
    sig = priv.sign(payload)

    return {
        "schema_version": "AIM_SIGNED_RULESET_MANIFEST_V1",
        "manifest": manifest,
        "manifest_sha256": _sha256_bytes(payload),
        "signature_b64": base64.b64encode(sig).decode("utf-8"),
        "public_key_b64": base64.b64encode(pub_raw).decode("utf-8"),
        "note": "Verify by ed25519(public_key).verify(signature, stable_json(manifest))",
    }

# -------------------------------------------------------------------
# Compatibility shim (Top-1% stability)
# Routers may import: from fabric.funding.manifest_signed import get_signed_manifest
# This alias prevents ImportError if the canonical function name differs.
# -------------------------------------------------------------------
def get_signed_manifest():
    """
    Return the signed ruleset manifest produced by this module.

    Compatibility alias: resolves imports without forcing refactors.
    """
    # Prefer any existing "signed manifest" builders
    for name in (
        "get_signed_ruleset_manifest",
        "signed_manifest",
        "build_signed_manifest",
        "generate_signed_manifest",
        "make_signed_manifest",
        "create_signed_manifest",
    ):
        fn = globals().get(name)
        if callable(fn):
            return fn()

    # Fallback: unsigned builder + signer pattern
    get_m = globals().get("get_manifest") or globals().get("build_manifest") or globals().get("generate_manifest")
    sign  = globals().get("sign_manifest") or globals().get("sign") or globals().get("sign_ed25519")
    if callable(get_m):
        m = get_m()
        if callable(sign):
            return sign(m)
        return m

    raise RuntimeError("manifest_signed.py: no manifest builder found for get_signed_manifest()")
