# Funding Relationship Matrix

| Funding relationship | Evidence | Rule |
|---|---|---|
| Grants | Funding grants domain and SHF reporting/funding docs exist | Potential only unless authoritative eligibility and award source is connected. |
| Workforce funding | SHF-Next employer incentive architecture exists | Compatibility is not eligibility; eligibility is not approval; approval is not payment. |
| Employer contributions | Data Center/employer validation and WBL concepts exist | Employer support requires agreement and source evidence. |
| Apprenticeship funding | Architecture supports it conceptually | Registered Apprenticeship and local policy authority missing. |
| Union partnerships | Mentioned as category in Data Center docs/fixtures | Partner category is not commitment. |
| Philanthropy | SHF sponsorship/community program classes plausible | Tax/legal review required; no deductibility claims. |
| Sponsorship | Multiple sponsorship classes plausible | Separate from product sales and tax treatment. |
| Institutional purchasing | SHS platform/service candidates plausible | Requires procurement/legal/commercial contracts. |
| Commercial SHS revenue | SHS software/professional services plausible | Requires product registry, pricing, margin, commission fields. |

The Product Registry should store `funding_relationship_status` using `POTENTIAL`, `DOCUMENTED`, `VERIFIED`, `NOT_FOUND`, and `REVIEW_REQUIRED`, plus provenance. It must not convert potential into eligibility.
