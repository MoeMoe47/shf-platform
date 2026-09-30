# Arcade Phase 2D Legacy Authority Quarantine

## Purpose

Phase 2D quarantines the legacy browser-side Arcade write path. The former rule table assigned XP, tokens, EVUs, credit score changes, skill impact, and Polygon actions in the browser. The ledger hook then wrote to the credit ledger and wallet and could submit Polygon transactions. Those mechanisms were not canonical Arcade Result or Treasury decisions.

**SEPARATE AUTHORITIES, SHARED COORDINATION.**

The Arcade frontend may describe interaction intent, but it does not authorize or create XP, tokens, EVUs, credit scores, verified skills, credentials, mastery, evidence, rewards, or institutional blockchain proof.

## Quarantined Rules and Hook

`arcadeRules.js` is legacy compatibility metadata only. Event labels remain available for existing callers, but each rule is marked non-authoritative and has zero/no-write wallet and credit values, empty skill arrays, `onChain: false`, and `polygon.actionType: "none"`. The exported delta resolvers always return zero/empty results regardless of legacy game metadata.

`useArcadeLedger` keeps its public hook shape and `recordArcadeEvent(eventType, payload)` signature. The function returns `accepted: false`, `legacyCompatibility: true`, and `LEGACY_BROWSER_AUTHORITY_DISABLED`, with zero deltas and no game outcome. It does not write to a ledger or wallet, call Polygon, or call an Arcade Result API. It does not infer Activity IDs.

The two development panels now describe their calls as legacy compatibility events and state that no institutional outcome is recorded.

## Authority Boundaries

- The backend Arcade Result workflow remains the canonical source for Arcade outcomes and server-derived mastery.
- `arcade.resulted` remains the downstream event from that workflow.
- Verified Evidence remains the evidence authority.
- Treasury remains the economy and reward authority.
- Truth Spine remains the institutional truth authority.
- Polygon/on-chain logging is not an Arcade browser authority.
- `ARCADE_EVENTS` remains temporary UI/event vocabulary and is not the canonical Arcade Result event authority.

## History Deferred to Phase 2E

`useArcadeHistory.js` is unchanged in this phase. It still reads historical legacy ledger entries and may present their XP, EVU, credit, or Polygon fields. Correcting historical labels and composing authoritative Arcade Results into history is a separate Phase 2E read-model change.
