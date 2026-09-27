# GEO-1A Authority Charter

Status: GEO-1A architecture contract
Baseline: GEO-0 COMPLETE WITH CONDITIONS

## Governing Principle

Separate authorities, shared spatial coordination.

Preservation before replacement.

The Spatial Engine coordinates spatial representation. It does not replace the domain systems that own truth, workflow, verification, authorization, publication, missions, events, incidents, mobility behavior, or outcomes.

## Spatial Owns

- projection behavior
- feature identity within a projection
- layer identity
- coordinate-space metadata
- selection context
- viewport and camera state
- highlight and presentation state
- route and path presentation
- map interaction events
- temporal projection
- public/private spatial eligibility enforcement at the projection boundary

## Domain Owns

- canonical records
- workflow status
- approvals
- missions
- incidents
- events
- metrics
- outcomes
- verification
- evidence
- permissions
- publication eligibility
- domain action validity

## Action Rule

A spatial interaction may request or invoke a domain action, but the authoritative domain service decides whether that action is permitted and valid.

## Non-Transfer Rule

Projecting a domain record onto a map does not transfer ownership to Spatial. A map point, layer, route, highlight, or selected feature is a projection of eligible data, not a new source of truth.

## Public Boundary Rule

Coordinates alone never make a record public. Publication state, authorization, and eligibility must be supplied by the owning domain or publication authority before Spatial presents a public projection.
