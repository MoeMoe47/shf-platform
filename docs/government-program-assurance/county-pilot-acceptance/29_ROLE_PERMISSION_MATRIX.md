# Role-to-Permission Matrix

| Persona | Allowed domains/actions | Prohibited domains/actions | Scope | Classification | Reporting/AI/Public Disclosure |
|---|---|---|---|---|---|
| County Admin | Pilot configuration permitted by existing admin permissions | No unrestricted Investigation or institutional determination by default | County org/tenant | Approved ceiling | Scoped internal; governed AI |
| Program Manager | Program, funding, claims, monitoring read/workflow scope | Other org/tenant; restricted Investigation | Assigned programs | Approved ceiling | Scoped reports/AI |
| Provider User | Own provider responses/evidence where permitted | Other providers; Finding determination; restricted data | Provider scope | Approved ceiling | Provider reports only |
| Monitor | Monitoring plans, activities, requests, oversight actions | Sanction execution without authority | Program/provider scope | Approved ceiling | Monitoring briefing |
| Verifier | Verification queue and determination with four-eyes | Self-verification; unsupported levels | Assigned scope | Approved ceiling | Claim/metric explanation |
| Auditor | Audit engagement, workpapers, samples, packet | Unscoped Investigation | Assigned audit scope | Approved ceiling | Audit reports |
| Investigator | Restricted Investigation only | Ordinary users' restricted data | Explicit restricted scope | Restricted | No public output |
| Executive/Reviewer | Read/report and authorized review/decision paths | Unauthorized mutation | Approved organization scope | Approved ceiling | Executive reports/AI |
| Observer | Read-only assigned scope | All mutations and restricted data | Explicit scope | Restrictive | Read-only |
| Public | Public Disclosure-approved projection | Internal Truth, Evidence, Investigation, credentials | Public | PUBLIC | Public-safe only |

Exact permission identifiers must be resolved against the existing security registry during county provisioning.
