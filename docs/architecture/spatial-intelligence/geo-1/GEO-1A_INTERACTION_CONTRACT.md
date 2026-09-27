# GEO-1A Interaction Contract

This document defines the Interaction Bus architecture. It does not implement the bus.

## Interaction Types

- `SELECT`
- `DESELECT`
- `FOCUS`
- `HIGHLIGHT`
- `OPEN_RECORD`
- `REQUEST_ROUTE`
- `FOLLOW_ROUTE`
- `INSPECT_EVIDENCE`
- `REQUEST_DOMAIN_ACTION`

## Publishers

Publishers may include map clients, layer controls, evidence inspectors, domain panels, route panels, temporal controls, and accessibility equivalents.

## Consumers

Consumers may include map clients, domain panels, evidence panels, route/path presenters, timelines, search panels, and authorized domain action surfaces.

## External Authority Checks

The Interaction Bus does not decide:

- identity or authorization
- domain workflow validity
- publication eligibility
- verification truth
- evidence sufficiency
- mission/event/incident validity
- traffic, water, transit, or emergency authority

## Event Payload Requirements

Each interaction should carry the feature or layer id, domain, source authority, coordinate family, coordinate space, provenance, timestamp, and requested action when applicable.
