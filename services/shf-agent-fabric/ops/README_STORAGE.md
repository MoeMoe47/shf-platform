# SHF Storage — One Source of Truth + Immutable Audit Archive

**Truth:** Postgres (API reads/writes here)  
**Immutable archive:** nightly JSONL export (object storage next)  
**Key authority:** KMS/Secret Manager (no plaintext keys)

**One direction of flow:**
Snapshots → Root → Attestation → Append-only DB row → Nightly immutable export → Monitor verifies
