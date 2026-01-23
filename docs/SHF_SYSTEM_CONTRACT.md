# SHF System Contract (Official)

This contract defines the minimum metadata every SHF app must publish via its manifest, so the platform can:
- enforce compliance
- control risk (PILOT vs SYSTEM)
- prove funding readiness
- standardize capabilities across apps

## Required (Schema)
Each app manifest MUST include:
- contractVersion (integer >= 1)
- id (string)
- name (string)
- entry (string)
- routes (string path beginning with "/")
- layout (string)
- shellCss (string)
- capabilities (object)

## SHF Contract Block (Platform Standard)
Each manifest SHOULD include a `contract` object:

contract:
  owner: "SHF"
  riskTier: "low" | "medium" | "high"
  dataAccess: ["local" | "api" | "ledger" | "pii"]
  fundingEligible: ["ESSA" | "PerkinsV" | "WIOA" | "IDEA" | "Medicaid" | "Other"]
  killSwitch: true|false
  pilotGate: true|false

### Definitions
- Funding Ready:
  - contract.fundingEligible has at least one lane
  - contract.killSwitch === true
  - contract.riskTier is "low" or "medium"
- Pilot Only:
  - contract.pilotGate === true
- System Core:
  - app is designated core (platform dependency or governance)
- Funnel:
  - app is designated the primary entry path (Career)

