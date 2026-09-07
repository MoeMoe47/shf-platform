# Government Program Assurance County Pilot External Intake Packet

**For completion by:** county/agency executive sponsors, legal/privacy, IT/security, program leadership, data owners, and source-system owners.

## Purpose

Government Program Assurance is entering county pilot acceptance against the frozen GPA v1 baseline. The county is not being asked to approve production deployment through this packet. The purpose is to collect the information and approvals needed to prepare a secure pilot environment, least-privilege users, source integration, Data Use controls, UAT, and security review.

Frozen baseline: tag `gpa-v1-accepted-2026-09-06`, commit `72071116b4bbf9d6ad687fe8fe41282221a4af0c`, migration `105`.

Complete this packet with references to approved documents. Use `TBD — county input required` when unknown. Do not place secrets in this packet.

## 1. County and Agency Identity

| Field | County response |
|---|---|
| Legal county/agency name | TBD — county input required |
| Jurisdiction | TBD — county input required |
| Department/division | TBD — county input required |
| Official address | TBD — county input required |
| Executive sponsor: name/title/email/phone/responsibility | TBD |
| Operational sponsor: name/title/email/phone/responsibility | TBD |
| Technical sponsor: name/title/email/phone/responsibility | TBD |
| Security contact: name/title/email/phone/responsibility | TBD |
| Legal/privacy contact: name/title/email/phone/responsibility | TBD |
| Records/public-disclosure contact: name/title/email/phone/responsibility | TBD |
| Procurement/vendor contact, if applicable | TBD |

## 2. Pilot Business Scope

### Programs

| Program name/ID | Owner | Status/purpose | Population | Services/outcomes | Reporting obligations |
|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD |

### Providers

| Provider | Owner/contact | Programs served | Contractual role | Funding relationship |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

### Funding

| Funding source | Award/agreement | Period | Responsible owner | Reporting requirements |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

Do not provide unnecessary sensitive participant data at intake stage.

## 3. Source-System Questionnaire

Complete one row per source system.

| Question | Response |
|---|---|
| System name/vendor | TBD |
| Business owner and technical owner/contact | TBD |
| Environment and hosting model | TBD |
| Domains and record types | TBD |
| Data dictionary available? | TBD: Y/N |
| API available? | TBD: Y/N |
| File export available? | TBD: Y/N |
| Database access available? | TBD: Y/N |
| Integration mechanism | TBD |
| Authentication mechanism | TBD; do not provide secrets |
| Sandbox/UAT available? | TBD: Y/N |
| Expected refresh frequency | TBD |
| Support contact | TBD |
| Change-window restrictions | TBD |

## 4. Source Authority Questionnaire

Source System and Source Authority are different concepts.

| Data domain/record type | Authoritative system | Secondary system | Conflict winner | Effective-date rules | Jurisdiction rules | Authority approver | Current dispute process |
|---|---|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## 5. Legal and Data Use Questionnaire

| Requirement | Owner | Status | Document/reference | Effective date | Expiration | Restrictions |
|---|---|---|---|---|---|---|
| Legal authority to process | TBD | TBD | TBD | TBD | TBD | TBD |
| Data Use Agreement | TBD | TBD | TBD | TBD | TBD | TBD |
| Interagency agreement | TBD | TBD | TBD | TBD | TBD | TBD |
| Vendor/data-processing agreement | TBD | TBD | TBD | TBD | TBD | TBD |
| Privacy requirements | TBD | TBD | TBD | TBD | TBD | TBD |
| Retention requirements | TBD | TBD | TBD | TBD | TBD | TBD |
| Redisclosure restrictions | TBD | TBD | TBD | TBD | TBD | TBD |
| Public-records obligations | TBD | TBD | TBD | TBD | TBD | TBD |
| Audit rights | TBD | TBD | TBD | TBD | TBD | TBD |
| Source-system access approval | TBD | TBD | TBD | TBD | TBD | TBD |
| Production-pilot authorization | TBD | TBD | TBD | TBD | TBD | TBD |

GPA does not make legal conclusions in this packet.

## 6. Data Classification Questionnaire

Use `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`, or `HIGHLY_RESTRICTED`. Unknown values default to restrictive handling.

| Domain/data type | Classification | Reason | Owner | Access restrictions | Export restrictions | AI restrictions | Lineage restrictions | Public eligibility |
|---|---|---|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## 7. Identity, MFA, and SSO Questionnaire

| Question | Response |
|---|---|
| Identity provider | TBD |
| SSO required? | TBD: Y/N |
| SAML/OIDC requirements | TBD |
| MFA required/method | TBD |
| Session timeout | TBD |
| Password policy, if applicable | TBD |
| Account approval process | TBD |
| Account termination process | TBD |
| Federation contact | TBD |
| Test tenant/sandbox available? | TBD: Y/N |
| Group/role mapping support | TBD |

Do not provide passwords, tokens, keys, or client secrets.

## 8. Proposed User and Role Intake

Supported personas: County Admin, Program Manager, Provider User, Monitor, Verifier, Auditor, Investigator, Executive/Reviewer, and Read-only Observer.

| Name | Email | Department | Persona | Program scope | Provider scope | Classification ceiling | Approver | MFA | Start/end or review date |
|---|---|---|---|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## 9. Security Requirements

| Requirement | County response/evidence |
|---|---|
| Security framework | TBD |
| Network/VPN/private connectivity | TBD |
| IP allowlists/endpoints | TBD |
| Encryption requirements | TBD |
| Logging/SIEM requirements | TBD |
| Audit-log retention | TBD |
| Vulnerability scanning | TBD |
| Incident response contacts | TBD |
| Breach notification | TBD |
| Penetration testing | TBD |
| Vendor-risk review | TBD |

## 10. Environment Requirements

Complete separately for Development, UAT, and Production Pilot.

| Requirement | Development | UAT | Production Pilot |
|---|---|---|---|
| Hosting/domain | TBD | TBD | TBD |
| Database/network restrictions | TBD | TBD | TBD |
| Logging/backup/recovery | TBD | TBD | TBD |
| Monitoring | TBD | TBD | TBD |
| Classification ceiling | TBD | TBD | TBD |
| Approved data type | Synthetic only initially | TBD | TBD |
| Approved users | TBD | TBD | TBD |

## 11. Credential and Secret Requirements

| Credential type | Owner | Secret manager | Rotation/expiration | Revocation process | UAT/production separation | Approval owner |
|---|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD |

**Do not place secret values, passwords, API keys, private keys, tokens, client secrets, or credentials in this intake document.** GPA stores credential references only where the existing architecture requires.

## 12. Data Dictionary and Schema Request

Provide, through an approved secure exchange:

- field dictionary and schema;
- record definitions and enumerations;
- identifier and relationship-key rules;
- timestamp/timezone semantics;
- lifecycle/status values; and
- approved sample redacted records.

Do not provide live production records at intake stage.

## 13. UAT Participants

| Participant function | Name | Responsibility | Sign-off responsibility |
|---|---|---|---|
| Program Manager | TBD | Program workflow | TBD |
| Provider representative | TBD | Provider workflow | TBD |
| Verifier | TBD | Claim verification | TBD |
| Monitor | TBD | Oversight workflow | TBD |
| Reconciliation reviewer | TBD | Source conflict review | TBD |
| Auditor | TBD | Audit workflow | TBD |
| Executive reviewer | TBD | Reports/briefing | TBD |
| Security reviewer | TBD | Security acceptance | TBD |
| IT reviewer | TBD | Environment/connectivity | TBD |
| Legal/privacy reviewer | TBD | Authority/Data Use | TBD |

## 14. County Acceptance Authorities

| Acceptance area | Authorized signer/name/title | Evidence/reference |
|---|---|---|
| Technical readiness | TBD | TBD |
| Security | TBD | TBD |
| Legal/Data Use | TBD | TBD |
| Program operation | TBD | TBD |
| Reporting | TBD | TBD |
| AI use | TBD | TBD |
| Public disclosure | TBD | TBD |
| Production pilot activation | TBD | TBD |
| Final county acceptance | TBD | TBD |

## 15. Proposed Pilot Success Criteria

Mark each `ACCEPTED`, `MODIFY`, or `NOT_APPLICABLE` and provide rationale.

| Criterion | County disposition | Rationale/evidence |
|---|---|---|
| Approved source connectivity works | TBD | TBD |
| Users are provisioned with least privilege | TBD | TBD |
| Funding → Outcome → Truth lineage verified | TBD | TBD |
| Claim/Verification workflow completed | TBD | TBD |
| Monitoring workflow completed | TBD | TBD |
| Reconciliation workflow completed | TBD | TBD |
| Audit workflow verified | TBD | TBD |
| Governed AI briefing verified | TBD | TBD |
| Executive Assurance Report reviewed | TBD | TBD |
| Cross-tenant leakage prevented | TBD | TBD |
| Restricted data remains protected | TBD | TBD |

## 16. Required County Evidence Checklist

- [ ] Agency authorization
- [ ] Data Use Agreement and legal/privacy approval
- [ ] Source owner approvals
- [ ] Security requirements
- [ ] Identity/SSO/MFA requirements
- [ ] Classification decisions
- [ ] Program list
- [ ] Provider list
- [ ] Funding references
- [ ] Source inventory
- [ ] Data dictionary/schema
- [ ] User list
- [ ] Role approvals
- [ ] UAT participants
- [ ] Acceptance authorities

Use `40_COUNTY_EXTERNAL_INPUT_TRACKER.md` and `41_COUNTY_DOCUMENT_REQUEST_REGISTER.md` for status and evidence references.

## 17. Sequenced Blockers

### Required Before Phase 1 External Provisioning

Agency identity, sponsors, Organization/Tenant values, environment requirements, user/role approvals, MFA/IdP requirements, security owner, and provisioning evidence.

### Required Before Phase 2 Source Connector Onboarding

Approved UAT environment, source inventory and owners, Data Use/legal status, classification, Source Authority mapping, credential mechanism, schema owner, entitlement, logging, and rollback evidence.

### Required Before Real Data

Approved Data Use, classification, source authorization, secure credential references, security acceptance, redacted validation, and explicit GO decision.

### Required Before Production Pilot

UAT acceptance, security/legal/program/reporting/AI/public-disclosure sign-offs, production environment approval, rollback plan, and authorized production-pilot decision.

## 18. Submission and Contacts

County primary contact: `TBD — county input required`
GPA contact: `TBD — GPA owner to provide`
Secure evidence exchange: `TBD — GPA owner to provide`

This packet does not authorize provisioning, source connection, production access, or county acceptance.
