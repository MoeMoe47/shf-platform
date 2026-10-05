# Implementation Plan

This plan is future work only. It does not approve implementation.

## Recommended Sequence

A. Registry authority/contracts

- Approve canonical vocabularies.
- Approve source authority contract.
- Approve mock-to-system read-model mapping.
- Approve governance capabilities and gate semantics.
- Write validation tests that fail closed.

B. Schema/migration

- Create tables only after authority/contracts are approved.
- Include product, source reference, gate, relationship, and provenance structures.
- Preserve the distinction between registry-owned commercial metadata and projected source authority.

C. Repositories/services

- Build repository and service layer.
- Enforce state transition and source authority rules.
- Reject `SELL_NOW` when source authority, gates, pricing status, support readiness, entitlement readiness, or delivery readiness is missing.

D. Read API

- Expose Sales-safe read model.
- Include blockers and provenance.
- Return explicit `NOT_CONNECTED`, `BLOCKED`, `STALE`, and `UNKNOWN` states instead of mock data.

E. Admin governance

- Build controlled review workflows.
- Separate product steward, source authority, pricing, legal/regulatory, and sellability approvals.
- Prevent any single Sales role from self-approving all controls.

F. Sales read integration

- Replace demo/static product cards with registry-backed read models.
- Preserve fail-closed behavior.
- Use the official mock-to-system mapping as the UI contract.

G. Readiness review workflow

- Add evidence-driven readiness transitions.
- Prevent manual promotion without authority.

H. Pricing authority integration

- Reference pricing authority without embedding uncontrolled prices.
- Keep actual price values outside this registry unless a future pricing authority explicitly approves a controlled contract.

I. Solution Builder integration

- Consume registry read contract.
- Exclude blocked or unsellable products.
- Disable future Add to Solution behavior when readiness, sellability, gates, source verification, or Solution Builder authority is unavailable.

J. Revenue/commission integration

- Integrate with future Revenue Command, deal approval, commission policy, and leadership override systems.
- Keep recruiting separate from product revenue.

## First Approved Implementation Phase To Request

Request approval only for `A. registry authority/contracts`.

Do not implement schema, migrations, APIs, UI, pricing, commission, Solution Builder, or SHF-Next changes until that phase is separately approved.

