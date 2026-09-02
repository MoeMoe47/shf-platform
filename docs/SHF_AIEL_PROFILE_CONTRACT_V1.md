# SHF AIEL Profile & Contract Design v1 (Phase 1)

Status: design-only. No schema, no API, no code changes. Binds Phase 2 (Persistence Schema & API
Contract Design) the same way `docs/SHF_ACCESSIBILITY_INCLUSIVE_EXPERIENCE_CONSTITUTION_V1.md`
(Phase 0) binds this document — Phase 2 MUST NOT contradict either without reporting the
contradiction first.

## 1. Contract Purpose

Defines the conceptual shape of every AIEL-adjacent contract before any schema or API is designed:
what belongs in a learner's Personal Accessibility Preferences, what belongs in the separate
Learning Support, Authorized Accommodation, Content Capability, and Application Capability
contracts, how they combine into one effective runtime context, and how each maps onto today's
real (and duplicated) implementations.

## 2. Personal Accessibility Profile

See §5 (Final Canonical Contracts) for the locked field list. Summary of the design decision:
**nested, not flat** — grouped into `presentation`, `interaction`, `media`, `sensory` — because the
audit found these four groups have different consumers, different effective-value rules, and
different migration sources; a flat blob (today's actual `curriculum:a11yPrefs:v1` shape) is
exactly the anti-pattern that let six of nine fields silently rot into no-ops with nobody noticing
which subsystem was supposed to own each one.

## 3. Learning Support Contract

`preferredReadingSupport: "CORE" | "SIMPLE" | "ADVANCED"` (renamed/re-typed from the current boolean
`simplifiedReading` — see §7 for why a boolean cannot represent this concept, given
`ReadingLevelProvider`'s real three-value `"core"|"simple"|"advanced"` enum).
`readAloudPreference: "AUTO" | "PROMINENT" | "HIDDEN"` — a *preference for how prominently read-aloud
controls are surfaced*, never the read-aloud engine itself (that stays a content/component concern
— see §12).
AIEL stores the preference; Curriculum (content variants) and the TTS component layer (once
consolidated — see §26) remain the domain owners of the actual supported behavior.

## 4. Effective Accessibility Context

The single, computed, read-only object every consumer (Companion, Celebration, future Curriculum
rendering) actually reads — never the raw stored profile directly. See §6 for the full precedence
model. Conceptually:

```
EffectiveAccessibilityContext {
  motion: "REDUCED" | "FULL"                 // OR of stored preference and OS signal, see §6
  textScale: "DEFAULT" | "LARGE" | "EXTRA_LARGE"
  contrastMode: "DEFAULT" | "HIGH"
  captionsDefaultOn: boolean                 // derived, see §10
  transcriptsDefaultOpen: boolean
  celebrationIntensity: "FULL" | "SUBTLE" | "OFF"
  focusEmphasis: "DEFAULT" | "ENHANCED"
  targetSize: "DEFAULT" | "LARGE"
  readingSupport: "CORE" | "SIMPLE" | "ADVANCED"
  readAloudProminence: "AUTO" | "PROMINENT" | "HIDDEN"
  accommodations: AuthorizedAccommodationContext | null   // §5.C, never merged into the fields above
}
```

## 5. Authorized Accommodation Boundary

See Final Canonical Contracts §5.C. Explicitly not built this phase — only its consumption
boundary is designed.

## 6. Content Capability Contract

See Final Canonical Contracts §5.D.

## 7. Application Capability Contract

See Final Canonical Contracts §5.E.

## 8. State-Scoping Rules

Unchanged from Phase 0, re-confirmed: Personal Accessibility Preferences and Learning Support
preferences are **user-scoped** (`user_id`). Authorized Accommodation context is
**membership/enrollment/organization-scoped**. Content and Application capabilities are
**resource/activity-scoped**, owned by their respective domains, never by AIEL.

## 9. Default / Precedence Rules

See §6 of the full report (Effective-Value / Inheritance Model) for the complete precedence chain
and per-field reasoning. Summary: `explicit user choice > OS/device signal > organization suggested
default > platform default`, with Authorized Accommodation context layered on top as an addition,
never a silent override, of the personal profile.

## 10. Versioning Rules

`profileVersion` (integer, additive-only) on the Personal Accessibility Profile. Unknown fields
MUST be preserved and ignored by older clients, never dropped on write. Every enum MUST reserve an
`UNKNOWN`/`AUTO` value for forward compatibility. Deprecated fields get an explicit migration entry
in §12 (Migration Map), never silent removal.

## 11. Privacy Classification

See §22 of the full report for the complete per-field classification table. No field anywhere in
any of the five contracts stores a diagnosis, disability category, or medical information — this is
a hard constraint carried forward unchanged from Phase 0 and re-verified against every field
proposed in this document.

## 12. Consumer Contracts

Brainiact and Student Guidance each receive a minimal, already-normalized slice of
`EffectiveAccessibilityContext` — never the raw profile, never raw storage. See §24-25 of the full
report.

## 13. Migration Map

See §27 of the full report for the complete current-state-to-future-contract mapping, including a
newly-discovered fourth duplication category (three independent TTS/read-aloud implementations)
found during this phase's mandated pre-read.

## 14. Anti-Patterns

See §29 of the full report for the complete rejected-pattern list.

## 15. Phase 2 Readiness

See §31 of the full report (Phase 2 Readiness Gate).
