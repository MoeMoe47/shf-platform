# Pilot Environment Configuration Specification

| Field | Development | Pilot Acceptance/UAT | Production Pilot |
|---|---|---|---|
| Environment identifier | TBD | TBD | TBD |
| Organization/tenant | Synthetic/test only until county approval | TBD | TBD |
| URL/base host | TBD | TBD | TBD |
| Database reference | Isolated disposable/reference | TBD | TBD |
| Secret-store reference | No production secrets | TBD | TBD |
| Logging destination | Development audit log | TBD | TBD |
| Classification ceiling | Restrictive | TBD | TBD |
| Public Disclosure | OFF | OFF until approved | OFF until approved |
| AI | Limited/test governed | TBD | TBD |
| Reporting | Test artifacts | TBD | TBD |
| Source connections | OFF | OFF until approved | OFF until GO |
| Backup/rollback | Documented local strategy | TBD | TBD |
| Monitoring | Development health checks | TBD | TBD |

Promotion states are `PLANNED → CONFIGURED → SECURITY_REVIEW → UAT_READY → UAT_ACCEPTED → PRODUCTION_PILOT_APPROVED → ACTIVE`. No state may be skipped without an authorized waiver.
