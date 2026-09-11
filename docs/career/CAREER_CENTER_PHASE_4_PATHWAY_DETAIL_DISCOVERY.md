# SHF Career Center Phase 4 — Pathway Detail + Career Discovery

## Routes

- Public pathway reference: `/career.html#/pathways/:pathwaySlug`
- Public discovery guidance: `/career.html#/discovery`
- Personal planning remains `/career.html#/planner`.

## Pathway authority and semantics

The repository does not expose a separate public pathway table or public
program-career mapping endpoint. The pathway detail route therefore uses the
canonical Career slug as the smallest stable identifier available and labels
the result as a public pathway reference. It does not claim to be a learner
learning path, personal plan, or organization-owned program.

The page reads the existing Career API and Career curriculum-requirements API.
It links back to the canonical Career Detail route and to existing Curriculum
lesson routes. Program mappings, skills, credentials, preparation providers,
opportunities, employers, and regional workforce claims are omitted or shown
as unavailable because public authorities are not present.

## Career Discovery

Discovery is anonymous-capable and in-session only. It collects a free-text
interest/topic field, an optional canonical career-family selection, and an
optional work-style preference. Matching tokenizes the canonical Career title,
description, family, and sector, then provides a deterministic ranked list.

Each result explains why it appeared. Discovery never displays an opaque score,
placement ranking, probability of success, psychological interpretation, or
validated assessment result. The page explicitly states:

> Career Discovery provides guidance based on your selections. It is not a
> psychological, aptitude, or validated career assessment.

Results link to `/careers/:careerSlug`. The Planner handoff links to `/planner`
and states that anonymous results are not saved.

## Navigation boundary

Public routes render public exploration navigation and a My Career Center
handoff. Personal routes render personal planning tools. The frontend does not
pretend to provide authentication; backend permissions remain authoritative.

## Tests and verification

- Static Phase 1/3/4 tests verify route separation, canonical API usage,
  transparent disclosure, and truth protections.
- Browser tests verify pathway list/detail, invalid detail, discovery inputs,
  recommendation explanations, Career Detail and Planner links, responsive
  overflow, and public navigation boundaries.

## Later-phase gaps

Public program-career mappings, skills, training providers, opportunity policy,
employer projections, regional workforce data, saved discovery, and personal
plan persistence remain later-phase work.
