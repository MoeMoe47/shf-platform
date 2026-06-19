# SHS Operator Runbook V1 - Phase 1: Lead Intake

Created: 2026-06-19

Mode: documentation and audit only. No features, routes, services, pages, refactors, runtime behavior changes, deletes, moves, or commits were performed.

## Goal

Take a new SHS lead from first interest to qualified opportunity.

This phase ends when the lead is ready for Sales Handoff.

## Entry Condition

Start Phase 1 when a person or organization expresses interest in SHS through any of these sources:

- Public Request Demo form.
- Direct email or phone.
- Partner referral.
- Hub Growth signal.
- Hub Opportunities board.
- Existing ClientOps upgrade opportunity.
- Manual operator entry.

## Exit Condition

Ready for Sales Handoff.

A lead is ready for Sales Handoff when the operator has recorded:

- Lead source.
- Contact information.
- Organization/client details.
- Industry.
- Problem they need solved.
- Budget range or a discovery action to resolve budget.
- Timeline.
- Initial package recommendation.
- Qualification checklist result.
- Owner.
- Next action.

## Current Routes / Pages

### Usable V1 Operator Routes

| Route | Page | Status | Notes |
| --- | --- | --- | --- |
| `admin.html#/hub/sales-pipeline` | `src/pages/hub/HubSalesPipelinePage.jsx` | Usable sales review surface | Tracks pipeline items, stages, estimated value, priority, due dates, next action, notes, review events, and links to Opportunities and Bundle Builder. |
| `admin.html#/hub/opportunities` | `src/pages/hub/HubOpportunitiesPage.jsx` | Usable opportunity context surface | Tracks opportunity signals, buyer, source, value, urgency, stage, partner/package context, and next actions. |
| `/solutions.html#/request-demo` | `src/pages/solutions/SHSRequestDemoPage.jsx` | Public interest source surface | Collects public demo/contact fields, but no runtime submit/persistence handler was found in this audit. |

### Missing or Incomplete Routes

| Route | Page | Status | Notes |
| --- | --- | --- | --- |
| `/sales.html#/leads` | `src/pages/sales/Leads.jsx` | Stub | Renders only `Leads - stub`; not sufficient as the V1 operator lead intake surface. |
| `admin.html#/hub/lead-intake` | Not found | Missing | No dedicated SHS Lead Intake admin route/page was found. |

### Navigation Finding

`src/components/admin/AdminSidebar.jsx` exposes Production Ops, Operations, Analytics, and System sections. It does not currently expose a direct Sales Pipeline or Lead Intake link.

## Required Data Fields

| Field | Required | Notes |
| --- | --- | --- |
| Lead source | Yes | Demo request, referral, event, partner, existing client, growth signal, manual. |
| First name | Yes | Primary contact. |
| Last name | Yes | Primary contact. |
| Work email | Yes | Required for follow-up. |
| Phone | Optional | Capture if provided or needed for urgent follow-up. |
| Organization / client name | Yes | Organization, company, agency, or client. |
| Organization type | Yes | Nonprofit, government, funder, workforce/education, program operator, business, other. |
| Role / title | Yes | Decision-maker, influencer, operator, funder, technology partner, etc. |
| Industry | Yes | Healthcare, home care, legal, nonprofit, workforce, logistics, education, professional services, etc. |
| Problem to solve | Yes | One clear sentence. |
| Budget range | Yes | If unknown, mark unknown and assign discovery action. |
| Timeline | Yes | Urgent, within 2 weeks, 2-4 weeks, 1-2 months, just exploring. |
| Package recommendation | Yes | Initial SHS package recommendation. |
| Qualification status | Yes | New, needs discovery, qualified opportunity, nurture, disqualified. |
| Owner | Yes | SHS operator or sales owner. |
| Next action | Yes | Concrete next step. |

## Operator Checklist

1. Capture the lead source.
2. Capture contact information: first name, last name, work email, and phone if available.
3. Capture organization/client details: organization name, organization type, role, and geography if relevant.
4. Capture industry or operating sector.
5. Summarize the problem they need solved in one plain-language sentence.
6. Capture budget range or mark unknown and schedule discovery to resolve it.
7. Capture timeline or preferred demo timeframe.
8. Recommend an initial package based on problem, industry, urgency, and budget.
9. Run qualification checklist.
10. Assign owner and next action.
11. Move to Ready for Sales Handoff only when required fields and qualification decision are complete.

## Package Recommendation Rules

| Lead Need | Initial Recommendation |
| --- | --- |
| Public website, template, brand, or simple service page | Website Studio / WebMaker Starter |
| Operational dashboard, workflow, roles, internal process, team visibility | Operations OS |
| Client portal, onboarding, support, knowledge base, client delivery | Client Delivery OS |
| Scheduling, routing, dispatch, logistics, field coordination | Dispatch OS |
| Reporting, verified outcomes, proof, audit trail, funder/leadership visibility | Reporting + Verification Layer |
| Multi-system build with workflow, website, reporting, and ClientOps | Full SHS Operating System Build |

## Qualification Checklist

| Item | Pass Condition |
| --- | --- |
| Clear problem | The lead can name the operational or public-facing problem SHS would solve. |
| Real organization | Organization/client identity and contact are known. |
| Decision context | The contact is a decision-maker, influencer, or can introduce one. |
| Budget fit | Budget range is known or discovery is scheduled to resolve it. |
| Timeline fit | Timeline is known and not incompatible with SHS capacity. |
| Package fit | At least one SHS package maps to the problem. |
| Risk screen | No obvious privacy, security, legal, or public-claim blocker prevents discovery. |
| Next action | A concrete next action and owner are assigned. |

## Definition of Done

Phase 1 is complete when:

- Lead source is recorded.
- Contact and organization details are recorded.
- Industry and problem statement are recorded.
- Budget range and timeline are recorded or explicitly marked unknown with discovery action.
- Initial package recommendation is recorded.
- Qualification checklist has pass/fail notes.
- Owner and next action are assigned.
- Lead status is Qualified Opportunity or Nurture/Disqualified with reason.
- If qualified, the lead is ready to appear in Sales Pipeline or Production Handoff review.

## Findings

- SHS has a usable Hub Sales Pipeline route for sales review: `admin.html#/hub/sales-pipeline`.
- SHS has a usable Hub Opportunities route for opportunity context: `admin.html#/hub/opportunities`.
- The public Request Demo page collects many lead fields, including contact, organization, role, problem, source, and timeframe.
- No dedicated Lead Intake admin page was found.
- The Sales app `/sales.html#/leads` page exists but is a stub.
- Budget range is not clearly collected in the public Request Demo form.
- Package recommendation and qualification status are operator-derived today, not a dedicated intake workflow.

## Launch Blockers

- No dedicated lead intake route/page for first-interest to qualified opportunity.
- Public Request Demo form appears presentational; no submit/persistence handler was found.
- Sales Leads route is a stub.
- Budget range and package recommendation are not captured in the public lead form.
- AdminSidebar does not expose a direct Sales Pipeline or Lead Intake link.
- No single lead qualification record schema was found for the operator to complete before Sales Handoff.

## Post-V1 Improvements

- Create a dedicated Lead Intake page or make `/sales.html#/leads` fully functional.
- Persist Request Demo submissions into a review queue.
- Add budget range, package interest, and urgency fields to lead intake.
- Add qualification status and owner assignment workflow.
- Add direct AdminSidebar navigation to Sales Pipeline or Lead Intake.
- Connect Qualified Opportunity to Sales Handoff without duplicate manual entry.
- Add basic duplicate lead detection by email/domain/organization.

## V1 Complete?

Yes for Phase 1 runbook documentation.

No for runtime product completeness. The runbook can be used by an operator today, but the product still lacks a dedicated Lead Intake surface and persistent lead intake flow.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `python3 -m json.tool docs/operator-runbook/SHS_OPERATOR_RUNBOOK_PHASE_1_LEAD_INTAKE.json` | PASS | JSON report is valid. |
| `npm run build` | PASS | Build completed; existing Vite large-chunk warning remains. |
| `npm run check:governance` | PASS | Governance checks passed, including registry, Truth Spine, Oracle, AI Guardrails, Game Theory, and duplicate cleanup checks. |
