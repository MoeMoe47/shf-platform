# Government Program Assurance v1 Git Checkpoint

This record is prepared for the permanent GitHub checkpoint of the accepted GPA v1 baseline.

- Accepted version: `GPA v1`
- Checkpoint date: `2026-09-06`
- Branch: `studio-v1-plus-development`
- Checkpoint commit SHA: the commit resolved by annotated tag `gpa-v1-accepted-2026-09-06` and recorded in the final checkpoint report
- Git tag: `gpa-v1-accepted-2026-09-06`
- Migration baseline: `105`
- Software readiness: `READY_FOR_COUNTY_ACCEPTANCE`
- Readiness score: `94/100`
- `P0_INTERNAL = []`
- Acceptance verdict: `GOVERNMENT PROGRAM ASSURANCE PHASE 8C FINAL ACCEPTANCE COMPLETE — READY FOR COUNTY PILOT ACCEPTANCE GATE`

## Source Records

- Freeze document: `docs/government-program-assurance/GPA_V1_FREEZE_2026-09-06.md`
- Freeze manifest: `docs/government-program-assurance/GPA_V1_FREEZE_MANIFEST.json`
- County pre-acceptance packet: `docs/government-program-assurance/COUNTY_PILOT_PRE_ACCEPTANCE_PACKET.md`
- Change delta template: `docs/government-program-assurance/COUNTY_PILOT_CHANGE_DELTA_TEMPLATE.md`
- Acceptance harness: `scripts/run-phase8-acceptance-env.mjs`
- Browser suites: `tests/phase8/`
- GPA API suites: `apps/shs-api/tests/government-program-assurance-*.test.ts`

The controlled fixture is disposable and test-only. It provisions stable GPA references for the pilot configuration, Program, Providers, Funding, Sources, Claim, Evidence, Verification, Metric, Truth, Monitoring, Findings, Corrective Action, Reconciliation, Data Quality, Audit, AI, and reporting scenarios. This checkpoint does not create county credentials, production source connections, or external county acceptance.
