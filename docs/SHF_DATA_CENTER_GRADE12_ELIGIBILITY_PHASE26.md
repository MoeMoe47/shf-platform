# SHF Grade 12 Eligibility Contract

Phase 26 establishes the pre-Grade-12 progression contract without activating Grade 12 content.

## Ownership

Curriculum / Program progression owns the derived eligibility evaluation. Program specialization requests are learner preference context; `program_specialization_assignments` remains the institutional assignment record.

## Request flow

Learner submits one pending primary request for the Grade 11/12 program. An authorized program actor with `program.specialization.assign` confirms or changes it. Confirmation calls the Phase 25 assignment service. A pending request never grants branch execution or Grade 12 eligibility.

## Eligibility policy

Policy `grade12-entry-v1` uses Model B with a small explicit minimum:

- active valid Grade 11 primary assignment;
- all five shared-core lesson completions;
- three required lessons for the active branch;
- three demonstrated entry competencies for the active branch.

Eligibility is derived on every read from assignments, server-backed completion records, and versioned competency decisions. It is not stored as an editable boolean. Pending or insufficient evidence does not satisfy a competency requirement, and a competency from another branch does not substitute for the active branch.

## Boundaries

`ELIGIBLE` means eligible for future Grade 12 curriculum progression only. It does not mean career readiness, employment eligibility, credential status, licensure, apprenticeship credit, or professional qualification. Grade 12 routes and capstone remain planned. Future capstone role mapping is derived from the active assignment, not competency or career interest.

## Lineage

`Program -> Specialization Request -> Canonical Assignment -> Shared-Core Completions -> Branch Completions -> Demonstrated Entry Competencies -> Grade 12 Eligibility Evaluation`
