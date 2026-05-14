from __future__ import annotations

import hashlib
import json
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


def _stable_json(obj: Any) -> str:
    # Deterministic JSON (no whitespace, stable key order)
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _attach_ruleset_sha(doc: Any) -> Any:
    """
    Adds sha256 to each ruleset item if doc contains:
      - {"rulesets": [ {..}, ... ]}   OR
      - {"data": {"rulesets": [..]}} (some APIs nest)
    We do not mutate non-dicts/lists.
    """
    def attach_list(rulesets: Any) -> None:
        if not isinstance(rulesets, list):
            return
        for r in rulesets:
            if isinstance(r, dict):
                # hash the ruleset object without any existing sha256 field
                raw = dict(r)
                raw.pop("sha256", None)
                r["sha256"] = _sha256_hex(_stable_json(raw))

    if isinstance(doc, dict):
        if "rulesets" in doc:
            attach_list(doc.get("rulesets"))
        if "data" in doc and isinstance(doc["data"], dict) and "rulesets" in doc["data"]:
            attach_list(doc["data"].get("rulesets"))
    return doc


class RulesetShaMiddleware(BaseHTTPMiddleware):
    """
    Post-processes JSON responses for:
      GET /api/funding/rulesets
      GET /api/funding/discovery
    Adds sha256 per ruleset element.
    """
    TARGETS = {"/api/funding/rulesets", "/api/funding/discovery"}

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if request.method.upper() != "GET" or path not in self.TARGETS:
            return await call_next(request)

        response = await call_next(request)

        ctype = (response.headers.get("content-type") or "").lower()
        if "application/json" not in ctype:
            return response

        # Consume the body safely (BaseHTTPMiddleware returns a streaming response)
        body = b""
        async for chunk in response.body_iterator:
            body += chunk

        try:
            doc = json.loads(body.decode("utf-8"))
        except Exception:
            # If it isn't valid JSON for any reason, pass through unchanged
            return response

        doc = _attach_ruleset_sha(doc)

        # Return a new JSONResponse. Keep status code.
        # (We intentionally do not preserve content-length; JSONResponse will set correctly.)
        return JSONResponse(status_code=response.status_code, content=doc)
