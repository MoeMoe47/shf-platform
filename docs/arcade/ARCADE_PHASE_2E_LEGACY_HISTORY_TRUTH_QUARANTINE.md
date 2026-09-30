# Phase 2E Legacy Arcade History Truth Quarantine

## Purpose

`useArcadeHistory` reads historical frontend-era entries from the local credit-ledger compatibility API. Those rows are retained for compatibility and forensic review while Phase 2F server-backed Arcade Result history remains deferred. They are not canonical outcomes.

Legacy Arcade history may preserve historical frontend-era activity for compatibility and forensic review, but it does not establish verified learning outcomes, mastery, evidence, credentials, reward entitlement, Treasury value, credit, or institutional blockchain proof.

The canonical verification chain remains:

`Arcade Result → Reviewed Verified Evidence → signed Agent Fabric ingestion → Truth Spine`

Phase 2E changes only frontend history presentation and its local compatibility read model. It does not alter that chain or any of its authorities.

## Contract Changes

- Public history rows retain bounded display fields and add `source: "legacy_local_history"` and `authoritative: false`.
- Historical XP, EVU, credit, on-chain, and transaction-hash values, when present, live only under `legacyOutcomeMetadata` for forensic compatibility. They are not shown or exported as current results.
- Summary data contains entry/session-like row counts, distinct games, distinct event types, latest timestamp, source, and the non-authoritative marker. It does not total rewards, XP, EVUs, credits, or proof counts.
- SEL/workforce tags remain historical discovery labels, not verified skills.

## History Surfaces

`src/router/ArcadeRoutes.jsx` routes `/history` to `src/pages/arcade/History.jsx`; this is the single live history surface. `ArcadeHistory.jsx` had no live importer and contained its own XP/EVU/on-chain aggregation plus an incorrect hook import. It is retained only as a compatibility redirect to `/history`, with no second model.

The routed page is titled “Arcade History,” labels entries as legacy activity, and describes verified outcomes as owned by Arcade Result, Verified Evidence, and Truth Spine. Its summary cards show History Entries, Distinct Games, and Activity Types. Event labels are explicitly presented as legacy events.

## CSV and Shared Components

The download is named “Download CSV (Arcade History)” and exports only timestamp, learner display identifiers, historical event/game labels, cohort/location/device, descriptive tags, source, and authoritative status. Legacy outcome metadata is excluded.

`ArcadeActivitySummary` now uses history-entry, activity-type, and games-seen counts. Rank and the home tournament value remain explicitly marked demo. Recent activity is labeled a legacy entry. `ArcadeSidebar` retains its rewards-card geometry and `/rewards` destination but displays only “Managed by the rewards system” and “View Rewards”; it no longer reads history or computes XP/level progress.

Dashboard comments were corrected where they described local history as real rewards/session truth. Northstar’s unsupported reporting scaffold language was bounded, and its development compatibility call uses `ARCADE_EVENTS.BADGE_CLAIMED`.

## Deferred Work and Boundaries

Phase 2E does not create a Result history API, server endpoint, canonical history UI, gameplay/runtime, leaderboard backend, Treasury integration, evidence replay, Polygon verification, credentials, or a rewards engine. Phase 2F owns server-backed history.

No Arcade Activity, Attempt, Result, outbox, Verified Evidence, signed-ingestion, Truth Spine, Treasury, Curriculum, Career, Identity, Metaverse, Studio, Registry, Moderation, migration, source catalog, Phase 2A descriptor, Phase 2B adapter, or ArcadeLibrary implementation was changed. No Activity ID or authority claim was introduced.

The governing principle remains **SEPARATE AUTHORITIES, SHARED COORDINATION**.
