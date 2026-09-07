# Security Acceptance Matrix

| Control | Test | Expected result | Owner | Evidence | Status |
|---|---|---|---|---|---|
| Authentication/MFA | Valid and expired sessions | Valid allowed; expired denied | County security | UAT log | NOT_STARTED |
| Organization/tenant isolation | Cross-scope URLs/API | Denied/no leakage | GPA security | Test report | NOT_STARTED |
| Provider isolation | Provider user accesses another provider | Denied | County/GPA | Test report | NOT_STARTED |
| Purpose/Data Use | Wrong, expired, or missing policy | Fail closed | Data governance | Test report | NOT_STARTED |
| Classification | Ceiling violation | Denied/redacted | Security | Test report | NOT_STARTED |
| Evidence/Investigation | Restricted access attempts | Denied | Assurance owner | Test report | NOT_STARTED |
| AI delegation/input security | Prompt injection/tool escalation | Contained and logged | AI governance | Security event | NOT_STARTED |
| Reporting/exports | Cross-scope/restricted export | Denied or redacted | Reporting owner | Artifact review | NOT_STARTED |
| Credentials/logs/errors | Secret and error leakage checks | No secret leakage; attributable logs | Security | Review record | NOT_STARTED |
| Session revocation/direct URLs | Revoked user and direct route | Denied | Identity owner | Test report | NOT_STARTED |
