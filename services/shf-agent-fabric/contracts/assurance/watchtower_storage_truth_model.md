# Watchtower Storage Truth Model (Locked)

## One source of truth
- **Postgres = truth + API**
- **Object storage = immutable audit archive**
- **KMS/Secret Manager = key authority**

## One direction of flow (no backwrites)
Snapshots → Root → Attestation → Append-only DB row → Nightly immutable export → Monitor verifies

## Enforcement expectations
- Postgres tables are **append-only** (UPDATE/DELETE blocked)
- Exports produce **JSONL + manifest hash**
- Integrity monitor re-hashes recent windows and raises alerts on mismatch

## Env flags (scaffold)
- WATCHTOWER_STORE_BACKEND=sqlite|postgres
- WATCHTOWER_PG_DSN=postgresql://...
- SHF_KEY_AUTHORITY=env|kms|secret_manager|vault
- SHF_AUDIT_EXPORT_DIR=services/shf-agent-fabric/var/audit_exports
- SHF_INTEGRITY_WINDOW=500
