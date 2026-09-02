# SHF Phase 7 Regression Environment Contract

Phase 7 acceptance runs use isolated state for tests that create institutional
facts or mutable fixtures.

- SHS curriculum, Evidence, Truth, Assignment, Release, and outbox tests use
  PostgreSQL with migrations 001 through the current head. They must not run
  against shared `shs_dev` state when fixtures use fixed identities or cleanup
  is not transactional.
- Agent Fabric funding, treasury, pools, and payout smoke tests use a temporary
  SQLite file. The repository default `db/fabric.sqlite` is shared development
  state and is not an acceptance database.
- Truth Spine JSONL tests use isolated temporary directories. JSONL is a
  development/test provider only, never production learner Truth authority.
- External-account and calendar tests require the configured external-secret
  key ring and provider test configuration. Missing
  `SHS_EXTERNAL_SECRET_ACTIVE_KID`/key material is classified as an environment
  configuration failure; security checks must not be weakened to bypass it.
- Phase 7 metric/report tests use governed Truth claims and isolated temporary
  provider state. They must not seed report values, use localStorage, or query
  raw activity-domain tables.

The controlled Phase 7 acceptance commands are the focused Agent Fabric metric,
report, provider, and Truth tests; targeted SHS Phase 5/5.5/6 curriculum tests;
frontend manifest/UI/build checks; SHS typecheck/build; migration status; and
strict schema integrity. Broad baseline suites are reported separately when
they require shared legacy fixtures or unavailable external secrets.
