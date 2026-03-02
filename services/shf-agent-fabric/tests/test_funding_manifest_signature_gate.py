from __future__ import annotations

import base64
import json

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def _stable_json(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")


def test_manifest_endpoint_exists_and_signature_verifies() -> None:
    r = client.get("/api/funding/manifest")
    assert r.status_code == 200
    doc = r.json()

    assert doc.get("schema_version") == "AIM_SIGNED_RULESET_MANIFEST_V1"
    manifest = doc.get("manifest")
    assert isinstance(manifest, dict)
    assert manifest.get("schema_version") == "AIM_RULESET_MANIFEST_V1"
    assert isinstance(manifest.get("items"), list)

    sig = base64.b64decode(doc["signature_b64"])
    pub = base64.b64decode(doc["public_key_b64"])
    payload = _stable_json(manifest)

    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, payload)
