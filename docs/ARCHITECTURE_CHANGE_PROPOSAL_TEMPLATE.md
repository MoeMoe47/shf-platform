# Architecture Change Proposal Template

## Proposed Change

Describe the requested new layer, route family, major system, or governance-sensitive feature.

## Existing Layer Affected

Name the existing Master Layer Registry layer or layers affected by the proposal.

## Why Existing Layers Cannot Support It

Explain why the work cannot fit inside an existing registered layer.

## Missing Support Need

Describe the safety, scale, reporting, governance, funding, or operations capability that is missing.

## Safety/Governance/Reporting/Funding Reason

State the required reason for introducing or changing architecture.

## Truth Spine Impact

Explain whether claims, sources, Truth Packages, public approval, or report readiness are affected.

## Watchtower Impact

Explain new coverage, drift, risk, or anomaly monitoring requirements.

## LOO Impact

Explain outcome ranking or trust metadata impact.

## Alignment Impact

Explain action gates, containment, or policy alignment impact.

## Reports Impact

Explain report metadata, readiness, public communication, and export impact.

## Rollback Plan

Describe how to remove or disable the change without bypassing Truth Spine or breaking registered layers.

## Approval Checklist

- Master Layer Registry updated if a new layer or boundary change is required.
- Truth Spine impact reviewed.
- Watchtower impact reviewed.
- LOO impact reviewed.
- Alignment impact reviewed.
- Reports impact reviewed.
- `npm run check:governance` passes.
