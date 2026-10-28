# OAS Website Batch 2 — Standard Presentation

Status: COMPLETE

Batch 2 converted the OAS-1 public standard page from a partial presentation
into a release-backed standard surface.

Implemented:

- centralized presentation model in src/pages/oas/oasStandard.js
- source data derived from the frozen OAS-1@1.0.0 catalog
- all 14 canonical requirements
- all 8 canonical domains
- stable requirement anchors
- stable domain anchors
- domain-to-requirement grouping
- requirement-to-domain navigation
- standard navigation to:
  - Overview
  - Purpose & Boundaries
  - Control Domains
  - Requirements
  - Risk Classification
  - Release Artifacts
- direct frozen catalog access
- explicit normative/informative distinction
- explicit NOT_EVALUATED boundary

Batch 2 does not implement Governance Center, Developer Center, Validator,
SDKs, CLI, Registry integration, ATB assessment or interoperability tooling.
Those remain later controlled work.
