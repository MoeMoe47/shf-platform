# Identity Federation Readiness

| Area | Current position | Classification |
|---|---|---|
| Existing authentication | Repository-supported bearer/test authentication and canonical authorization context are available for acceptance harnesses | READY_INTERNAL |
| External county IdP/SSO | Provider, protocol, claims, MFA, and logout requirements unknown | EXTERNAL_INPUT_REQUIRED |
| Federation adapter | No new county IdP implemented in this phase | CONFIGURATION_REQUIRED or CODE_GAP after county requirements |
| Organization/tenant claims | Must map to canonical scope, never browser-only state | READY_INTERNAL |
| Role claims | Must resolve through existing permission authority | READY_INTERNAL |
| Frozen-core impact | None expected; adapter changes require delta review | NONE_EXPECTED |

Do not implement a new identity provider or federation authority during Phase 1 readiness.
