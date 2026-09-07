# Initial County Pilot Change Delta

Baseline: `gpa-v1-accepted-2026-09-06` / `72071116b4bbf9d6ad687fe8fe41282221a4af0c` / migration `105`.

| Expected change | Classification | Frozen boundary affected | Migration/AI/security/reporting impact | Status |
|---|---|---|---|---|
| Program configuration | CONFIGURATION / EXTENSIBLE | None expected | None expected | TBD |
| Provider configuration | CONFIGURATION / EXTENSIBLE | None expected | None expected | TBD |
| Source systems and mappings | CONFIGURATION / EXTENSIBLE | Source/Data Use controls apply | Connector review required | TBD |
| Data Use Policies | CONFIGURATION / EXTENSIBLE | Must preserve canonical policy | Legal/security review | TBD |
| Credential references | CONFIGURATION / EXTENSIBLE | Secret boundary preserved | No secret values in repo | TBD |
| Users and roles | CONFIGURATION / EXTENSIBLE | Identity/org/tenant boundary preserved | Security review | TBD |
| Report branding/templates | CONFIGURATION / EXTENSIBLE | Reporting authority preserved | Report regression | TBD |
| Organization/Tenant configuration | CONFIGURATION / EXTENSIBLE | Canonical authority preserved | Scope/security review | BLOCKED_EXTERNAL |
| User/role assignments | CONFIGURATION / EXTENSIBLE | Permission authority preserved | MFA/least-privilege review | BLOCKED_EXTERNAL |
| Entitlement activation | CONFIGURATION / EXTENSIBLE | Existing entitlement authority | Activation evidence | BLOCKED_EXTERNAL |
| Environment configuration | CONFIGURATION / EXTENSIBLE | Frozen runtime unchanged | Isolation/security review | BLOCKED_EXTERNAL |
| County IdP/federation | EXTERNAL / POSSIBLE ADAPTER | No change expected initially | Identity/security review | BLOCKED_EXTERNAL |
| Connector adapter | POSSIBLE CODE ADAPTER | None expected initially | Explicit delta review required | TBD |

Frozen-core change: **NONE EXPECTED**. Any exception requires the change-control rule from the frozen package.
