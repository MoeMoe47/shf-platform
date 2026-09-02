# Studio V1 Architecture Decisions

1. **One product.** Website and AI Agent are project types inside one Studio product and shared lifecycle.
2. **Durable authority.** SHRV1 backend services and PostgreSQL are the durable authority; browser state and SHF-Next prototypes are not institutional truth.
3. **Canonical projects.** Existing canonical project/handoff concepts are extended. No competing `studio_projects` truth store is introduced.
4. **Origins stay distinct.** Assignment-origin projects preserve assignment/release lineage. Student ideas remain independent.
5. **Destinations stay distinct.** `STUDENT` and `COMMERCIAL` destinations have separate authorization and consumers.
6. **ClientOps exclusion.** Student projects never dispatch ClientOps or commercial operations.
7. **Exact revisions.** QA, review, delivery, and Evidence provenance bind to exact durable workspace revisions or immutable snapshots.
8. **Separate authorities.** QA, Review, Delivery, Evidence, and Completion are separate domains and facts.
9. **No lifecycle shortcuts.** Save, QA pass, review approval, and finalization do not silently manufacture unrelated completion or credential facts.
10. **VERIFIED is not Studio lifecycle.** Institutional verification belongs to Evidence/Completion/Truth authorities, not a Studio project boolean.
11. **Portfolio is unconnected.** Portfolio remains `NOT_CONNECTED` until a dedicated canonical architecture exists.
12. **Agent boundary.** Agent finalization/Evidence does not imply Registry approval, certification, or production execution.
13. **Website boundary.** Website finalization/Evidence does not imply hosting or public deployment.
14. **Derived teacher progress.** Teacher progress is projected from canonical facts, not stored as competing mutable status.
15. **Presentation modes.** Beginner and Advanced share one canonical project and differ only in presentation.
16. **Bounded Companion.** Companion is read-only contextual assistance unless a separately authorized mutation contract is introduced.
17. **Accessibility reuse.** Studio reuses the application accessibility and responsive conventions rather than creating a parallel design system.
18. **Migration discipline.** Historical migrations remain immutable; current migration head is `074`.
