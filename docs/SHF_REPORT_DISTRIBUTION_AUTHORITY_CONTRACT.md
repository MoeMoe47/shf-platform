# SHF Report Distribution Authority Contract

## Purpose

This contract separates access to canonical reports from generation, export,
external distribution, and public publication. It governs future Donor,
Funder, Institutional PDF, Board, and public briefing workflows without
creating a distribution channel.

The authority chain is:

`VIEW != GENERATE != EXPORT != DISTRIBUTE != PUBLISH`

## Authority separation

| Authority | Meaning | Current SHS permission/policy |
| --- | --- | --- |
| VIEW | See an eligible report inside the authenticated application. | `reports.view`; tenant/org scope required. |
| GENERATE | Register a server-owned generated composition/artifact. | `reports.export`; canonical input manifest and classification required. |
| EXPORT | Materialize or download an artifact for the authorized internal workflow. | `reports.export`; artifact identity and classification must be retained. |
| DISTRIBUTE | Share an identified artifact with an explicitly authorized external recipient/audience. | Not implemented; requires recipient, policy, and audit controls. |
| PUBLISH | Make an artifact publicly accessible. | `reports.publish` exists as a permission, but no publication route is authorized by this contract. |

One authority never implies the next. A route being authenticated or a file
being downloaded does not authorize external sharing or publication.

## Classification model

The reusable classifications are `INTERNAL`, `RESTRICTED_EXTERNAL`, and
`PUBLIC`.

| Classification | View | Generate/export | External distribution | Public publication |
| --- | --- | --- | --- | --- |
| `INTERNAL` | Authorized authenticated internal scope. | Authorized internal composition only. | Forbidden by classification. | Forbidden by classification. |
| `RESTRICTED_EXTERNAL` | Authorized internal scope. | Authorized, with exact artifact/version traceability. | Potentially allowed only after recipient/audience authorization, privacy policy, and distribution audit. | Forbidden without a separate public classification/approval decision. |
| `PUBLIC` | Authorized internal scope and, after publication, public-safe access. | Authorized only for public-eligible inputs. | Not implied by the label. | Requires public eligibility, `public_approved`, privacy/disclosure policy, publication permission, and publication audit. |

Classification is stored on the canonical artifact record. It is not itself a
permission, approval, or public-visibility flag.

## Artifact authority

`report_artifacts` is the server-owned PostgreSQL metadata authority. Each
record has a server-generated `artifact_id`, server-derived tenant,
organization, actor, timestamps, composition type/version, classification,
artifact version, `GENERATED` lifecycle, and a canonical input manifest.

The manifest contains only canonical report IDs and versions. It does not copy
Truth, Evidence, participant, employer, or verification payloads. The current
system has no canonical persisted PDF/file-byte object, so `content_hash` is
null until such bytes have an approved durable owner; no hash is fabricated.

The authenticated API is limited to:

- `POST /reporting/artifacts` with `reports.export`
- `GET /reporting/artifacts` with `reports.view`
- `GET /reporting/artifacts/:artifactId` with `reports.view`

Recipient and disclosure authority endpoints now exist, along with the bounded
`POST /reporting/artifacts/:artifactId/distributions` authorization action and
metadata-only history read. There are no send, email, share-token, public URL,
or publish endpoints. The action records `AUTHORIZED_FOR_DISTRIBUTION`, not
delivery.

## Recipient and audience authority

Future `RESTRICTED_EXTERNAL` distribution must identify the recipient or
authorized audience, recipient organization where applicable, distributing
actor, purpose, exact artifact/composition version, tenant/org scope, and
timestamp. It must apply an approved disclosure policy and be revocable if the
future distribution model supports revocation. No donor CRM or recipient table
is created here.

## Export versus distribution

`EXPORT` means internal materialization or download. It does not mean that a
recipient received the artifact or that sharing was authorized. Internal
exports should retain artifact classification and version metadata; watermarking
is not implemented because no existing artifact-byte system establishes it.

## Audit

Artifact generation writes append-only `report_artifact.generated` audit data
containing actor, organization, artifact ID, composition/version,
classification, and timestamp. Future export, distribution, publication,
revocation, and publication-revocation actions must be separately audited with
artifact/version and recipient/audience references where applicable. Audit must
never contain report contents or raw participant data.

## External and public gates

External distribution of participant-linked aggregates requires an approved
privacy/disclosure policy covering minimum group size, cohort/program/geography
suppression, reporting period, sensitive outcomes, and re-identification risk.
No numeric threshold is invented here. Until that policy and recipient
authority exist, affected external distribution fails closed.

Public publication additionally requires eligible canonical reports, verified
Source, internally approved Truth, explicit public eligibility,
`public_approved`, privacy review, public-safe artifact review, publication
permission, and publication audit. `RESTRICTED_EXTERNAL` never implies `PUBLIC`.

## Data and Oracle boundaries

Distribution consumes aggregate canonical reports only. Raw participant records,
participant references, Evidence payloads, Truth internals, employer details,
and verification documents are outside this authority.

Oracle, forecasts, simulations, and generated narrative may assist presentation
only. They cannot select classification, authorize recipients, approve public
eligibility, invent values, or replace an unavailable report with an estimate.

## Application decisions

- **Donor Summary:** artifact registration is now a governed
  `RESTRICTED_EXTERNAL` composition path bound to the exact workforce report
  input. The frontend remains unconnected and unavailable; recipient,
  disclosure, authorization, and delivery remain separate later gates.
- **Board Brief, Grant Narrative, Program Health Memo:** `INTERNAL`. Their
  existing bounded compositions remain unchanged.
- **Public Impact Snapshot:** `PUBLIC` only after all public and privacy gates;
  currently blocked and unconnected.
- **Institutional PDF and Funder Report:** governed by this same contract;
  current builder inputs are not distribution authority and remain outside this
  implementation.

## Failure rules and next slice

Missing scope, permission, canonical input manifest, classification, privacy
policy, recipient authorization, or public approval fails closed. Unavailable
canonical data cannot become zero, an estimate, or narrative success language.

The completed prerequisite is artifact registration, not distribution. The next
bounded implementation slice is a restricted-distribution decision and control
review only after recipient/audience authority and external privacy policy are
established.

The detailed prerequisite contract is maintained in
`docs/SHF_RESTRICTED_REPORT_DISTRIBUTION_CONTRACT.md`. It confirms that the
repository's current identity/contact records are not recipient authorization,
that restricted distribution requires a separate disclosure decision, and that
Donor Summary remains unconnected to distribution until those controls exist;
artifact registration alone does not authorize sharing or publication.
