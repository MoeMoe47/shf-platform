from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def _stable_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _sha256_json_obj(obj: Any) -> str:
    return _sha256_bytes(_stable_json(obj).encode("utf-8"))


def _ruleset_obj_sha256(ruleset_obj: Any) -> Optional[str]:
    if not isinstance(ruleset_obj, dict):
        return None
    clean = {k: v for k, v in ruleset_obj.items() if k not in ("sha256", "sha", "hash")}
    return _sha256_json_obj(clean)


def _candidate_ruleset_dirs() -> list[Path]:
    """
    Try hard to find where ruleset JSON files live, without relying on app internals.
    Add more dirs here if you later move the file store.
    """
    here = Path(__file__).resolve()
    svc_root = here.parents[2]  # services/shf-agent-fabric
    return [
        svc_root / "fabric" / "funding" / "rulesets",
        svc_root / "fabric" / "funding" / "data",
        svc_root / "fabric" / "funding" / "fixtures",
        svc_root / "fabric" / "funding",
    ]


def _find_ruleset_file(filename: str) -> Optional[Path]:
    name = (filename or "").strip()
    if not name:
        return None

    # If an absolute/relative path was accidentally provided, try it.
    p = Path(name)
    if p.exists() and p.is_file():
        return p

    for d in _candidate_ruleset_dirs():
        cand = d / name
        if cand.exists() and cand.is_file():
            return cand

    return None


def _sha_for_discovery_item(item: Any) -> Optional[str]:
    """
    Compute sha256 for a discovery item by hashing its referenced JSON file (filename).
    - If file exists: hash its parsed JSON (stable)
    - If not: return None
    """
    if not isinstance(item, dict):
        return None

    filename = item.get("filename")
    if not filename:
        return None

    fp = _find_ruleset_file(str(filename))
    if not fp:
        return None

    try:
        raw = fp.read_bytes()
    except Exception:
        return None

    # Prefer hashing semantic JSON (stable) rather than raw bytes (whitespace/order issues).
    try:
        obj = json.loads(raw.decode("utf-8"))
        return _sha256_json_obj(obj)
    except Exception:
        # Fall back to raw bytes if file isn't clean JSON
        return _sha256_bytes(raw)


def _attach_sha_rulesets_endpoint(doc: Any) -> Any:
    """
    For /api/funding/rulesets:
    if doc has 'rulesets' list, attach sha256 per ruleset object.
    """
    if isinstance(doc, dict) and isinstance(doc.get("rulesets"), list):
        for r in doc["rulesets"]:
            if isinstance(r, dict):
                r["sha256"] = _ruleset_obj_sha256(r)
    return doc


def _attach_sha_discovery_endpoint(doc: Any) -> Any:
    """
    For /api/funding/discovery:
    attach sha256 per item, based on item['filename'] content hash.
    """
    if isinstance(doc, dict) and isinstance(doc.get("items"), list):
        for it in doc["items"]:
            if isinstance(it, dict):
                it["sha256"] = _sha_for_discovery_item(it)
    return doc


class RulesetShaMiddleware(BaseHTTPMiddleware):
    """
    Adds sha256 for integrity/provenance:
      - /api/funding/rulesets: sha256 per ruleset object
      - /api/funding/discovery: sha256 per discovery item (hash of referenced JSON file)
    """

    async def dispatch(self, request: Request, call_next):
        resp: Response = await call_next(request)

        path = request.url.path
        if path not in ("/api/funding/rulesets", "/api/funding/discovery"):
            return resp

        ctype = (resp.headers.get("content-type") or "").lower()
        if "application/json" not in ctype:
            return resp

        body = b""
        async for chunk in resp.body_iterator:
            body += chunk

        try:
            doc = json.loads(body.decode("utf-8"))
        except Exception:
            return Response(
                content=body,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.media_type,
            )

        if path == "/api/funding/rulesets":
            doc = _attach_sha_rulesets_endpoint(doc)
        else:
            doc = _attach_sha_discovery_endpoint(doc)

        out = json.dumps(doc, ensure_ascii=False).encode("utf-8")

        headers = dict(resp.headers)
        headers["content-length"] = str(len(out))
        return Response(
            content=out,
            status_code=resp.status_code,
            headers=headers,
            media_type="application/json",
        )
