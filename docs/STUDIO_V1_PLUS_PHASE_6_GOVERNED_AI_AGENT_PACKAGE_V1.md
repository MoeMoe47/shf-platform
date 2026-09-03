# Studio V1+ Phase 6: Governed AI Agent Package V1

## Executive Result

Phase 6 establishes a durable, provider-neutral Agent Package authority for an exact finalized `AI_AGENT` Studio revision. Package generation validates and stores a normalized definition for later Registry submission; it does not submit, execute, certify, credential, deploy, or complete anything.

## Current Agent Architecture

Studio currently owns the canonical Agent workspace shape: `name`, `instructions`, and bounded string `tools`. Studio QA validates shape and required name/instructions. Existing Agent Fabric and workflow modules are administrative/supporting safety infrastructure, not a Registry package authority and not a runtime execution path. SHF-Next remains reference-only and was not modified.

## Package Authority and Exact Revision

`studio_agent_packages` is the sole Phase 6 durable package record. It is created only from a student-destination, finalized Studio delivery whose `AI_AGENT` project and workspace revision match. The package captures that exact revision and never reads mutable latest state after source selection. A later revision requires a new QA, review, delivery, and explicit package-generation request.

Package version is the positive Studio workspace revision number. `agent-standard-v1` and `studio-agent-package-v1` identify the validation and storage contracts. The database identity `(organization, tenant, project, delivery, revision, standard)` and service lookup make generation idempotent.

## Package Content

The normalized definition contains Agent identity, instructions as purpose, empty canonical capability and permission declarations until those are supported by Studio, bounded declared tools, provider-neutral metadata, and a safety policy whose execution state is `NOT_AUTHORIZED`, requires human approval, and prohibits secret access, authority mutation, Registry submission, credential issuance, and ClientOps dispatch. Organization, tenant, learner, source delivery, exact revision, hash, schema, validation, and timestamps are server-owned.

No API keys, tokens, passwords, private keys, environment contents, database strings, session data, arbitrary executable code, or provider credentials are package content. Tool declarations are strings only and reject path traversal and executable-shaped declarations. Markup and secret-shaped values are rejected.

## Standard Validation and Readiness

Local validation returns `VALID` or `INVALID` with bounded errors/warnings and `agent-standard-v1`. `READY_FOR_REGISTRY` is a derived read state for a valid package only; it is not Registry acceptance, certification, production approval, or runtime authorization. Invalid package data does not rewrite Studio finalization, Evidence, Completion, Portfolio, Deployment, or any Registry state.

## Persistence, Authorization, and API

Migration `077_governed_agent_package.sql` creates the scoped package table, project/delivery/learner foreign keys, AI Agent and tenant checks, immutable-content storage boundary, identity uniqueness, and scope/project indexes. There is no package update endpoint. Authenticated routes are:

- `POST /studio/projects/:projectId/agent-packages`: derive, normalize, validate, and idempotently generate.
- `GET /studio/projects/:projectId/agent-packages`: list packages the learner owns or an authorized package manager may view.
- `GET /agent-packages/:packageId`: read one scoped package.

Learners may generate/read their own packages. Organization administrators may manage scoped package reads/generation through the dedicated permission. Cross-learner and cross-organization access fail closed. No client authority fields are accepted by the create route.

## Events and Boundaries

Successful first generation emits `agent.package.created` and exactly one validation result event through the integration outbox. Idempotent generation emits no duplicate events. Package events are not Evidence, Completion, Credential, Truth Spine, Deployment, Registry, or ClientOps events. Package generation performs no runtime/provider invocation and no external network call.

## Student Seam

The existing Studio Agent project shell shows `Prepare Agent Package` after the existing institutional panels. A valid package is presented as `Agent Package Ready` and `Ready for Registry`; invalid or unavailable states are truthful and bounded. The seam does not expose Registry submission, raw internal IDs, secrets, runtime controls, or new authority.

## Database Integrity and Tests

The additive migration was replayed on a fresh disposable PostgreSQL 16 cluster through migration 077: 77 applied, zero pending, zero drift, zero unknown, and strict schema integrity passed. The live authenticated golden path created and finalized an AI Agent through the existing Studio UI, generated one durable valid package, repeated generation idempotently, reloaded the status from the API, and confirmed exactly two package outbox events. Invalid finalized-source behavior remains bounded by local validator/service coverage; current Studio QA normally prevents an invalid Agent from reaching finalization.

## Phase 7 Entry Contract

Phase 7 may add an explicit authenticated Registry client and submission record/status domain. It must submit a selected immutable package version only, preserve package history, and keep Registry acceptance separate from Studio finalization, Evidence, Completion, credentials, and production runtime authorization. Phase 7 must not make package generation submit automatically or execute an Agent.
