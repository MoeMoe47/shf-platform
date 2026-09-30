# Arcade Shared Platform Audit

## Summary

Shared Arcade platform infrastructure is PARTIAL. There are useful primitives, but no complete shared game platform runtime.

| Capability | Current system | Path/service | Owning authority | Consumers | Status | Reusable? | Conflicts / duplication | Later-phase recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Player identity | SHS auth/identity | `src/system/identity/*`, `apps/shs-api/src/auth/*`, `apps/shs-api/src/domain/identity/*` | Identity | Whole ecosystem | PARTIAL | Yes | Arcade header uses mock profile | Integrate via Identity; do not make Arcade identity authority. |
| Player profile | Career/portfolio profile surfaces | `src/pages/career/Portfolio.jsx`, Arcade header | Career/Portfolio/Identity | Career, Arcade shell | PARTIAL | Yes | Arcade static profile | Use shared identity/profile projection. |
| Game registry | Static data only | `src/data/arcade.js`, `src/pages/arcade/games/index.js`, fixtures | None canonical | Arcade pages | DUPLICATE / PARTIAL | Limited | Multiple catalogs disagree | Define registry later; do not create in Phase 0. |
| Game runtime | None | N/A | Arcade future | None | MISSING | No | N/A | Build shared runtime in later phase. |
| Session manager | Backend attempts | `apps/shs-api/src/domain/arcade/*` | Arcade for attempts only | API tests | PARTIAL | Yes | Frontend not wired | Connect actual games to attempts. |
| Save system | Browser storage | `src/utils/creditLedger.js`, leaderboard keys | None/Treasury conflict | Arcade UI | BROKEN | No for authority | Browser-only state | Replace with authoritative persistence. |
| Scoring | Backend result score validation plus local leaderboard | API service; `Leaderboard.jsx` | Arcade for raw result; not scoreboards | API; UI local | PARTIAL / BROKEN | Backend yes | Local leaderboard bypasses API | Use backend result pipeline. |
| Achievements | Local/demo | `useArcadeLedger`, fixtures | None | Arcade | PLACEHOLDER | No | Claims badges/on-chain | Use credential/evidence authority. |
| Progression | Local XP summary | `useArcadeHistory`, `creditLedger` | None/Treasury conflict | Arcade shell | PARTIAL / BROKEN | No | Browser XP | Route rewards through Treasury/Portfolio as allowed. |
| Rewards | Wallet/credit shims | `src/shared/arcade/arcadeRules.js`, `src/hooks/useRewards.js` | Treasury should own economic truth | Arcade, broader app | PARTIAL / GOVERNANCE RISK | Limited | Browser ledger can mint-like values | Preserve Treasury authority. |
| Leaderboards | Local table | `src/pages/arcade/Leaderboard.jsx` | None | Arcade | BROKEN | No | Trusted scores from localStorage | Build backend anti-cheat later. |
| Tournament engine | Placeholder | `src/pages/arcade/Tournaments.jsx` | Arcade future | Arcade | PLACEHOLDER | No | Unused `Tournament.jsx` | Build after routes normalized. |
| Matchmaking | None | N/A | Arcade future | None | MISSING | No | N/A | Later phase. |
| Multiplayer networking | Metaverse comms exist, not Arcade gameplay | `apps/shs-api/src/domain/metaverse/communication/*` | Metaverse communication | Metaverse | MISSING for Arcade | Maybe | Different authority | Reuse policy, not gameplay assumptions. |
| Spectator/replay | None in Arcade | N/A | Arcade future | None | MISSING | No | N/A | Later phase. |
| Telemetry | Analytics/local/outbox fragments | `track`, `useArcadeLedger`, API outbox | Product analytics vs evidence separate | Arcade | PARTIAL | Yes with cleanup | Local telemetry mixed with evidence language | Separate telemetry from evidence. |
| Input manager | None | N/A | Arcade future | None | MISSING | No | N/A | Later phase. |
| Audio manager | Global click sounds only | `src/utils/globalButtonClickSound.js` | Shared UI | Apps | PARTIAL | Maybe | Not game audio | Build game audio separately. |
| Accessibility | System-wide AX layers | `src/system/accessibility/*`, `apps/shs-api/src/domain/accessibility-*` | Accessibility | Ecosystem | PARTIAL | Yes | Arcade has touch target failure | Reuse profiles and assurance gates. |
| Creator tools | Studio and agent package outside Arcade | `apps/shs-api/src/domain/studio/*`, `apps/shs-api/src/domain/agent-package/*` | Studio/Agent Fabric/Registry | Curriculum/Studio | PARTIAL | Yes | Arcade previews only | Integrate, do not rebuild. |
| Moderation | Not found for Arcade publishing | N/A | Future creator/moderation | None | MISSING | N/A | Publishing fail-closed | Required before community publishing. |
| Asset management | Static assets | `public/assets/arcade/*` | Frontend/static | Arcade pages | PARTIAL | Yes | No registry/versioning | Create asset registry later. |
| Agent Fabric integration | Agent systems exist | `services/shf-agent-fabric/*`, `apps/shs-api/src/domain/agent-*` | Agent Fabric | Admin/API | PARTIAL | Yes | Arcade does not call it | Controlled APIs only. |
| Metaverse launch bridge | Registry/orchestration references | `apps/shs-api/src/domain/metaverse/*` | Metaverse | Metaverse, Arcade references | PARTIAL | Yes | No playable game handoff | Later phase bridge. |
| Notifications | Notification domain exists; Arcade page exists | `apps/shs-api/src/domain/notifications/*`, `src/pages/arcade/ArcadeNotifications.jsx` | Notifications | Apps | PARTIAL | Yes | Arcade notification touch target broken | Use notification authority. |
| Entitlements | Permission guard/API | `apps/shs-api/src/auth/permission-guard.ts` | Identity/Auth | API | PARTIAL | Yes | Frontend mostly ungated preview | Add route/API entitlements later. |
