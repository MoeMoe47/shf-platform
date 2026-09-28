# GEO-1 Wave 6 Implementation Plan

## Wave 6A — Selection and Qualification

Complete the map-estate audit, authority matrix, readiness matrix, and next
client decision. This phase is documentation-only and leaves production clients
unchanged.

## Wave 6B — ODOT Qualification Gate

Resolve ODOT reuse terms, snapshot/version governance, coordinate ownership,
minimal geometry scope, operational publication policy, and regression targets.
Do not implement until every required authority dimension is confirmed.

## Wave 6C — ODOT Geometry Adapter

If Wave 6B passes, implement a narrowly scoped ODOT adapter with its own source
authority and feature/layer identity. Keep ODOT attributes outside Spatial
unless a separately justified contract requires them.

## Wave 6D — Operational Client Onboarding

Connect only one qualified operational client through the Spatial pipeline,
preserving its renderer, domain authority, publication rules, and rollback.

## Wave 6E — Parity and Disposition

Certify identity, geometry, publication, accessibility, failure behavior,
performance, and legacy coexistence before any default-path decision.

No Wave 6B implementation begins in Wave 6A.
