from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware

from auth.config import is_production


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
        response.headers.setdefault("Content-Security-Policy", "frame-ancestors 'self'")
        if request.url.path.startswith("/auth"):
            response.headers["Cache-Control"] = "no-store"
        if is_production():
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

