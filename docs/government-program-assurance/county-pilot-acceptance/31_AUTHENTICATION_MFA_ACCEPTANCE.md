# Authentication and MFA Acceptance

| Scenario | Expected result | County dependency | Status |
|---|---|---|---|
| First login and MFA enrollment | Enrollment required before access | IdP/MFA requirements | BLOCKED_EXTERNAL |
| MFA required | Access denied without MFA | County IdP | BLOCKED_EXTERNAL |
| Expired/revoked session | Access denied and reauthentication required | Session policy | BLOCKED_EXTERNAL |
| Disabled account | Access denied | Identity owner | BLOCKED_EXTERNAL |
| Wrong tenant/org | No data or route leakage | Canonical scope | READY_INTERNAL |
| Role removal | Permission removed on reload | Identity integration | READY_INTERNAL |
| Sensitive action reauthentication | Required if supported by policy | County security | NOT_STARTED |
| Federation/SSO | Approved county IdP only | Federation decision | BLOCKED_EXTERNAL |

No county IdP or account is configured in Phase 1 preparation.
