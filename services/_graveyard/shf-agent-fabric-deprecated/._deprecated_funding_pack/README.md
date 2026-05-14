# Deprecated Funding Partner Pack

This folder contains archived code that previously implemented the legacy **Funding Partner Pack** integration surface.

These files were removed during the transition to the **canonical partner router and SDK discovery architecture** used by the SHF Agent Fabric.

---

## Current Canonical Funding API

The active funding integration surface is provided by the following endpoints:

- **GET** /api/funding/health — Service health check
- **GET** /api/funding/capabilities — API discovery and integration metadata
- **GET** /api/funding/discovery — Ruleset and lock-trigger index
- **GET** /api/funding/rulesets — Available funding rulesets
- **GET** /api/funding/lock-triggers — Outcome lock trigger definitions
- **POST** /api/funding/simulate — Outcome funding simulation
- **GET** /api/funding/sdk — Integration SDK examples and partner quickstart

These endpoints represent the **official partner integration interface** for the SHF Outcome Funding Engine.

---

## Purpose of This Folder

This folder exists for the following reasons:

- Preserve historical implementation for reference
- Maintain repository auditability
- Prevent accidental reintroduction of deprecated routing logic
- Document architectural evolution of the funding API

---

## Important Notice

The files contained in this directory:

- Are **not imported anywhere in the application**
- Must remain **outside the active router/module tree**
- Must **not be restored to production paths**

All active funding API logic resides in:

fabric/funding/
routers/

---

## Status

Archived / Deprecated  
Retained for reference and audit history only.
