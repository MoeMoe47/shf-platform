from __future__ import annotations

import hashlib
import hmac
import os


def hash_password(password: str, salt: str) -> str:
    rounds = int(os.getenv("AUTH_PBKDF2_ROUNDS", "210000"))
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), rounds)
    return f"pbkdf2_sha256${rounds}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, rounds, salt, expected = stored.split("$", 3)
    except ValueError:
        return False
    if scheme != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(rounds))
    return hmac.compare_digest(digest.hex(), expected)

