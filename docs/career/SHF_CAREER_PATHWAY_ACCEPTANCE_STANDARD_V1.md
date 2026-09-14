# SHF Career Pathway Acceptance Standard v1

## Identity

Standard: SHF Career Pathway Acceptance Standard v1

Standard ID: CPAS-1

Version: 1.0

Status: ADOPTED_FOR_PILOT (adopted for the Data Center & AI Infrastructure pilot; not yet applied repository-wide to other pathways)

Authority: Career Center product/governance, consulting Curriculum, Competency/Evidence (`prepare-prove`/`verified-evidence`), Credentials, Portfolio, Organizations, Opportunities, and Reporting/Truth as canonical-owner authorities for any field this standard references but does not own.

Scope: CPAS-1 governs how SHF classifies and represents the readiness of an SHF-developed career preparation/launch course sequence. It defines a canonical pathway acceptance record, a 5-stage status model, a 12-domain evaluation model, and the public-claim boundaries tied to each status. It does not become a second Career, Curriculum, Competency, Evidence, Credential, Portfolio, Organization, Opportunity, or Reporting/Truth authority — see [Canonical Domain Boundaries](#canonical-domain-boundaries).

Companion artifacts:
- `docs/career/SHF_CAREER_PATHWAY_ACCEPTANCE_RECORD_SCHEMA_V1.json` — the machine-readable record schema this standard requires.
- `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json` — the first populated record (the Data Center & AI Infrastructure pilot).
- `docs/career/DATA_CENTER_PATHWAY_PILOT_AUDIT_V1.md` — the pilot audit that produced that record.

## Purpose

CPAS-1 exists to stop SHF completion of a career-preparation course from ever being represented, implicitly or explicitly, as occupational qualification, state licensure, external certification, apprenticeship completion, employment, or guaranteed placement — while still letting SHF describe real, substantive preparation work honestly and confidently. It gives every SHF career-preparation/launch pathway one canonical, evidence-based status, tracked separately from marketing language, and requires that status to be re-derived from repository/program evidence rather than asserted.

## Locked Career Center Pathway Rule

Broad Career Center exploration may cover many careers with lighter requirements (see EXPLORE below). But any **SHF-developed career preparation or Career Launch course** must connect to at least one of:

- **(A) a verified state-recognized training/testing/licensure/registry pathway**, or
- **(B) an employer/industry-validated pathway**.

SHF must keep these concepts visibly distinct in every learner- and public-facing surface: exploration, preparation, state-recognized pathway, employer validation, Career Launch, external credential, and employment/apprenticeship placement. SHF completion alone must never be represented as automatically conferring any of those things.

## Canonical Pathway Progression

```
EXPLORE → PREPARE → STATE-PATHWAY and/or EMPLOYER-VALIDATED → CAREER LAUNCH
```

Every pathway has exactly one primary `current_status` at a time (see the record schema). `validation_status` is tracked as a separate field, because a pathway can be in PREPARE while validation work is already underway or already complete for a later stage.

## Status Definitions

### EXPLORE
Purpose: help a learner understand a career or career family. Minimum requirements: accurate career definition, target occupation/family, basic skills overview, work environment, typical tasks, education/training overview, clear next-step guidance. Must NOT imply job readiness.

### PREPARE
Purpose: build foundational knowledge and skills toward a recognized next step. Requirements: defined target occupation or family, meaningful curriculum, competency map, hands-on practice, assessment, evidence requirements, portfolio output where appropriate, safety/professionalism where applicable, clear external next step, accessibility review, SEL/readiness support, and no unsupported claim of occupational qualification.

### STATE-PATHWAY
Purpose: connect SHF preparation to a verified state-defined route (training, testing, licensure, certification, registry, or other statutory/regulatory requirement). Requires PREPARE plus: verified state authority, an authoritative source, documented training requirements, testing/competency requirements, license/registry requirement where applicable, age/prerequisite rules, provider requirements, and an explicit distinction between SHF preparation and official state qualification. **A pathway must not be classified STATE-PATHWAY unless repository evidence clearly supports it** — absence of evidence means the classification is not made, regardless of how plausible it seems.

### EMPLOYER-VALIDATED
Purpose: confirm that external employers/industry reviewers recognize the curriculum and competencies as relevant to real entry-level work. Requires PREPARE plus documented external review of: target occupation, competency map, curriculum scope, tools/equipment, safety, assessments, evidence, entry-level relevance, missing skills, and credential alignment.

Validation status values (tracked on the record, independent of `current_status`):
- `NOT REVIEWED`
- `INDUSTRY REVIEW IN PROGRESS`
- `EMPLOYER REVIEWED`
- `EMPLOYER VALIDATED`
- `MULTIPLE-EMPLOYER VALIDATED`

### CAREER LAUNCH
Highest SHF designation. Requires: PREPARE complete, external validation, a clear credential strategy, a real work-based-learning route, defined learner eligibility, evidence requirements, employer/industry relevance, and outcome/next-step tracking. Accepted work-based-learning routes: Registered Apprenticeship, youth apprenticeship, pre-apprenticeship, paid internship, structured internship, cooperative education, employer project, job shadow, interview pathway, hiring pathway. Career Launch does **not** mean every student is guaranteed placement.

## The 12-Domain Acceptance Model

Every pathway is evaluated across exactly these 12 domains. Each domain is classified `COMPLETE`, `PARTIAL`, `MISSING`, or `NOT APPLICABLE`, with cited repository evidence — never asserted without evidence.

1. **Career Definition** — is the target occupation/family accurately, non-fabricated, and specifically defined?
2. **Labor Relevance** — is the target occupation a real, existing occupation, and is SHF's description of it plausible/accurate (independent of whether an employer has yet confirmed it)?
3. **Curriculum** — does meaningful, real curriculum content exist, and is it connected (not just co-located) to the pathway's canonical career record?
4. **Competencies** — is there an explicit, evidenced competency map, not just implied skills?
5. **Practice** — is there real hands-on/practical work, and can it actually be completed end-to-end today?
6. **Assessment** — is there real assessment, and is it backed by a canonical evidence/verification path where claimed?
7. **Evidence** — does verified evidence exist and can it actually reach a learner's Portfolio?
8. **Credential Strategy** — is there a documented, honest credential strategy, whether or not it is operational yet?
9. **External Recognition** — has any state authority, industry standard, or employer engaged with this pathway, beyond internal planning language?
10. **Work-Based Learning** — does a real, operational work-based-learning route exist (an Opportunity record, an employer relationship, a placement mechanism)?
11. **Accessibility + SEL** — is there real accessibility support and real SEL/readiness support, verified rather than assumed?
12. **Outcome / Next Step** — is the learner's actual next step, inside and outside the curriculum, clearly and honestly defined?

## Acceptance Gates

- **EXPLORE**: Domains 1–2 substantially complete.
- **PREPARE**: Domains 1–8 plus 11–12 substantially complete.
- **STATE-PATHWAY**: PREPARE plus verified state pathway requirements (Domain 9's state-authority evidence).
- **EMPLOYER-VALIDATED**: PREPARE plus documented employer/industry validation (Domain 9's employer evidence).
- **CAREER LAUNCH**: All 12 domains plus external validation plus a real work-based-learning route (Domain 10 operational, not planned).

No marketing copy may override these gates. A gate is met only when the cited evidence supports it — not when copy asserts it.

## Canonical Curriculum Flow (preserved, not replaced)

Per-lesson flow: `Orient → Check-In → Learn → Vocabulary-in-Context → Check Understanding → Practice → Learning Arcade → Apply → Assess → Reflect → Evidence → Career Connection → Completion Check → Next`.

Broader learning workflow: `Assign → Prepare → Learn → Practice → Play → Apply → Reflect → Demonstrate → Verify → Report`.

CPAS-1 does not define a competing lesson flow or learning workflow. The `current_status` progression (EXPLORE → PREPARE → …) is a **career-development** framework layered on top of existing lesson/learning-workflow data — it reads from Curriculum, Competency/Evidence, Credentials, Portfolio, Organizations, and Opportunities; it does not re-implement any of them.

## Canonical Domain Boundaries

CPAS-1 and its pathway acceptance record are a cross-domain **index and status projection**, not a new authority. They must never duplicate:

| Concern | Canonical owner | CPAS-1's role |
|---|---|---|
| Career identity, career-family, career-curriculum linkage | `careers` / `career-pathways` domains (`career_families`, `careers`, `career_curriculum_requirements`, `program_careers`) | References `career_id`/`career_family_id` by id only |
| Courses, lessons, assignments, assessments, completion | `curriculum` / `curriculum-catalog` domains | References `curriculum_id`/`lesson_id` by id only |
| Verified skill/competency evidence | `prepare-prove` (competency truth) + `verified-evidence` (evidence/Truth bridge) | References `competency_id`/evidence ids by id only |
| Evidence/provenance presentation | `portfolio` domain | References portfolio artifact ids by id only |
| Credential definitions, issuance, revocation, verification | `credentials` domain | References a credential/certificate-profile id by id only |
| Employer/provider identity | `organizations` domain | References `organization_id` by id only |
| Internships, apprenticeships, jobs, other opportunity types | `opportunities` domain | References `opportunity_id` by id only |
| Governed institutional claims | Reporting/Truth | Any claim CPAS-1 records as "allowed" must already be governed-fact-eligible; CPAS-1 does not itself become a Reporting/Truth authority |
| Experience/navigation | Universe/Metaverse | Out of scope for CPAS-1 entirely |
| Economic ledger | Treasury | Does not exist canonically yet; CPAS-1 does not create one and records nothing there |

If a future phase needs CPAS-1 fields to be queryable/joinable rather than living only in a document, the smallest safe extension is a new table inside the existing **`careers`** domain (the same domain that already owns `career_curriculum_requirements` — itself explicitly "identifiers and requirement metadata only," the same pattern CPAS-1 needs) — not a new top-level domain.

## Governance

`approval_state`, `reviewer`, `review_date`, and `next_review_date` are tracked per record (see schema). No pathway may claim a status higher than what its record's cited evidence supports, regardless of `approval_state`. Re-review is required whenever curriculum, competency, evidence, credential, or external-recognition facts materially change.
