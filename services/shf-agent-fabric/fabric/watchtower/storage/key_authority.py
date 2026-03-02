from __future__ import annotations

import os
from typing import Dict

class KeyAuthorityError(RuntimeError):
    pass

def key_authority_mode() -> str:
    # kms | secret_manager | vault | env (dev only)
    return (os.getenv("SHF_KEY_AUTHORITY", "env") or "env").strip().lower()

def load_hmac_keyring() -> Dict[str, str]:
    """
    Contract:
      returns {kid: secret} for verifier selection by kid.
    PROD expectation:
      - SHF_KEY_AUTHORITY != 'env'
      - secrets are fetched from KMS/Secret Manager/Vault
    DEV fallback:
      - SHF_ATTEST_KEYRING_JSON='{"k1":"secret"}'
    """
    mode = key_authority_mode()

    if mode == "env":
        raw = (os.getenv("SHF_ATTEST_KEYRING_JSON", "") or "").strip()
        if not raw:
            raise KeyAuthorityError("KEYRING_MISSING: set SHF_ATTEST_KEYRING_JSON (dev) or configure KMS/Secret Manager (prod)")
        # parse JSON safely in attestation.py (single canonical parser lives there)
        # Here we just pass-through; attestation.py should be source of truth.
        return {"__ENV_JSON__": raw}  # sentinel; attestation.py will parse

    # Scaffold placeholders (wire later):
    if mode in ("kms", "secret_manager", "vault"):
        raise KeyAuthorityError(f"KEY_AUTHORITY_NOT_WIRED: mode={mode} (scaffold present; implement fetch in key_authority.py)")
    raise KeyAuthorityError(f"KEY_AUTHORITY_BAD_MODE: {mode}")
