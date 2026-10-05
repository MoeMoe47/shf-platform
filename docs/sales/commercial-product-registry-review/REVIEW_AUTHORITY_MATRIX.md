# Review Authority Matrix

No gate is APPROVED in the 4B manifest. The cited Design-2 references document prior statuses only; they are not approvals. A reviewer must be authorized for the gate, and must record an authority/reference, identity, decision time, scope, and staleness/expiry basis.

| Gate | Canonical Authority | Acceptable Evidence | Who Cannot Approve | Required Provenance / Staleness |
|---|---|---|---|---|
| COMMERCIAL_READINESS | Commercial product governance owner | Documented readiness review tied to evidence and accountable delivery scope | Sales editor alone | Reviewer identity, source/evidence reference, reviewed_at; expiration when evidence/source becomes stale |
| LEGAL | Qualified legal authority | Documented legal review or approved legal record | Sales, product, or delivery staff without delegated legal authority | Authority/reference, reviewer, decision time, scope, expiry/review trigger |
| TAX | Qualified tax authority | Documented tax analysis for the actual entity and transaction structure | Sales or non-tax program staff | Authority/reference, entity/structure scope, reviewer, decision time, review trigger |
| REGULATORY | External regulator, approved partner authority, or verified regulatory source | Current external rule, approval, license, or partner authorization applicable to exact scope | SHU/SHF/SHS by assertion; Sales; unrelated regulator | External authority and scope reference, version/status, reviewer, date/expiry |
| PROCUREMENT | Buyer procurement authority / documented procurement source | Published procurement requirements or recorded buyer-side determination | Sales assumption | Reference, jurisdiction/buyer scope, checked date and expiry |
| FUNDING | Funding program/source authority for product compatibility only | Published program criteria or documented relationship supporting compatibility | Registry or Sales as customer eligibility/award authority | Source/category/reference, status, checked date; never a customer eligibility decision |
| DELIVERY_CAPACITY | Named delivery owner / operations authority | Capacity plan, staffing or partner commitment for the scoped offer | Product existence, marketing, or Sales forecast | Owner, scope, capacity evidence reference, checked date and review interval |
| EVIDENCE | Evidence / Truth Spine authority and claim owner | Verified evidence with provenance for each material claim | Sales copy or unverified marketing statement | Evidence reference, claim scope, verification state, verified_at/staleness |
| SUPPORT | Named support/service owner | Approved support model, coverage and escalation record | Sales or product existence alone | Owner, support reference/tier, scope, reviewed_at and expiry |
| PRICING | Future approved pricing authority / approved pricing record | Governed pricing record with effective dates and currency | Sales or onboarding importer | Pricing authority/reference, effective period, reviewer and status; no inferred amount |
| MARGIN | Approved finance/cost authority | Governed cost/margin record or policy for the offer | Sales, Product Registry, or inferred price/cost | Finance authority/reference, scope, effective period, reviewer |
| COMMISSION | Approved commission policy authority | Published policy reference and explicit product eligibility review | Sales, importer, or payout calculation | Policy authority/reference, reviewed status/date; no rates or calculations |
| ENTITLEMENT | Service Catalog / Entitlements authority | Canonical entitlement IDs and status references | Product Registry duplicating entitlement definitions | External entitlement IDs, authority and reference/status; source freshness |
| PARTNER | Partner relationship/legal authority and accountable delivery owner | Executed/approved partner record or documented authorization for scoped delivery | Assumed partner, generic product metadata, or Sales assertion | Partner authority/reference, scope, owner, effective dates and review trigger |

`APPROVED` is invalid without a gate-specific authority/reference and actual reviewer evidence. `NOT_REQUIRED` likewise needs authority explaining why the gate does not apply. `UNKNOWN` is not approval and fails closed. Funding review is product compatibility only, never buyer eligibility.
