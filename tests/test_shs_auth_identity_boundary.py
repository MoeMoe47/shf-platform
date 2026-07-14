from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_admin_routes_do_not_use_localstorage_identity_authority():
    admin_routes = text("src/router/AdminRoutes.jsx")
    assert "getCurrentIdentity" not in admin_routes
    assert "localStorage.setItem" not in admin_routes
    assert "useAuthContext" in admin_routes
    assert "/ops/identity-access" in admin_routes


def test_auth_context_has_no_demo_admin_fallback_or_token_storage():
    auth_context = text("src/auth/auth-context.jsx")
    assert "createLocalDevAuthSession" not in auth_context
    assert "mergeRolePermissions([\"super_admin\"])" not in auth_context
    assert "localStorage.setItem" not in auth_context
    assert "fetchCurrentIdentity" in auth_context


def test_login_page_posts_to_backend_instead_of_saving_identity_session():
    login = text("src/pages/auth/SHSLoginPage.jsx")
    assert "saveIdentitySession" not in login
    assert "clearIdentitySession" not in login
    assert "auth.login" in login
    assert "HttpOnly session cookie" in login


def test_demo_identity_is_explicitly_gated_and_not_production_default():
    config = text("src/system/identity/authConfig.js")
    backend_config = text("services/shf-agent-fabric/auth/config.py")
    assert "VITE_SHS_DEMO_IDENTITY_ENABLED" in config
    assert "!isProductionBuild()" in config
    assert 'AUTH_DEMO_IDENTITY_ENABLED", "0"' in backend_config
    assert "forbidden in production" in backend_config


def test_docs_record_zero_dangerous_flags_and_no_boundary_mutation():
    report = json.loads(text("docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1.json"))
    assert report["dangerous_flags"]["enabled_count"] == 0
    assert report["shs_shf_boundary"]["result"] == "PASS"
    assert report["v1_complete"] is True
    combined = text("docs/SHS_PRODUCTION_AUTH_IDENTITY_HARDENING_V1.md")
    assert "does not mutate SHF Impact Data" in combined
    assert "does not mark public_approved" in combined
