# Arcade Integration Matrix

## Learning Arcade

| Relationship | Current status | Evidence | Phase 0 finding |
| --- | --- | --- | --- |
| Learning Arcade <-> Curriculum | PARTIAL | `ArcadeMissionCard`, `curriculum_lesson_arcade_activities` | Definition linkage exists; specific launch missing. |
| Learning Arcade <-> Career Center | PARTIAL | sidebar/top nav links; static workforce tags | Navigational only; no verified career unlocks. |
| Learning Arcade <-> Portfolio | PARTIAL | Portfolio backend consumes canonical results; Arcade does not write | No direct Arcade portfolio flow. |
| Learning Arcade <-> Evidence | PARTIAL | `arcade.resulted` outbox | Backend only; UI not wired. |
| Learning Arcade <-> Truth Spine | PARTIAL | Verified evidence/truth projection layers | Indirect and authority-preserving. |
| Learning Arcade <-> Metaverse | PARTIAL | city registry and mission arcade relations | Destination/projection links; no game handoff. |
| Learning Arcade <-> SHF Civic | MISSING / PARTIAL potential | SHF Civic domain separate | No Arcade civic simulation. |
| Learning Arcade <-> Treasury | BROKEN / PARTIAL | local credit ledger and rules | Browser credits conflict with Treasury authority. |
| Learning Arcade <-> Agent Fabric | MISSING / PARTIAL potential | Agent Fabric exists; Arcade previews AI lab | No governed mission director integration. |

## Classic Arcade

| Relationship | Current status | Evidence | Phase 0 finding |
| --- | --- | --- | --- |
| Classic Arcade <-> Identity | PARTIAL | shell profile mock | No real player profile wiring. |
| Classic Arcade <-> Treasury | BROKEN / PARTIAL | local ledger/reward shims | Economic authority not canonical. |
| Classic Arcade <-> Career | PARTIAL | tags and links | Introductory only. |
| Classic Arcade <-> Curriculum | PARTIAL | How Was This Built preview | No implemented learning handoff. |
| Classic Arcade <-> Agent Fabric | MISSING | AI behavior previews only | No AI rivals/coaches. |
| Classic Arcade <-> Metaverse | PARTIAL | Simulation Hall route in registry | No playable kiosk/return. |
| Classic Arcade <-> Creator systems | PLACEHOLDER | Create/My Studio/Showcase dialogs | Publishing fail-closed. |

## Shared Platform

| Relationship | Current status | Evidence | Finding |
| --- | --- | --- | --- |
| Shared platform <-> both Arcades | PARTIAL | shared shell, ledger hooks, backend attempts | Shell shared; game platform missing. |
| Inappropriate coupling | PRESENT | Browser ledger, on-chain badge claims | UI creates reward/proof impressions without authority. |
| Duplicate authority | PRESENT | multiple catalogs, local leaderboard | Needs Phase 1/2 cleanup after route normalization. |
