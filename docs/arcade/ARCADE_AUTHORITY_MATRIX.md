# Arcade Authority Matrix

Principle preserved: SEPARATE AUTHORITIES, SHARED COORDINATION.

| Domain | Canonical authority | Arcade relationship | Permitted Arcade actions | Prohibited Arcade actions | Current API/event/interface | Current violations or duplications |
| --- | --- | --- | --- | --- | --- | --- |
| Identity | Identity/Auth | Consume authenticated user/org context | Read scoped identity, enforce permissions | Create identity truth | Dev token/auth guards; `requirePermission` | Arcade UI uses static mock profile. |
| Organization | Organization/Identity | Scope attempts/results | Use active organization context | Cross-tenant reads/writes | `organization_id`, `tenant_id` in Arcade API | Backend good; frontend mostly ungated. |
| Curriculum | Curriculum | Link lessons to Arcade activities | Reference activities, receive result projections | Become curriculum authority | `curriculum_lesson_arcade_activities`; completion policies | UI lesson links generic `/games`, no specific launch. |
| Arcade | Arcade | Own game/activity runtime and raw attempts/results | Define activities, attempts, raw results | Create institutional truth alone | `/arcade/activities`, `/arcade/attempts`, `/arcade/results` | UI bypasses backend. |
| Career | Career | Consume career mappings/context | Link to career pathways, display non-authoritative context | Issue career eligibility | Career API/routes | Static workforce tags overclaim. |
| Portfolio | Portfolio | Receive eligible evidence/artifact projections | Link to portfolio | Write portfolio artifacts directly | Portfolio API | No direct violation found. |
| Evidence | Verified Evidence | Receive Arcade result event | Emit source result event | Verify evidence by itself | `arcade.resulted` outbox to `shs-verified-evidence` | Good backend boundary; frontend local events overclaim proof. |
| Truth Spine | Truth Spine | Downstream authority only | Provide source record through evidence pipeline | Create truth claims | Verified evidence adapter | No direct Arcade truth writes found. |
| Reporting | Reporting | Consume verified/approved results | Provide source metrics | Publish impact truth | Reporting adapters | History page uses browser ledger for funder-style reports. |
| Treasury | Treasury | Reward/economy integration only | Request authorized rewards | Mint/control SHF dollars/credits | Treasury app/routes; local credit shims | `creditLedger` local currency/credits and Arcade rules conflict with Treasury authority. |
| Agent Fabric | Agent Fabric | Governed agent support | Request bounded agent assistance | Autonomous evidence/authority decisions | Agent Fabric services/API | Arcade AI features are placeholders. |
| Metaverse | Metaverse | Launch/mission bridge | Link destinations, consume mission relations | Own metaverse mobility/simulation authority | City registry, mission APIs | Arcade routes embedded in Metaverse registry; no authority transfer. |
| SHF Civic | SHF Civic | Potential civic learning sim integration | Link civic simulations | Collapse Civic into Arcade | `apps/shs-api/src/domain/shf-civic/*` | No Arcade coupling found. |
| CivicSure | Government assurance/CivicSure | Separate | None except explicit separate navigation | Use CivicSure as civic simulation | `src/pages/civicsure/*` | No Arcade coupling found. |
| Accessibility | Accessibility authority/layer | Consume profile and assurance | Adapt UI, report issues | Approve accommodations | AX domains/system | Arcade has failing touch target. |
| Notifications | Notifications | Receive/show notifications | Display routed notifications | Own notification authority | Notification API/domain | Arcade notifications page partial. |
| Creator publishing/moderation | Studio/Registry/Moderation future | Submit games after review | Request publish through governed workflow | Self-publish unmoderated games | Studio/registry APIs | Arcade correctly fail-closes publishing but creator UI is placeholder. |
