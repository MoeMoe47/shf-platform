# Civic App — Redesign Checklist V1

Use one copy of this checklist per page upgrade. Do not begin implementation on any page
until every box above "Page approved" is checked for that specific page. This checklist
exists to make sure the discipline established in the capability audit / page inventory /
preservation ledger actually gets applied at implementation time, not just at planning time.

## Global prerequisites (check once, before the first page upgrade)

- [ ] B-01 (Civic Profile scoring mismatch) understood and a resolution decided (fix the weights map, or replace with `utils/civic/evaluateCivicDNA.js`, or a new scheme) — see `CIVIC_APP_PRESERVATION_LEDGER_V1.md` P-008
- [ ] P-004 (mission-log cross-app contract) reviewed against live `src/pages/admin/MasterNarrativeViewer.jsx` and `ToolDashboard.jsx` so redesign work doesn't silently change the `shf.civicMissionLogs.v1` shape
- [ ] Decision made on `Lesson.jsx` vs `CivicLesson.jsx` reconciliation approach (P-017)
- [ ] Decision made on `Proposals.jsx` vs `Proposals.lord-demo.jsx` promotion (capability audit §B)
- [ ] Decision made on Dashboard vs Northstar Dashboard merge-or-keep (P-018)
- [ ] `.crb-*` shell CSS class contract change plan (if any) checked against Sales app's shared usage (capability audit §D.3)
- [ ] Baseline test run recorded (this pass: 80/80 pass, `npx playwright test tests/ui/civic-route-recovery.spec.mjs tests/ui/civic-mobile-overflow.spec.mjs tests/ui/civic-journal-header.spec.mjs`)

## Per-page checklist

Page: ______________________

- [ ] Approved mock received
- [ ] Route confirmed (matches an entry in `CIVIC_APP_PAGE_INVENTORY_V1.md`, or a documented new/merged route)
- [ ] Preservation ledger reviewed (`CIVIC_APP_PRESERVATION_LEDGER_V1.md`) — every P-### entry that names this page identified
- [ ] Existing capabilities mapped (cross-checked against `CIVIC_APP_CAPABILITY_AUDIT_V1.md` §A/§B for this page)
- [ ] Known bugs for this page reviewed (capability audit §E) and a fix/defer decision made explicitly, not by omission
- [ ] Responsive states included (1440×900, 1280×800, 1024×768, 900×900, 768×1024, 390×844)
- [ ] Mobile navigation pattern addressed if this is a shell-level change (B-09 — no drawer/hamburger currently exists; decide whether the redesign introduces one)
- [ ] Accessibility states included (heading hierarchy, labels not just placeholders, focus order/visibility, `role="progressbar"` where relevant, table `scope` attributes where relevant)
- [ ] No capability lost (every relevant P-### ledger entry still holds after implementation)
- [ ] Tests updated (existing civic-route-recovery / civic-mobile-overflow / civic-journal-header specs kept passing, plus new tests for anything the mock changes)
- [ ] Screenshot comparison completed (before/after, at minimum 1440×900, 768×1024, 390×844)
- [ ] Page approved
