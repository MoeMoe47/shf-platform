# Least-Privilege Acceptance

Use synthetic/test principals only. For every role, test one allowed route/API and one denied route/API, plus classification, Program/Provider scope, AI, and reporting boundaries.

| Principal | Allowed | Denied | Evidence |
|---|---|---|---|
| County Admin | Pilot settings within approved scope | Other tenant; restricted Investigation by default | Synthetic test report |
| Program Manager | Assigned Program and report | Other organization/provider | Synthetic test report |
| Provider User | Own response/evidence workflow | Finding determination and other provider | Synthetic test report |
| Monitor | Assigned monitoring actions | Sanction execution | Synthetic test report |
| Verifier | Assigned verification | Self-verification/unsupported level | Synthetic test report |
| Auditor | Assigned Audit scope | Unscoped restricted data | Synthetic test report |
| Investigator | Explicit restricted scope | Public/ordinary listings | Synthetic test report |
| Executive/Observer | Scoped reads/reports | Mutations outside permission | Synthetic test report |
| Public | Public-approved projection | Internal/restricted data | Public test report |
