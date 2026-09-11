# SHF Hybrid Phase 4 Organization Onboarding & Network Membership Lifecycle

## Canonical Owner

Organization Onboarding is the canonical owner for candidate intake, review decisions, activation, suspension, exit, and graduation state. It does not replace canonical Organization, Organization Relationships, Memberships, or Service Entitlements.

## Candidate vs Organization

An onboarding case is a candidate/application record. It may link to an existing canonical organization or create one only during authorized activation. Applicant submission never creates trusted organization authority by itself.

## Lifecycle

Cases use `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `DECLINED`, `ACTIVATED`, `SUSPENDED`, `EXITED`, and `GRADUATED`. `APPROVED` means the institutional decision passed. `ACTIVATED` means the canonical organization, relationship, and approved baseline service entitlements are established.

## Relationships

Requested relationship type is descriptive until activation. Phase 4 accepts only existing institutional relationship types: `NETWORK_MEMBER_OF`, `INCUBATES`, and `SHARED_SERVICES_PROVIDER_FOR`. Activation creates or reuses the canonical relationship through the relationship lifecycle owner.

## Requested vs Entitled Services

Requested services are not access grants. Requested and approved services are validated against `service_catalog`; only approved services are provisioned through the Phase 3 `Organization Service Entitlements` domain.

## Link / Create Behavior

Reviewers may link an approved case to an existing organization. If no link exists, activation safely matches an exact primary domain; otherwise it creates a canonical organization with deterministic onboarding identity. There is no fuzzy deduplication.

## Authority

Applicants may submit and view their own cases with `organization.onboarding.submit` / `organization.onboarding.view`. Review, activation, suspension, and exit require explicit onboarding governance permissions. Browser requests cannot supply actor, timestamp, provider, status, relationship status, entitlement status, tenant, or approval authority.

## Suspension, Exit, and Graduation

Suspension moves the onboarding case and active network relationship to suspended state and suspends approved entitlements. Exit ends the relationship, revokes approved entitlements, and preserves organization identity and history. Graduation is a future-safe lifecycle state for incubated entities; Phase 4 does not implement legal spinout logic.

## Idempotency and Failure

Activation is deterministic: repeated activation does not create duplicate organizations, active relationships, or active entitlements. If entitlement provisioning fails after relationship creation, the case remains `APPROVED` and can be retried; it is not falsely marked `ACTIVATED`.

## Boundaries

Onboarding emits operational/audit facts only. It does not create Truth/Evidence, impact, completion, credential, funding, grants, billing, subscriptions, service agreements, SLAs, facilities booking, SHS commercial relationships, or funder reporting records.

## Phase 5 Entry Contract

Phase 5 may consume activated organizations, canonical relationships, program organization scope, and service entitlements to model funding, grants, and restricted-fund relationships. It must keep financial authority separate from program operations and impact attribution.
