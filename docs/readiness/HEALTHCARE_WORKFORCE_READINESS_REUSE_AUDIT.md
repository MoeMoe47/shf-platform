# Healthcare Workforce Readiness — Reuse Audit

Status: DRAFT — PARALLEL PASS 1
Branch: agent/readiness-healthcare
Baseline: 518dda1
Stable key: `shu-healthcare-workforce-readiness`

## Purpose

Determine what SHU already has for Healthcare Workforce Readiness before creating curriculum, services, registries, schemas, or authorities.

Required rule:

Audit → Canonical Authority → Reuse → Extend → Build New Only When Proven Missing.

## Executive Finding

SHU already contains healthcare pathway concepts and shared platform authorities, but the audit did not prove a governed regulated healthcare training authority.

Existing repository evidence includes:

- CNA / STNA pathway concepts
- Phlebotomy Technician pathway concepts
- Healthcare career-family references
- healthcare employer, hospital, and nursing-facility classifications
- regulated-program categories for Healthcare, STNA, Nursing, Phlebotomy, and EMS
- Universal Career Readiness healthcare contextualization
- a provisional Hospital Metaverse location
- pending Fire / EMS / 911 integration

Fixture and discovery records do not establish state-approved healthcare training, clinical authority, credential eligibility, licensure, or employer authorization.

## KEEP — CANONICAL

Reuse existing SHU authorities for:

- curriculum catalog and importer
- curriculum release lifecycle
- lesson experience
- assignments and learner entitlement
- Prepare / Prove
- evidence
- authorized review
- competency decisions
- Completion Policy
- Career / Career Family
- credentials
- portfolio
- accessibility and accommodations
- reporting and Truth Spine

No Healthcare-specific duplicate authority should be created.

## REUSE

### Universal Career Readiness

Reuse transferable readiness concepts including:

- professionalism
- communication
- teamwork
- safety culture
- problem solving
- reliability
- digital responsibility
- responsible AI
- accessibility
- ethics
- career planning
- evidence and self-advocacy

Healthcare should contextualize these concepts rather than duplicate them.

### Existing Healthcare Pathway Concepts

Existing pathway data includes:

- CNA / STNA
- Phlebotomy Technician
- EMT references

Use these as pathway and career-mapping references only until canonical authority is proven.

### Healthcare Career Family

Reuse canonical Career / Career Family architecture.

Do not create a Healthcare-specific career registry.

### Regulated Program Classification

Existing regulated-program classifications include:

- HEALTHCARE
- STNA
- NURSING
- PHLEBOTOMY
- EMS

These classifications do not establish regulatory authority.

### Healthcare Buyer / Partner Types

Existing types include:

- HEALTHCARE_EMPLOYER
- HOSPITAL
- NURSING_FACILITY
- TRAINING_PROVIDER

Reuse them where appropriate without treating them as curriculum or credential authority.

## EXTEND

The following are appropriate extension areas:

- Healthcare-contextualized readiness curriculum
- healthcare career mappings
- healthcare evidence opportunities
- healthcare proof activities
- Hospital Metaverse learning experiences
- healthcare accessibility scenarios
- employer and partner contextualization
- clinical and pre-certification boundary documentation

## METAVERSE

### Hospital

Classification: EXTEND

A Hospital already exists in the canonical Quick Map as provisional infrastructure.

Do not create a second Hospital coordinate system or competing location authority.

### Fire / EMS / 911

Classification: EXTEND — DEPENDENCY PENDING

MOCC already models Fire / EMS / 911 integration, but the authoritative incident / dispatch interface remains pending.

Healthcare curriculum must not fabricate operational incident authority.

## LEGACY / REFERENCE ONLY

Treat the following as reference rather than canonical Healthcare authority:

- fixture pathway pricing and duration
- mock STNA cohort/program records
- archived healthcare references
- ASL healthcare scenarios outside their actual ASL curriculum authority

## MISSING

The audit did not prove the existence of:

- governed Healthcare Workforce Readiness course
- healthcare source lesson set
- healthcare-specific proof configuration
- authoritative Hospital learning simulation
- regulated healthcare delivery partner authority
- validated clinical / credential scope matrix
- governed bridge to state- or partner-approved training

These gaps do not authorize creation of duplicate platform authorities.

## Regulatory Boundary

This course must not independently claim:

- state-approved STNA training
- nursing licensure education
- phlebotomy certification
- EMT / paramedic certification
- clinical placement authority
- clinical supervision authority
- scope-of-practice authority
- employer qualification

External authority is required wherever applicable.

## Duplicate Authority Prohibitions

This branch must not create a new:

- competency registry
- evidence engine
- verification authority
- completion engine
- assignment system
- credential authority
- career registry
- organization / tenant authority
- entitlement system
- accessibility authority
- Metaverse coordinate authority
- readiness score
- Truth-like reporting system

## Audit Decision

Healthcare Workforce Readiness is viable as an SHU readiness and preparation course.

Its current architectural position is:

Universal Career Readiness
→ Healthcare contextualization
→ Healthcare preparation/readiness
→ governed learner evidence
→ career connection
→ external regulated training where required

Proceed to blueprint.

Do not represent the course as regulated clinical training.
