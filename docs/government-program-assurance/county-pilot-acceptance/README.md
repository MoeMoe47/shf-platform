# County Pilot Acceptance Gate

This directory contains the external County Pilot Acceptance Gate preparation package for Government Program Assurance v1.

The frozen GPA v1 baseline remains authoritative: tag `gpa-v1-accepted-2026-09-06`, commit `72071116b4bbf9d6ad687fe8fe41282221a4af0c`, migration `105`. County-specific configuration and integration are controlled pilot deltas and must not silently change the frozen core.

This package does not claim county acceptance. Acceptance is complete only after the external agency supplies the required evidence, completes UAT, and signs the gate.

Gate status values are `NOT_STARTED`, `BLOCKED_EXTERNAL`, `READY`, `IN_PROGRESS`, `PASS`, `FAIL`, and `WAIVED_WITH_AUTHORITY`. Use `TBD — external county input required` where facts are unknown.

## External Inputs Required

Agency legal identity; sponsors and contacts; Programs, Providers, Funding, Services, Outcomes, and Metrics; source systems and owners; authentication methods; data dictionaries; legal agreements; classification, retention, and public-record requirements; users and role approvals; security requirements; UAT participants; and sign-off authorities.

## Phase 0 Assessment

Phase 0 is `PASS` for internal preparation. The planning structures are present, unknown external values are explicit, and no frozen-core blocker has been introduced. Readiness to enter Phase 1 remains `BLOCKED_EXTERNAL` until the county supplies the required identity, authority, scope, environment, and sponsor inputs.
