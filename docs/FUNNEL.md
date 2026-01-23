# SHF Funnel Declaration (Locked)

Primary funnel app: **Career**

Rules:
1) Career is the default acquisition + onboarding funnel for the SHF ecosystem.
2) All other apps must be reachable from Career via:
   - direct entry links, OR
   - pathway cards, OR
   - dashboard routing.
3) If an app is marked `meta.shf.funnelPrimary=true`, App Registry MUST label it “Primary Funnel”.
4) Only one app may be Primary Funnel at a time unless explicitly declared as multi-funnel.

Implementation:
- career.manifest.json:
  - meta.shf.funnelPrimary = true
  - meta.shf.status = "SYSTEM_CORE"
  - meta.shf.fundingReady = true
