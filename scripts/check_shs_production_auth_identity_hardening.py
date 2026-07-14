#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "services/shf-agent-fabric/auth/config.py",
    "services/shf-agent-fabric/auth/routes.py",
    "services/shf-agent-fabric/auth/sessions.py",
    "services/shf-agent-fabric/auth/cookies.py",
    "services/shf-agent-fabric/auth/permissions.py",
    "services/shf-agent-fabric/auth/dependencies.py",
    "services/shf-agent-fabric/auth/csrf.py",
    "services/shf-agent-fabric/auth/rate_limit.py",
    "services/shf-agent-fabric/auth/audit.py",
    "services/shf-agent-fabric/auth/security_headers.py",
    "src/system/identity/authClient.js",
    "src/system/identity/authConfig.js",
    "src/system/identity/authStorageSafety.js",
    "src/system/identity/authRoutePolicy.js",
    "src/auth/auth-context.jsx",
    "src/pages/admin/identity-access/ShsIdentityAccessCenterPage.jsx",
    "src/pages/admin/identity-access/shsIdentityAccessCenter.css",
    "services/shf-agent-fabric/tests/test_auth_hardening.py",
    "tests/test_shs_auth_identity_boundary.py",
    "docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1.md",
    "docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1.json",
    "docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1_MANUAL_GOVERNANCE_REVIEW.md",
    "docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1_MANUAL_GOVERNANCE_REVIEW.json",
]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> int:
    errors: list[str] = []
    for rel in REQUIRED_FILES:
        require((ROOT / rel).exists(), f"missing required file: {rel}", errors)

    if errors:
        print("FAIL: SHS auth hardening validator")
        print("\n".join(errors))
        return 1

    main_py = read("services/shf-agent-fabric/main.py")
    auth_routes = read("services/shf-agent-fabric/auth/routes.py")
    auth_config = read("services/shf-agent-fabric/auth/config.py")
    auth_context = read("src/auth/auth-context.jsx")
    admin_routes = read("src/router/AdminRoutes.jsx")
    hub_access = read("src/system/identity/hubAccessControl.js")
    package_json = json.loads(read("package.json"))
    report = json.loads(read("docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1.json"))
    manual = json.loads(read("docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1_MANUAL_GOVERNANCE_REVIEW.json"))

    require("app.include_router(auth_router)" in main_py, "auth router is not mounted", errors)
    require("SecurityHeadersMiddleware" in main_py, "security headers middleware not installed", errors)
    require('allow_methods=["GET", "POST", "HEAD", "OPTIONS"]' in main_py, "CORS methods are not explicit", errors)
    require('allow_headers=["Content-Type", "X-CSRF-Token", "X-Admin-Key"]' in main_py, "CORS headers are not explicit", errors)
    require('allow_methods=["*"]' not in main_py, "wildcard CORS methods remain in main.py", errors)
    require('allow_headers=["*"]' not in main_py, "wildcard CORS headers remain in main.py", errors)

    for route in ["/auth/login", "/auth/logout", "/auth/me", "/auth/session/refresh", "/auth/session/revoke", "/auth/session/revoke-all"]:
        require(route.replace("/auth", "") in auth_routes, f"missing auth route implementation: {route}", errors)

    require("httponly=True" in read("services/shf-agent-fabric/auth/cookies.py"), "session cookie is not HttpOnly", errors)
    require("secure=settings.cookie_secure" in read("services/shf-agent-fabric/auth/cookies.py"), "session cookie secure flag not configurable", errors)
    require("AUTH_DEMO_IDENTITY_ENABLED" in auth_config, "demo identity production guard missing", errors)
    require("AUTH_ALLOWED_ORIGINS" in auth_config, "allowed origins config missing", errors)
    require("AUTH_COOKIE_SECURE must be true in production" in auth_config, "production cookie fail-closed check missing", errors)
    require("AUTH_DEMO_IDENTITY_ENABLED is forbidden in production" in auth_config, "production demo fail-closed check missing", errors)

    require("fetchCurrentIdentity" in auth_context, "frontend context does not fetch /auth/me", errors)
    require("createLocalDevAuthSession" not in auth_context, "frontend still creates local dev admin session", errors)
    require("getCurrentIdentity" not in admin_routes, "AdminRoutes still imports localStorage identity authority", errors)
    require("/ops/identity-access" in admin_routes, "identity access route missing", errors)
    require("/ops/identity-access" in hub_access, "identity access hub policy missing", errors)
    require('"check:shs-auth-hardening"' in json.dumps(package_json), "package script missing", errors)

    forbidden_source_tokens = [
        "public_approved = True",
        "publicApproved: true",
        "shf_impact_data_mutated: true",
        "localStorage.setItem(\"shsSessionToken\"",
        "localStorage.setItem(\"shsRefreshToken\"",
    ]
    combined = "\n".join(read(path) for path in [
        "src/auth/auth-context.jsx",
        "src/system/identity/authClient.js",
        "src/pages/auth/SHSLoginPage.jsx",
        "services/shf-agent-fabric/auth/routes.py",
    ])
    for token in forbidden_source_tokens:
        require(token not in combined, f"forbidden token found: {token}", errors)

    require(report.get("v1_complete") is True, "report JSON does not mark v1_complete true", errors)
    require(report.get("dangerous_flags", {}).get("enabled_count") == 0, "dangerous flags enabled in report", errors)
    require(manual.get("manual_review_complete") is True, "manual governance review incomplete", errors)
    require(not manual.get("v1_blockers"), "manual governance review has V1 blockers", errors)

    if errors:
        print("FAIL: SHS Production Authentication & Identity Hardening V1 validator")
        for item in errors:
            print(f"- {item}")
        return 1

    print("PASS: SHS Production Authentication & Identity Hardening V1 validator")
    return 0


if __name__ == "__main__":
    sys.exit(main())
