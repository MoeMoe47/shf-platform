# Studio Phase 3.5: Student Experience Layer

## 1. Purpose

This phase adds a shared, read-only presentation adapter above the durable Phase 2 Studio Project API. It makes the current Studio shell easier to understand without creating a second project, progress, completion, QA, review, delivery, Evidence, or reporting model.

## 2. Inherited contracts

Phase 1 terminology, Beginner/Advanced boundary, Student/Commercial destination separation, and the five responsibilities GUIDE, TRANSLATE, ASSIST, REFLECT PROGRESS, and BRIDGE are preserved. Phase 3 routes and API client remain stable.

## 3. Ownership

`src/pages/studio/experience.js` derives student-facing terminology, stage, next action, progress categories, and safe Companion context from canonical project response fields. `StudioExperienceProvider` supplies that derived context to shared Studio presentation components. It performs no writes.

## 4. Next action and progress

`resolveStudioNextAction` handles the lifecycle states currently defined by Phase 2 and gives conservative guidance for future states. `deriveStudioProgress` exposes stage categories, not percentages. It only describes QA, review, delivery, Evidence, and completion when the canonical project facet supports an appropriate state; it never infers them from navigation or page visits.

## 5. Guided kickoff

Independent project creation is a three-step student flow: choose Website or AI Agent, name the idea and optionally describe its purpose, then optionally identify its audience. Only the supported title and project type are sent to the Phase 2 API. The other prompts remain presentation-only until a canonical persistence contract exists.

## 6. Orientation and terminology

Project shells provide an inline Website/AI Agent orientation and a shared terminology mapping: Start Project, My Project, Project Resources, Project Plan / Requirements, Check My Project, Submit / Publish / Finish, and What You Proved. Backend terms remain unchanged.

## 7. Beginner and Advanced modes

Beginner is the default. The shell provides a local React presentation control for Beginner/Advanced, but both modes use the same project and the same permissions. No raw files, manifests, keys, providers, terminal, Registry, or Agent Fabric controls are exposed. The mode does not alter canonical identity or lifecycle.

## 8. Companion integration

The shell uses the existing `CompanionProvider` and `openCoach()` path. `toStudioCompanionContext` is the future input contract containing safe project title/type/origin, authorized assignment/release identifiers, route, current presentation stage, recommended action, and empty requirement/blocker collections until those canonical read models exist. The context is explicitly `read-only`; the Companion cannot mutate Studio or institutional facts.

## 9. Contextual help and future bridges

The project shell offers a labeled Need help? control that opens the existing Companion. What You Proved and portfolio actions remain future bridge regions and are not presented as working actions. Future Phase 4 resources can plug into the provider without adding a separate enterprise library presentation.

## 10. Celebration and analytics seam

No new celebration or event infrastructure was added. Existing celebration/milestone providers remain the only presentation mechanism. No Studio celebration is triggered by navigation or local state. A future safe event adapter may observe presentation events, but must not convert them into learning truth.

## 11. Accessibility and responsive behavior

Studio uses semantic headings, fieldsets, labels, alerts, buttons, links, text explanations, and screen-reader-only stage/action context. The existing SHF accessibility and reduced-motion providers remain authoritative. The stage list collapses responsively with the rest of the Studio shell and does not require a desktop-only interaction.

## 12. ClientOps and authority boundaries

Student Studio contains no ClientOps entry point. The experience layer cannot set destination, QA, review, delivery, Evidence, assignment completion, progress, reporting, or verification. No Studio authority is stored in localStorage, sessionStorage, or browser-derived percentages.

## 13. Tests and verification

`tests/studio-experience.test.mjs` covers state-derived guidance, non-mutation, project-type context, assignment lineage context, terminology, conservative progress claims, Beginner default, and Companion read-only context. `tests/studio-shell-contract.test.mjs` continues to cover routing, API endpoints, creation authority fields, and absence of sample/ClientOps presentation.

## 14. Known limitations

The current Phase 2 response does not yet expose a Build Packet, requirements read model, QA result, Delivery state, Evidence link, Portfolio projection, or assignment detail context beyond IDs. The UI therefore presents truthful placeholders and does not invent those capabilities. The current assignment API has no Studio eligibility field, so ordinary assignments do not receive a handoff button. Migration 069 live PostgreSQL replay remains the Phase 2 documented limitation.

## 15. Phase 4 entry contract

Phase 4 may add canonical Project Resources / Development Library data to the existing experience provider and project shell. Resources must be fetched through authorized backend scope and presented as Project Resources; they must not become a second assignment or project state store. Existing next action, stage, Companion, terminology, mode, accessibility, and mobile extension points remain stable.
