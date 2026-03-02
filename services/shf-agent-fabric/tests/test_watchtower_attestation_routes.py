from __future__ import annotations

import os
from fastapi.testclient import TestClient

from main import app  # type: ignore


def test_watchtower_attestation_root_and_verify_roundtrip():
    # Key rotation model: two keys, active kid = k2
    os.environ["SHF_ATTEST_KEYRING_JSON"] = '{"k1":"oldsecret","k2":"newsecret"}'
    os.environ["SHF_ATTEST_ACTIVE_KID"] = "k2"

    client = TestClient(app)

    r = client.get("/watchtower/attest/root?program_ids=__manual_test__&top_n=1")
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert "payload" in data and "sig" in data
    assert data["payload"]["kid"] == "k2"

    v = client.post("/watchtower/attest/verify", json={"payload": data["payload"], "sig": data["sig"]})
    assert v.status_code == 200
    vd = v.json()
    assert vd.get("ok") is True
    assert vd.get("kid") == "k2"
