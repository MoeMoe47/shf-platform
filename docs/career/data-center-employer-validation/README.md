# Data Center & AI Infrastructure — Employer Validation Package

This folder contains SHF's first employer validation package, built under the [SHF Career Pathway Acceptance Standard v1](../SHF_CAREER_PATHWAY_ACCEPTANCE_STANDARD_V1.md) (CPAS-1) for the Data Center & AI Infrastructure pathway.

**Current pathway status: PREPARE. Current validation status: NOT REVIEWED.** Nothing in this folder changes that — it exists to make external review possible, not to claim it has already happened.

## What this is

An **employer REVIEW package** — a way for real employers and industry experts to look at SHF's existing Data Center curriculum and tell SHF whether it reflects real entry-level work.

## What this is not

Not employer validation itself, not a partnership agreement, not an internship or apprenticeship agreement, not a hiring commitment, not a credential endorsement, and not proof of workforce demand. No employer names, endorsements, or feedback have been invented anywhere in this folder.

## Files

| File | Purpose |
|---|---|
| [`DATA_CENTER_EMPLOYER_VALIDATION_PACKAGE_V1.md`](./DATA_CENTER_EMPLOYER_VALIDATION_PACKAGE_V1.md) | The full narrative package — overview, pathway status, target roles, curriculum, competency map, practical activities, learning journey, assessment, evidence, credentials, safety, accessibility, Arcade/Metaverse concepts (not built), work-based-learning proposal, partnership options, and renewal schedule. |
| [`DATA_CENTER_EMPLOYER_VALIDATION_QUESTIONNAIRE_V1.md`](./DATA_CENTER_EMPLOYER_VALIDATION_QUESTIONNAIRE_V1.md) | The structured questionnaire, in two tiers: Part 1 Core Employer Review (Sections A-K, sufficient for an EMPLOYER REVIEWED outcome) and Part 2 Optional Deep Technical Review (Sections L-U, required for EMPLOYER VALIDATED but not for a basic review). |
| [`DATA_CENTER_EMPLOYER_FEEDBACK_RECORD_V1.json`](./DATA_CENTER_EMPLOYER_FEEDBACK_RECORD_V1.json) | A blank template for recording one reviewer's completed feedback. |
| [`DATA_CENTER_EMPLOYER_VALIDATION_RECORD_V1.json`](./DATA_CENTER_EMPLOYER_VALIDATION_RECORD_V1.json) | A blank template for the separate, explicit sign-off/outcome decision, including the sufficiency rule for each validation level. Completing the Feedback Record does not, by itself, produce a validation outcome — that requires this record. |
| [`OUTREACH_READINESS_CHECKLIST_V1.md`](./OUTREACH_READINESS_CHECKLIST_V1.md) | Internal-only checklist tracking whether this package is ready to hand to a real employer. Not for distribution. |

## Source of truth

Every claim in this package traces back to:
- [`../SHF_CAREER_PATHWAY_ACCEPTANCE_STANDARD_V1.md`](../SHF_CAREER_PATHWAY_ACCEPTANCE_STANDARD_V1.md) — the standard.
- [`../SHF_CAREER_PATHWAY_ACCEPTANCE_RECORD_SCHEMA_V1.json`](../SHF_CAREER_PATHWAY_ACCEPTANCE_RECORD_SCHEMA_V1.json) — the record schema.
- [`../records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json`](../records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json) — the populated pathway record (updated during this package's build with corrected competency/evidence findings — see its `assessment_refs`/`competency`/`practice`/`assessment`/`evidence` fields for the correction notes).
- [`../DATA_CENTER_PATHWAY_PILOT_AUDIT_V1.md`](../DATA_CENTER_PATHWAY_PILOT_AUDIT_V1.md) — the 12-domain pilot audit (also updated with the same corrections).

## How to use this

1. Identify a real employer or industry reviewer (see the Phase 2 report's recommended outreach strategy — SHF has not contacted anyone as part of building this package).
2. Share the main package document and the questionnaire.
3. Record their response in a copy of the Feedback Record.
4. Only after a real, attributed review, an authorized SHF reviewer completes the Validation Record with an actual outcome.
5. Update `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json`'s `validation_status` field only once real evidence — not this package's existence — supports a change.
