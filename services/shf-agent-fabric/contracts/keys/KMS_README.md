# SHF Key Authority (KMS/Secret Manager) — Plan

Goal: **no plaintext signing keys** in repo or long-lived env vars.

## Current (dev only)
- `SHF_ATTEST_KEYRING_JSON` and `SHF_ATTEST_ACTIVE_KID` are acceptable **only for local dev/tests**.

## Top 1% Production
- Key material stored in KMS/Secret Manager (AWS KMS + Secrets Manager / GCP KMS + Secret Manager / Azure Key Vault).
- App receives:
  - `SHF_ATTEST_KEYRING_REF` (a secret reference/ARN/path)
  - `SHF_ATTEST_ACTIVE_KID`
- On boot:
  - fetch secret JSON (kid->secret) from the manager
  - cache in memory
  - never log secrets

## Rotation
- Add new kid/secret in secret manager
- switch `ACTIVE_KID`
- keep old kids so old attestations remain verifiable
