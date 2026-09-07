# SHU U6C Second Program Certificate Acceptance

## Executive result

U6C remains partial. The accepted Data Center pathway is unchanged and still
has executable completion authority. The repository does not currently contain
a second production educational program with enough canonical requirements to
support certificate issuance without inventing domain truth.

## Candidate readiness matrix

| Candidate | Canonical program authority | Enrollment / scope | Requirements | Completion facts | Certificate profile | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| `data-center-specialization-11` | Program specialization authority | Active specialization assignment | Grade 12 shared-core, branch lessons, demonstrated competencies | Lesson completions and competency decisions | Yes | Accepted as Program 1 |
| `program_seed_001` Summer STEM Camp | Seeded `programs` row | No learner-to-requirement mapping | None | No program completion facts | Yes | Blocked |
| `program_seed_002` Career Launchpad Pilot | Seeded workforce row, draft | No educational completion model | None | None | No program certificate profile | Deferred |
| `program_seed_003` Reentry Pathways | Seeded paused row | No educational completion model | None | None | No program certificate profile | Deferred |
| `data-center-specialization-12` | Curriculum/capstone authority | Specialization/course assignment | Capstone entry requirements only | Entry evidence only | No distinct program certificate | Rejected as a substitute |

## Summer STEM decision

Summer STEM has a trusted reporting profile and certificate profile, but those
are presentation/configuration authorities. They do not define completion.
The repository contains no canonical Summer STEM curriculum bundle, required
course mapping, lesson requirement set, assessment policy, project/evidence
requirement set, or learner completion authority. Enrollment or attendance
would not be sufficient to issue a program certificate.

Accordingly, no Summer STEM policy or fixture was added. The existing
`ProgramCompletionService` continues to return
`PROGRAM_COMPLETION_REQUIREMENTS_UNAVAILABLE` for this program.

## Data Center regression

The Data Center completion policy remains bound to
`grade12-entry-v1:<specialization>`. Its completion record, event, eligibility,
credential issuance, rendering, download, email, QR, and verification behavior
remain unchanged. Existing U6/U6A tests and the U6B disposable acceptance are
the evidence for Program 1.

## Why no migration was added

Migration 109 already provides the reusable immutable completion-record
authority. The missing capability is domain-owned program requirements and
learner facts, not Reporting or Credential schema. A migration 110 would not
solve the authority gap and would risk turning a fixture-specific policy into
production truth.

## Required next authority input

To close U6, the repository needs one actual educational program with:

1. a canonical program-to-curriculum or equivalent requirements binding;
2. a versioned requirements owner;
3. learner enrollment/scope authority;
4. canonical completion/evidence facts;
5. an authorized certificate profile bound to that program.

Once supplied, the existing `ProgramCompletionService`, Credential authority,
renderer, delivery, QR, and verification paths can be reused without redesign.

## U7 readiness

U7 should begin only after this second-program authority decision is resolved.
Registry and Solutions remain compatibility work; Legal and cross-product
authority remain separate prerequisites.
