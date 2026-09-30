# Arcade Gap Matrix

## Learning Arcade Gaps

| Gap | Current state | Required target | Severity | Dependencies | Recommended build phase | Risk if ignored |
| --- | --- | --- | --- | --- | --- | --- |
| Skill Missions | Backend activities/results and Metaverse mission projections only | End-to-end mission model and UI | HIGH | route normalization, backend wiring | Phase 2+ | Learning Arcade remains catalog/demo. |
| Metaverse Job Simulator | Metaverse mission/simulation infra exists | Career-connected job sims | HIGH | Metaverse, Career, Evidence | Phase 3+ | Duplicated simulations or false claims. |
| Living Data Center Simulation | Data center curriculum/pathway/Metaverse hooks | Arcade-ready simulation | HIGH | Curriculum, Career, Metaverse | Phase 3+ | Rebuilds existing curriculum incorrectly. |
| AI Mission Director | Agent Fabric exists; Arcade previews AI | Governed adaptive director | HIGH | Agent Fabric, audit logs, policy | Phase 4+ | Unbounded AI or evidence authority violations. |
| Career Leagues | None | Career-connected competition | MEDIUM | Career, leaderboard, seasons | Phase 5+ | Entertainment/education confusion. |
| City Crisis Missions | Metaverse city mission primitives | Crisis mission flow | MEDIUM | SHF Civic, Metaverse, Evidence | Phase 4+ | Civic/CivicSure coupling mistakes. |
| SHF Civic Government Simulation | SHF Civic separate | Controlled sim integration | MEDIUM | SHF Civic APIs | Phase 4+ | CivicSure confusion. |
| Team Missions | Studio/team infra outside Arcade | Arcade co-op roles/session state | HIGH | Multiplayer, identity, telemetry | Phase 5+ | No collaborative learning evidence. |
| Evidence Replay | Attempts/events exist | Replay timeline/after-action review | HIGH | telemetry/event schema | Phase 3+ | Cannot verify decisions. |
| Build-the-Game Learning | Preview cards/dialogs | Studio-linked build learning | HIGH | Studio, moderation, curriculum | Phase 4+ | Student publishing remains unsafe or fake. |

## Classic Arcade Gaps

| Gap | Current state | Required target | Severity | Dependencies | Recommended build phase | Risk if ignored |
| --- | --- | --- | --- | --- | --- | --- |
| Game Universe | Visual room only | Real playable universe | HIGH | registry/runtime | Phase 2+ | Classic Arcade remains marketing UI. |
| Student Game Studio | Preview only | Build/test/save/publish workflow | HIGH | Studio/moderation | Phase 4+ | Unmoderated or fake creation. |
| Arcade Seasons | Preview challenge only | Season model, resets, rewards | MEDIUM | leaderboard/rewards | Phase 5+ | Competition cannot scale. |
| Tournament System | Placeholder page | Brackets/registration/results | HIGH | identity, scores, anti-cheat | Phase 3+ | Broken competition claims. |
| Spectator Mode | None | Live/replay viewer | MEDIUM | multiplayer/replay | Phase 6+ | No community viewing. |
| Arcade Economy integration | Browser ledger | Treasury-authorized rewards | CRITICAL | Treasury | Phase 2+ | Economic authority violation. |
| How Was This Built? | Dialog previews | Real source/design breakdowns | MEDIUM | creator tooling/curriculum | Phase 4+ | Educational bridge absent. |
| AI Rivals/Coaches | None | Governed bots/coaches | MEDIUM | Agent Fabric | Phase 5+ | AI features overclaimed. |
| Community Game Publishing | Fail-closed preview | Moderated registry workflow | HIGH | Studio/Registry/moderation | Phase 4+ | Safety/privacy risk. |
| Metaverse Bridge | Registry links | Kiosks/return/session bridge | MEDIUM | Metaverse | Phase 3+ | Fragmented experience. |

## Shared Platform Gaps

| Gap | Current state | Required target | Severity | Dependencies | Recommended build phase | Risk if ignored |
| --- | --- | --- | --- | --- | --- | --- |
| Common runtime | none | shared game runtime | HIGH | registry | Phase 2 |
| Registry | multiple static catalogs | canonical registry | CRITICAL | Phase 1 routes | Phase 2 |
| Identity/profile | static header | real profile | HIGH | Identity | Phase 2 |
| Save state | localStorage | server session/save | HIGH | API/database | Phase 2 |
| Achievements | local/demo | governed achievements | HIGH | Evidence/Treasury | Phase 3 |
| Leaderboards | localStorage | trusted leaderboard | HIGH | anti-cheat | Phase 3 |
| Multiplayer | none | rooms/networking | MEDIUM | realtime infra | Phase 5 |
| Competition | placeholder | tournaments/seasons | HIGH | leaderboard | Phase 3 |
| Creator tooling | external Studio | Arcade-integrated Studio | MEDIUM | Studio | Phase 4 |
| Telemetry | fragments | event schema | HIGH | runtime | Phase 2 |
| Accessibility | partial | game accessibility layer | HIGH | AX systems | Phase 2 |
| Governance | mixed claims | authority-bound APIs | CRITICAL | all authorities | Phase 1+ |
| Agent integration | none in Arcade | governed agent APIs | MEDIUM | Agent Fabric | Phase 4 |
| Metaverse integration | registry links | launch bridge | MEDIUM | Metaverse | Phase 3 |
