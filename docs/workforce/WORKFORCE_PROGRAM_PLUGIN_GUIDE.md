# Workforce Program Plug-in Guide (Phase 8)

How to add a workforce program without building a new platform. The contract is defined in `WORKFORCE_PROGRAM_INTEGRATION_CONTRACT.md`.

ProgramPackages coordinate canonical authorities; they do not replace them.

## Steps

1. **Use the owning authorities for content.** Do not put it in the program.
   - **Curriculum:** import courses (stable keys).
   - **Arcade:** add a canonical activity definition (`arcade/catalog/canonical-arcade-activities.ts`) and a canonical Learning descriptor (`src/shared/arcade/experience/canonicalArcadeExperienceDescriptors.js`).
   - **Missions:** author Mission sources (`mission-content/catalog/canonical-mission-sources.ts`) and publish them per organization through the Studio review workflow.
   - **Sensory:** add an Experience Layer sensory profile (`src/shared/experience/sensory/profiles/`) only if the program needs one.
2. **Write the program module** in `workforce-foundation/registry/programs/<program>.ts`:
   - a `schemaVersion: 2` ProgramPackage that references those artifacts plus careers, competencies, MOL systems, destinations, authorities, credential authorities, partners, funding sources, report profiles and governance docs;
   - an optional `fundabilityAssessment` with a basis for every criterion;
   - `artifactRefs` listing the canonical artifacts it relies on.
3. **Add the module to `WORKFORCE_PROGRAM_MODULES`**, the static allow-list.
4. **Run `validateProgramIntegration(actor, programId)`** in the owning organization. Read the 16 sections, and fix references or record honest gaps.
5. **Declare the lifecycle you request.** The platform evaluates the lifecycle you actually reach. Expect INTEGRATION_READINESS until partners, credential authorities, funding and dependencies are real.

## Do

- Reference existing records by id.
- Declare honest maturity: never above the MOL systems that provide a capability.
- Declare execution level STANDALONE unless LIVE engines are really used.
- Mark partners CONFIRMED only with an ACTIVE agreement or relationship.
- Use POTENTIAL funding only with an owner-approved alignment rule, and VERIFIED only with a real award or assurance record.

## Do not

- Copy lesson bodies, Mission definitions, world state, Evidence, credentials, awards or learner data into a package. Validation fails closed.
- Add code to a module, a program-specific engine, or `if (programId === …)` anywhere.
- Register fake or illustrative programs. Synthetic shapes belong in `tests/fixtures/`.
- Build a new engine without passing the new-engine justification gate.

Program completion does not establish verified mastery, credential attainment, career eligibility, funding eligibility, employment eligibility or institutional truth.
