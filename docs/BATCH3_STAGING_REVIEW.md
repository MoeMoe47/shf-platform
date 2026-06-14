# Batch 3 Staging Review

Generated: 2026-06-14

This is a staging review only. No `git add`, commit, restore, reset, delete, or move action was performed as part of this review.

## Scope

Batch 3 from `docs/GIT_STAGING_PLAN.json` is `Admin UI`.

- Plan entry count: 6
- Concrete file count: 10
- Risk level: medium-high
- Purpose: Stage V1 governance admin pages and admin navigation/route wiring.

`src/system/identity/hubAccessControl.js` is not included in Batch 3 because the staging plan assigns it to Batch 4 as one of the owner-approved active SHF/WebMaker files.

## File List

| Status | File | Ownership / purpose |
|---|---|---|
| `??` | `src/pages/admin/truth-spine/TruthSpinePage.jsx` | Truth Spine admin page |
| `??` | `src/pages/admin/truth-spine/truth-spine.css` | Truth Spine admin styling |
| `??` | `src/pages/admin/oracle/OraclePage.jsx` | Oracle admin page |
| `??` | `src/pages/admin/oracle/oracle.css` | Oracle admin styling |
| `??` | `src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx` | AI Guardrails admin page |
| `??` | `src/pages/admin/ai-guardrails/ai-guardrails.css` | AI Guardrails admin styling |
| `??` | `src/pages/admin/game-theory/GameTheoryPage.jsx` | Game Theory admin page |
| `??` | `src/pages/admin/game-theory/game-theory.css` | Game Theory admin styling |
| `M` | `src/router/AdminRoutes.jsx` | Admin route wiring |
| `M` | `src/components/admin/AdminSidebar.jsx` | Admin sidebar navigation |

## Boundary Verification

Batch 3 files belong only to Admin UI or admin navigation:

- Truth Spine admin page and CSS
- Oracle admin page and CSS
- AI Guardrails admin page and CSS
- Game Theory admin page and CSS
- Admin route wiring
- Admin sidebar navigation

Excluded-batch checks:

- Batch 4 SHF/WebMaker files included: 0
- Batch 5 expected archive removals included: 0
- Batch 6 archive-later files included: 0
- Runtime/local persistence files included: 0

Batch staging checks:

- Batch 1 governance files are already staged.
- Batch 2 backend infrastructure files are already staged.
- Batch 3 is not staged by this review.

## Dependency Notes

- Batch 3 depends on Batch 1 governance checks and Batch 2 backend routes being staged first.
- Admin pages depend on the corresponding backend route families being available for Truth Spine, Oracle, AI Guardrails, and Game Theory.
- `AdminRoutes.jsx` and `AdminSidebar.jsx` should be staged with the admin pages so navigation and page imports stay in the same batch.
- `hubAccessControl.js` remains in Batch 4 per the staging plan, despite being related to admin access, because it is one of the 11 owner-approved active SHF/WebMaker files.

## Proposed Git Add Command

Do not execute until owner approval:

```bash
git add -- src/pages/admin/truth-spine/TruthSpinePage.jsx src/pages/admin/truth-spine/truth-spine.css src/pages/admin/oracle/OraclePage.jsx src/pages/admin/oracle/oracle.css src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx src/pages/admin/ai-guardrails/ai-guardrails.css src/pages/admin/game-theory/GameTheoryPage.jsx src/pages/admin/game-theory/game-theory.css src/router/AdminRoutes.jsx src/components/admin/AdminSidebar.jsx
```

## Validation Commands Run

```bash
npm run check:governance
npm run build
git diff --cached --name-status
git status --short
```

## Recommendation

Recommendation: Safe to stage after owner approval.

Reason: The Batch 3 file set is internally consistent, includes only Admin UI/admin navigation files, excludes Batch 4/5/6 files, and depends cleanly on the already staged Batch 1 and Batch 2 work.
