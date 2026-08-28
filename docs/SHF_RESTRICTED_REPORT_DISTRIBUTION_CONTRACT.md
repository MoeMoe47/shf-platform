# SHF Restricted External Report Distribution Contract

## Purpose

This contract defines the minimum authority required to share a generated
canonical report artifact with a specifically authorized external recipient.
It applies to Donor Summary, funder reports, institutional PDFs, restricted
partner reports, and grant-related external reporting.

`classification != recipient authorization != distribution authorization !=
distribution audit`.

This is an authority contract only. It does not implement delivery or public
publication.

## Recipient and audience authority

The repository's `organizations`, `users`, memberships, invitations, and
organization contact points provide identity or contact data only. They do not
establish that a person or organization is authorized to receive a report.
They are therefore `CONTACT_ONLY` or `REQUIRES_AUTHORITY_HARDENING`, not a
reusable distribution recipient authority. This slice now adds the bounded
`report_distribution_recipients` authorization record; it references those
identities without copying their contact data.

The smallest future recipient authority should bind an active recipient to:

- a server-owned recipient identifier;
- the owning tenant and organization scope;
- a recipient organization reference;
- an optional authorized contact reference, separate from delivery address;
- recipient type or audience category;
- authorization status, creator, timestamps, and version.

Authorization should use the combination of an identified recipient
organization and, where needed, an identified authorized contact or governed
audience. “All donors” is not an authorization unless an explicit audience
definition exists. No donor CRM is created by this contract.

## Distribution permission

The future execution permission is conceptually `reports.distribute`. This
slice adds `reports.distribution.manage` for recipient and disclosure
administration; it remains distinct from `reports.export`. Distribution
execution is not implemented. A future distribution request must require an authenticated actor, scoped artifact, current artifact
version, `RESTRICTED_EXTERNAL` classification, authorized recipient/audience,
an approved disclosure decision, and the distribution permission. The client
cannot choose these authorities.

No distribution execution endpoint is added. The new authority endpoints are
limited to recipient authorization and artifact-bound disclosure decisions.

## Artifact eligibility

The existing `report_artifacts` record is the prerequisite metadata authority.
It must be `GENERATED`, tenant/org scoped, versioned, and traceable through its
canonical input manifest to report IDs and versions. The exact artifact and
artifact version must be captured for any future distribution. Input manifests
reference canonical reports only; raw Truth, Evidence, participant, employer,
or verification payloads are forbidden.

`INTERNAL` artifacts cannot be distributed externally. `RESTRICTED_EXTERNAL`
is only a potential distribution classification, not permission. `PUBLIC` does
not grant publication.

## Privacy and disclosure gate

Participant-derived aggregate reports now have a server-owned,
artifact/version-bound disclosure decision record. It requires an explicit
decision: `DISCLOSURE_APPROVED` or `DISCLOSURE_BLOCKED`, made by an authorized
server policy/actor with `reports.distribution.manage`. An `APPROVED` decision
must include a policy reference; a `BLOCKED` decision is also retained. The
client cannot override a blocked or missing decision.

The policy must evaluate aggregate-only output, re-identification and
combination risk, cohort/program size, geography, reporting period, and
sensitive outcome types. It must define any required suppression rules without
this contract inventing a numeric threshold. Until an approved external
privacy/disclosure policy exists, restricted external distribution fails
closed as `PRIVACY_DISCLOSURE_POLICY_REQUIRED`.

## Distribution record

The append-only `report_distributions` record now preserves at
minimum: server-owned distribution ID, artifact ID and artifact version,
tenant/org, distributing actor, recipient/audience reference, purpose/category,
disclosure decision reference, timestamp, status, and optimistic version. It
must contain no report contents. Its current status is
`AUTHORIZED_FOR_DISTRIBUTION`, which records a governed authorization/handoff
action and does not assert that bytes were transmitted. A unique explicit
idempotency key makes retries safe while allowing a separate key for a
legitimate future resend.

The minimal conceptual lifecycle is `AUTHORIZED` -> `DISTRIBUTED`, with an
optional `REVOKED` state if revocation is implemented. It records an authorized
distribution action; it does not prove delivery, opening, reading, or
acceptance.

## Revocation and audit

Revocation means that future distribution authorization is withdrawn or the
artifact is no longer eligible for future sharing. It cannot remotely destroy
a file already downloaded. History remains append-only.

Audit actions remain separate and include
`report.distribution.authorized`, `report.distributed`, and
`report.distribution.revoked` as applicable. Each records actor, tenant/org,
artifact/version, recipient/audience reference, classification, disclosure
decision, timestamp, and correlation identity, without report contents.
The current authorization action writes `report.distribution.authorized`; it
does not write `report.distributed` because no delivery mechanism exists.

## Delivery boundary

This contract adds no email sending, share links, public URLs, donor portal,
file transfer, or delivery receipt. Artifact metadata can be authorized before
durable PDF/bytes exist, but it must not claim that a file was delivered or
hash bytes that have no approved durable owner.

## Donor Summary application

The workforce statement “X verified employment starts were recorded during the
reporting period” is `SUITABLE_WITH_CONTEXT` for a future Donor Summary. The
Donor Summary now has a server-authoritative artifact-registration path forcing
`RESTRICTED_EXTERNAL` and a bounded authority-selection UX. The UX selects only
existing authorized recipients and exact-version approved disclosures before
calling the generic authorization action; it remains unconnected to delivery.
It may not be distributed until all of these are proven:

1. a canonical artifact exists;
2. the artifact is `RESTRICTED_EXTERNAL`;
3. the recipient/audience is authorized;
4. the actor has distribution permission;
5. the disclosure gate is approved; and
6. the action is recorded against the exact artifact version.

The composition path owns the restricted classification; the client cannot
select another classification or inject another report manifest. Artifact
generation does not invoke recipient, disclosure, distribution, or delivery.

## Public boundary and reuse

`RESTRICTED_EXTERNAL` can never become public by implication. Public
publication additionally requires `PUBLIC` classification, public-eligible
canonical inputs, approved Truth, `public_approved`, privacy/disclosure
review, publication permission, a public-safe artifact, and publication audit.

The same authority contract governs institutional PDFs, funder reports, and
restricted partner reports. Their builders and exports are presentation
layers, not recipient or publication authority.

## Fail-closed rules and next slice

Missing scope, artifact version, recipient authorization, distribution
permission, disclosure decision, or policy fails closed. Unavailable canonical
data cannot become zero or an estimate. Oracle/LLM output cannot authorize a
recipient, approve disclosure, classify an artifact, or publish a report.

Artifact registration, scoped recipient authorization, artifact-bound
disclosure decisions, and the audited authorization action are complete. The
record remains a governed handoff authorization until a canonical bytes owner
and delivery mechanism exist. Donor Summary now has a governed artifact
registration path, but the current generic command-center export drawer is not
artifact or distribution authority.
