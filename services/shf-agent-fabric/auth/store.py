from __future__ import annotations

from dataclasses import dataclass

from auth.passwords import hash_password, verify_password
from auth.permissions import ROLE_CLIENT, ROLE_CLIENT_ADMIN, ROLE_SHS_ADMIN, normalize_role

FIXTURE_PASSWORD = "demo-password"


@dataclass(frozen=True)
class AuthUser:
    user_id: str
    email: str
    display_name: str
    role: str
    password_hash: str
    disabled: bool = False


def _fixture_user(user_id: str, email: str, display_name: str, role: str) -> AuthUser:
    return AuthUser(
        user_id=user_id,
        email=email,
        display_name=display_name,
        role=normalize_role(role),
        password_hash=hash_password(FIXTURE_PASSWORD, f"shs-bos-{user_id}"),
    )


_USERS = {
    "shs@demo.shs": _fixture_user("demo_shs_admin", "shs@demo.shs", "Avery Stone", ROLE_SHS_ADMIN),
    "admin@demo.shs": _fixture_user("demo_client_admin", "admin@demo.shs", "Morgan Reed", ROLE_CLIENT_ADMIN),
    "client@demo.shs": _fixture_user("demo_client", "client@demo.shs", "Jordan Ellis", ROLE_CLIENT),
    "disabled@demo.shs": AuthUser(
        user_id="disabled_demo_user",
        email="disabled@demo.shs",
        display_name="Disabled Demo",
        role=ROLE_CLIENT_ADMIN,
        password_hash=hash_password(FIXTURE_PASSWORD, "shs-bos-disabled"),
        disabled=True,
    ),
}


def find_user_by_email(email: str | None) -> AuthUser | None:
    return _USERS.get(str(email or "").strip().lower())


def authenticate_user(email: str | None, password: str | None) -> AuthUser | None:
    user = find_user_by_email(email)
    candidate = password or ""
    if not user:
        # Keep timing closer for nonexistent users without revealing existence.
        verify_password(candidate, _fixture_user("null", "null@demo.shs", "Null", ROLE_CLIENT).password_hash)
        return None
    if not verify_password(candidate, user.password_hash):
        return None
    return user


def list_sanitized_users() -> list[dict]:
    return [
        {
            "user_id": user.user_id,
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role,
            "disabled": user.disabled,
        }
        for user in _USERS.values()
    ]

