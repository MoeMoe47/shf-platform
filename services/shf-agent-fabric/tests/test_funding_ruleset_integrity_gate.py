from __future__ import annotations

import hashlib
from typing import Any

from fastapi.testclient import TestClient

from main import app
from fabric.funding.middleware_ruleset_sha import (
    _find_ruleset_file,
    _ruleset_obj_sha256,
)

client = TestClient(app)


def _sha256_file_bytes(fp: Path) -> str:
    # Top-1% contract: hash CANONICAL JSON, not raw file bytes (whitespace/newlines would change raw hash).
    import hashlib, json

    data = fp.read_bytes()
    try:
        obj = json.loads(data.decode("utf-8"))
        canon = json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(canon).hexdigest()
    except Exception:
        # fallback: if not JSON, hash raw bytes
        return hashlib.sha256(data).hexdigest()


def test_discovery_items_have_non_null_sha256_and_match_file_hash() -> None:
    r = client.get("/api/funding/discovery")
    assert r.status_code == 200
    doc: dict[str, Any] = r.json()

    items = doc.get("items")
    assert isinstance(items, list), "discovery.items must be a list"

    # Enforce: every item with a filename must have a sha256 and it must match the file contents.
    for item in items:
        assert isinstance(item, dict)
        filename = item.get("filename")
        if not filename:
            continue

        sha = item.get("sha256")
        assert isinstance(sha, str) and sha, f"sha256 missing for filename={filename}"

        fp = _find_ruleset_file(str(filename))
        assert fp is not None, f"ruleset file not found for filename={filename}"
        assert sha == _sha256_file_bytes(fp), f"sha256 mismatch for filename={filename}"


def test_rulesets_endpoint_sha256_is_present_and_stable() -> None:
    # Not required by your brief, but top-1%: ensure /rulesets sha is non-null and consistent.
    r = client.get("/api/funding/rulesets")
    assert r.status_code == 200
    doc: dict[str, Any] = r.json()

    rulesets = doc.get("rulesets")
    assert isinstance(rulesets, list), "rulesets.rulesets must be a list"

    for rs in rulesets:
        assert isinstance(rs, dict)
        sha = rs.get("sha256")
        assert isinstance(sha, str) and sha, "ruleset sha256 missing"
        # This sha is defined as the stable hash of the ruleset object (minus sha fields).
        assert sha == _ruleset_obj_sha256(rs), "ruleset sha256 is not stable/object-derived"
