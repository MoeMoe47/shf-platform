from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def _stable_json(obj: Any) -> str:
    # Deterministic JSON for hashing
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _ruleset_sha256(ruleset_obj: Any) -> Optional[str]:
    if not isinstance(ruleset_obj, dict):
        return None
    # hash the ruleset content excluding any existing sha fields
    clean = {k: v for k, v in ruleset_obj.items() if k not in ("sha256", "sha", "hash")}
    data = _stable_json(clean).encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def _attach_sha_in_place(node: Any) -> None:
    """
    Recursively walk JSON and attach sha256 to any list under a 'rulesets' key.
    This covers:
      - /api/funding/rulesets (top-level rulesets)
      - /api/funding/discovery (nested rulesets)
      - any future discovery shapes (partner-safe)
    """
    if isinstance(node, dict):
        # If this dict has rulesets, hash each element
        if "rulesets" in node and isinstance(node["rulesets"], list):
            for r in node["rulesets"]:
                if isinstance(r, dict):
                    r["sha256"] = _ruleset_sha256(r)
        # Recurse
        for v in node.values():
            _attach_sha_in_place(v)
    elif isinstance(node, list):
        for item in node:
            _attach_sha_in_place(item)


class RulesetShaMiddleware(BaseHTTPMiddleware):
    """
    Adds sha256 fields to rulesets for integrity / provenance:
      - /api/funding/rulesets
      - /api/funding/discovery
    Only mutates JSON responses, leaves non-JSON untouched.
    """

    async def dispatch(self, request: Request, call_next):
        resp: Response = await call_next(request)

        path = request.url.path
        if path not in ("/api/funding/rulesets", "/api/funding/discovery"):
            return resp

        ctype = (resp.headers.get("content-type") or "").lower()
        if "application/json" not in ctype:
            return resp

        # Read body
        body = b""
        async for chunk in resp.body_iterator:
            body += chunk

        # Parse JSON safely
        try:
            doc = json.loads(body.decode("utf-8"))
        except Exception:
            # If it isn't valid JSON, return original
            return Response(
                content=body,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.media_type,
            )

        # Attach sha recursively
        _attach_sha_in_place(doc)

        out = json.dumps(doc, ensure_ascii=False).encode("utf-8")

        # Return rebuilt response, preserve status + headers
        headers = dict(resp.headers)
        headers["content-length"] = str(len(out))
        return Response(
            content=out,
            status_code=resp.status_code,
            headers=headers,
            media_type="application/json",
        )
