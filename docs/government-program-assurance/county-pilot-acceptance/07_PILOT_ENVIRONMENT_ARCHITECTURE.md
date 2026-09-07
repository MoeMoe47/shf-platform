# Pilot Environment Architecture

## Frozen Accepted Baseline

Git tag: `gpa-v1-accepted-2026-09-06`
Commit: `72071116b4bbf9d6ad687fe8fe41282221a4af0c`
Migration: `105`

## Environments

| Environment | Purpose | Data boundary | Status |
|---|---|---|---|
| Development | County-specific configuration and adapter work | Synthetic/redacted only | NOT_STARTED |
| Pilot Acceptance/UAT | Controlled county acceptance | Approved UAT data only | NOT_STARTED |
| Production Pilot | Approved live pilot after GO decision | Approved production data | BLOCKED_EXTERNAL |

Branch convention: `county-pilot/<jurisdiction-or-agency>-acceptance`; do not create until identity is known. Use isolated databases, environment-specific secrets references, audit logging, backups, rollback, connector isolation, and strict fixture separation. No production data or credentials are connected in Phase 0.
