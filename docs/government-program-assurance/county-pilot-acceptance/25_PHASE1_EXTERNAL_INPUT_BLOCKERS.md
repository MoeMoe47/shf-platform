# Phase 1 External Input Blockers

| Category | Missing input | Status | Provisioning consequence |
|---|---|---|---|
| Agency | Legal name, jurisdiction, department, organization/tenant identity | BLOCKED_EXTERNAL | Cannot create or bind real scope |
| Agency | Executive, operational, technical, security, and legal sponsors | BLOCKED_EXTERNAL | Cannot approve provisioning |
| Environment | Hosting/security requirements, UAT requirements, network/IP/VPN, domains, backups, retention | BLOCKED_EXTERNAL | Cannot configure approved environments |
| Users | Names, emails, departments, personas, scopes, classification ceilings, approvers | BLOCKED_EXTERNAL | Cannot provision accounts |
| Security | County IdP/federation, MFA, session, access-review, incident contacts | BLOCKED_EXTERNAL | Cannot approve authentication |
| Data/source | Owners, environments, auth model, credential ownership, legal/Data Use status | BLOCKED_EXTERNAL | Cannot onboard connectors |
| Internal package | Configuration templates, role matrix, runbooks, test plans | READY_INTERNAL | No blocker |

Tracker linkage: agency/sponsors → `EXT-001`/`EXT-002`; environment → `EXT-003`; users/roles → `EXT-004`; identity → `EXT-005`; legal/Data Use → `EXT-006`; sources → `EXT-007`; Source Authority → `EXT-008`; classification → `EXT-009`; schema → `EXT-010`; UAT/sign-off → `EXT-011`. Supporting documents are registered as `DOC-001` through `DOC-011` in `41_COUNTY_DOCUMENT_REQUEST_REGISTER.md`.

No real account, credential, source connection, or production data is created by Phase 1 preparation.
