# Implementation Plan

This plan is future work only. It does not approve implementation.

## Recommended Sequence

A. Registry authority/contracts

- Approve canonical vocabularies.
- Approve source authority contract.
- Approve governance capabilities and gate semantics.
- Write validation tests that fail closed.

B. Schema/migration

- Create tables only after authority/contracts are approved.
- Include product, source reference, gate, relationship, and provenance structures.

C. Repositories/services

- Build repository and service layer.
- Enforce state transition and source authority rules.

D. Read API

- Expose Sales-safe read model.
- Include blockers and provenance.

E. Admin governance

- Build controlled review workflows.
- Separate product steward, source authority, pricing, legal/regulatory, and sellability approvals.

F. Sales read integration

- Replace demo/static product cards with registry-backed read models.
- Preserve fail-closed behavior.

G. Readiness review workflow

- Add evidence-driven readiness transitions.
- Prevent manual promotion without authority.

H. Pricing authority integration

- Reference pricing authority without embedding uncontrolled prices.

I. Solution Builder integration

- Consume registry read contract.
- Exclude blocked or unsellable products.

J. Revenue/commission integration

- Integrate with future Revenue Command, deal approval, commission policy, and leadership override systems.
- Keep recruiting separate from product revenue.

## First Approved Implementation Phase To Request

Request approval only for `A. registry authority/contracts`.

