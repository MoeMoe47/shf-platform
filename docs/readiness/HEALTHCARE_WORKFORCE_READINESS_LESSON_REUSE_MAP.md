# Healthcare Workforce Readiness — Lesson Reuse Map

Status: DRAFT — PARALLEL PASS 2
Branch: `agent/pass2-readiness-healthcare`
Baseline: `af2faa2`
Stable key: `shu-healthcare-workforce-readiness`

## 1. Purpose

Map each proposed Healthcare Workforce Readiness lesson to existing repository material and determine whether the lesson should:

- REUSE
- CONTEXTUALIZE
- EXTEND
- CONSOLIDATE
- REFERENCE ONLY
- MISSING

This document is Artifact 2 of 4 for Healthcare Pass 2.

It does not create:

- source lesson files
- competency definitions
- competency IDs
- proof configurations
- evidence records
- completion rules
- credentials
- regulated healthcare authority

## 2. Evidence Reviewed

Primary reusable UCR source location:

`src/content/lessons/shu-universal-career-readiness-student/`

Healthcare-specific planning and audit sources:

- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_REUSE_AUDIT.md`
- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_BLUEPRINT.md`
- `docs/readiness/HEALTHCARE_WORKFORCE_READINESS_SOURCE_CURRICULUM_PLAN.md`
- `docs/readiness/READINESS_PARALLEL_PASS_2_MASTER_WORK_ORDER.md`

Canonical Prepare / Prove authority:

- `apps/shs-api/src/domain/prepare-prove/service/prepare-prove-service.ts`
- `apps/shs-api/src/domain/prepare-prove/api/routes.ts`
- `apps/shs-api/migrations/034_prepare_prove_evidence_competency.sql`

Healthcare pathway / regulated-program references reviewed include:

- `apps/shs-api/src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts`
- `docs/sales/commercial-product-registry-design/initial-32-candidate-design-mapping.json`
- `docs/sales/commercial-product-registry-review/8_SOURCE_AUTHORITY_GAPS.md`
- `docs/sales/commercial-product-registry-onboarding/32_CANDIDATE_ONBOARDING_MATRIX.md`

These healthcare commercial/pathway records are reference evidence only.

They do not establish regulated curriculum or training authority.

## 3. Reuse Classification Rules

### REUSE

Existing lesson substantially teaches the same learner capability and can remain authoritative with little or no healthcare-specific change.

### CONTEXTUALIZE

Existing UCR lesson teaches the transferable capability.

Healthcare-specific examples, terminology, scenarios, or framing should be layered around it without creating a second competency authority.

### EXTEND

Existing content covers part of the objective, but a genuinely new healthcare-specific activity or content segment is needed.

### CONSOLIDATE

Multiple existing lessons or authorities overlap and should be composed without creating a duplicate capability.

### REFERENCE ONLY

Existing repository material is useful for orientation or evidence of prior concepts, but it is not authoritative source curriculum.

### MISSING

No functionally equivalent governed source lesson was found.

A new source lesson may be justified after review.

## 4. Unit 1 — Understanding Healthcare Work

### 1.1 The Healthcare Workforce Ecosystem

Classification: MISSING

Existing material reviewed:

- healthcare pathway concepts in Pass 1 audit
- commercial Healthcare Workforce candidate records
- canonical Career authority
- UCR workplace-orientation content

Closest reusable UCR:

- `ucr-01-entering-the-workplace.json`
- `ucr-02-employer-expectations.json`

Decision:

UCR can provide general workplace framing, but it does not teach the healthcare ecosystem, care settings, regulated/nonregulated role structure, or healthcare workforce relationships.

New healthcare-specific source content is justified.

Authority boundary:

Use canonical Career records for career facts.

Do not treat commercial candidate records as curriculum.

### 1.2 Healthcare Settings and Environments

Classification: MISSING

Existing material reviewed:

- healthcare pathway concepts
- hospital / healthcare visual assets
- regulated-program category references

Decision:

No governed source lesson was found covering hospitals, long-term care, outpatient, laboratory, emergency, home/community, and healthcare administrative environments as an instructional objective.

New source lesson justified.

### 1.3 Clinical and Nonclinical Roles

Classification: EXTEND

Closest reusable sources:

- `ucr-17-roles-responsibilities-shared-goals.json`
- `ucr-52-reading-career-paths-job-requirements.json`

Decision:

Reuse role/responsibility and career-reading concepts.

Extend with healthcare-specific role families:

- clinical
- diagnostic
- technical
- administrative
- health IT
- environmental/support
- revenue-cycle/operations

Do not create independent career authority.

### 1.4 Readiness Versus Qualification

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-53-employer-expectations-preparation-vs-qualification.json`
- `ucr-54-training-credentials-work-based-learning-routes.json`

Supporting source:

- `ucr-52-reading-career-paths-job-requirements.json`

Decision:

The transferable distinction already exists.

Healthcare should contextualize it with:

- clinical training
- certification
- credentialing
- licensure
- employer authorization
- supervised practice

No duplicate lesson objective is needed.

### 1.5 Your Healthcare Readiness Starting Point

Classification: CONTEXTUALIZE

Primary reusable source:

- `ucr-51-career-exploration-interests-strengths-work-environments.json`

Supporting source:

- `ucr-55-build-career-plan-next-step.json`

Decision:

Reuse existing career self-assessment capability.

Add healthcare setting and role prompts only.

No healthcare readiness score is permitted.

## 5. Unit 2 — Professionalism in Healthcare

### 2.1 Reliability in Healthcare Work

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-03-reliability-attendance-punctuality.json`
- `ucr-08-accountability-ownership-follow-through.json`
- `ucr-31-time-attendance-reliability.json`

Supporting source:

- `ucr-34-when-plans-change-lateness-absence-delays.json`

Decision:

Reuse canonical reliability capability.

Healthcare additions should focus on:

- continuity
- shift impact
- handoff impact
- team dependency

No second reliability competency.

### 2.2 Professional Conduct and Boundaries

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-04-professional-conduct-responsibility.json`
- `ucr-06-what-professionalism-looks-like.json`
- `ucr-09-boundaries-confidentiality-digital-conduct.json`

Decision:

Reuse professionalism authority.

Healthcare framing may add patient/family/team examples and scope boundaries.

### 2.3 Appearance, Hygiene and Workplace Expectations

Classification: EXTEND

Primary reusable source:

- `ucr-07-professional-appearance-presentation-context.json`

Decision:

General appearance/presentation is reusable.

Healthcare-specific hygiene awareness, facility policy, identification, and controlled-environment expectations require extension.

This must remain awareness-level.

It is not infection-control certification.

### 2.4 Accountability and Speaking Up

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-08-accountability-ownership-follow-through.json`
- `ucr-49-speaking-up-concerns-misconduct-conflicts.json`
- `ucr-50-accountability-honest-reporting-ethical-decisions.json`

Supporting safety source:

- `ucr-23-scope-authorization-knowing-when-to-stop.json`

Decision:

Reuse the transferable capability.

Healthcare context should emphasize safety culture and escalation.

### 2.5 Professionalism Reflection

Classification: REUSE

Primary reusable sources:

- `ucr-10-feedback-mistakes-continuous-improvement.json`
- evidence/self-advocacy lessons in Unit 13

Decision:

No new healthcare-specific professional-reflection capability is required.

Healthcare examples may be applied at the activity layer.

## 6. Unit 3 — Communication in Healthcare

### 3.1 Clear and Respectful Communication

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-11-communication-at-work.json`
- `ucr-13-verbal-written-digital-communication.json`

Decision:

Reuse Professional Communication.

Healthcare scenarios provide context only.

### 3.2 Listening and Clarifying

Classification: CONTEXTUALIZE

Primary reusable source:

- `ucr-12-listening-clarifying-confirming.json`

Decision:

The learner capability already exists.

Healthcare should add safety-sensitive clarification examples.

No new communication competency.

### 3.3 Healthcare Handoffs

Classification: EXTEND

Primary reusable source:

- `ucr-18-coordination-handoffs-dependencies.json`

Supporting sources:

- `ucr-12-listening-clarifying-confirming.json`
- `ucr-15-communication-across-teams-roles-cultures.json`

Decision:

The underlying handoff capability exists.

Healthcare needs a new contextual activity/content extension covering:

- continuity
- accuracy
- role transitions
- closed-loop confirmation
- escalation
- scope boundaries

Do not automatically create a healthcare-specific competency.

This remains a candidate proof area.

### 3.4 Communicating Across Roles

Classification: CONTEXTUALIZE

Primary reusable source:

- `ucr-15-communication-across-teams-roles-cultures.json`

Supporting source:

- `ucr-17-roles-responsibilities-shared-goals.json`

Decision:

Reuse the existing communication capability with healthcare roles.

### 3.5 Communication Evidence

Classification: REUSE

Primary reusable sources:

- `ucr-57-turning-experience-into-strong-evidence.json`
- `ucr-62-what-makes-evidence-strong.json`
- `ucr-65-presenting-skills-without-overclaiming.json`

Decision:

Healthcare may provide a contextual communication artifact.

The evidence capability remains canonical and transferable.

## 7. Unit 4 — Teamwork and Care Coordination

### 4.1 Healthcare Teams

Classification: EXTEND

Primary reusable sources:

- `ucr-16-working-as-part-of-a-team.json`
- `ucr-17-roles-responsibilities-shared-goals.json`

Decision:

Teamwork capability exists.

Healthcare requires industry-specific framing around interdisciplinary and support teams.

### 4.2 Collaboration and Shared Responsibility

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-16-working-as-part-of-a-team.json`
- `ucr-20-high-performing-teams-individual-contribution.json`

Decision:

Reuse canonical Team Collaboration.

Healthcare coordination examples only.

### 4.3 Resolving Team Friction

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-14-difficult-conversations-conflict.json`
- `ucr-19-team-conflict-trust-accountability.json`

Decision:

Reuse conflict-resolution capability.

Healthcare context may change escalation urgency but not authority.

### 4.4 Coordinating Tasks Without Exceeding Scope

Classification: EXTEND

Primary reusable sources:

- `ucr-18-coordination-handoffs-dependencies.json`
- `ucr-23-scope-authorization-knowing-when-to-stop.json`

Decision:

Reuse coordination and scope concepts.

Extend with healthcare-specific supervision and role-boundary scenarios.

### 4.5 Teamwork Reflection

Classification: REUSE

Primary reusable sources:

- `ucr-20-high-performing-teams-individual-contribution.json`
- evidence/reflection patterns already present in UCR

Decision:

No new teamwork authority required.

## 8. Unit 5 — Healthcare Safety Culture and Scope

### 5.1 Safety Culture in Healthcare

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-21-safety-everyones-responsibility.json`
- `ucr-25-building-strong-safety-culture.json`

Decision:

Reuse Workplace Safety Awareness.

Healthcare-specific safety culture is contextualization.

### 5.2 Recognize, Stop, Escalate

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-22-recognizing-hazards-changing-conditions.json`
- `ucr-23-scope-authorization-knowing-when-to-stop.json`
- `ucr-24-reporting-hazards-near-misses-incidents.json`

Decision:

The core capability already exists.

Healthcare scenarios should contextualize it.

Candidate proof activity must first test functional equivalence with existing proof configurations.

### 5.3 Scope, Authorization and Supervision

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-23-scope-authorization-knowing-when-to-stop.json`
- `ucr-53-employer-expectations-preparation-vs-qualification.json`

Decision:

Reuse existing scope/authorization capability.

Healthcare adds clinical and regulated-role examples.

### 5.4 Common Healthcare Workplace Hazards

Classification: MISSING

Reusable foundation:

- `ucr-22-recognizing-hazards-changing-conditions.json`
- `ucr-21-safety-everyones-responsibility.json`

Decision:

General hazard recognition exists, but healthcare-specific hazard awareness is genuinely missing as governed source curriculum.

New lesson may cover awareness of:

- sharps
- exposure
- ergonomic/lifting risk
- equipment
- slips/falls
- emergency signals
- violence-prevention concepts

No procedural training.

### 5.5 Safety and Scope Decision Scenario

Classification: EXTEND

Primary reusable sources:

- `ucr-22-recognizing-hazards-changing-conditions.json`
- `ucr-23-scope-authorization-knowing-when-to-stop.json`
- `ucr-29-make-communicate-verify-decision.json`

Decision:

The capability is substantially reusable.

Healthcare-specific integrated scenario may be new.

Proof configuration remains unresolved pending Artifact 3.

## 9. Unit 6 — Dignity, Privacy and Ethics

### 6.1 Dignity and Respect

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-47-rights-respect-fair-treatment-work.json`
- `ucr-46-ethics-integrity-professional-judgment.json`

Decision:

Reuse ethics/respect capability.

Add healthcare person-centered context.

### 6.2 Privacy and Confidentiality Awareness

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-09-boundaries-confidentiality-digital-conduct.json`
- `ucr-39-privacy-security-data-boundaries.json`
- `ucr-48-confidentiality-privacy-ownership.json`

Decision:

Reuse privacy/confidentiality capability.

Healthcare-specific examples may include sensitive health information.

Do not represent lesson as HIPAA certification or legal advice.

### 6.3 Ethical Decision-Making

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-46-ethics-integrity-professional-judgment.json`
- `ucr-50-accountability-honest-reporting-ethical-decisions.json`
- `ucr-29-make-communicate-verify-decision.json`

Decision:

Reuse canonical ethics and decision-making.

### 6.4 Boundaries With Patients, Families and Communities

Classification: EXTEND

Primary reusable sources:

- `ucr-09-boundaries-confidentiality-digital-conduct.json`
- `ucr-46-ethics-integrity-professional-judgment.json`

Decision:

General workplace boundaries exist.

Healthcare relationships introduce enough context to justify a healthcare-specific extension.

### 6.5 Ethics Reflection

Classification: REUSE

Primary reusable sources:

- `ucr-46-ethics-integrity-professional-judgment.json`
- `ucr-50-accountability-honest-reporting-ethical-decisions.json`

Decision:

Use healthcare scenario/reflection without creating new ethical authority.

## 10. Unit 7 — Accessibility, Inclusion and Person-Centered Support

### 7.1 Accessibility in Healthcare

Classification: CONTEXTUALIZE

Primary reusable source:

- `ucr-41-accessibility-inclusion-workplace-barriers.json`

Decision:

Reuse canonical Accessibility & Inclusion.

Healthcare access barriers are contextual examples.

### 7.2 Communication Access

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-42-accessible-communication-digital-content.json`
- `ucr-43-preferences-assistive-tools-inclusive-work-practices.json`

Decision:

Reuse accessible communication concepts.

Healthcare examples must not imply interpreter or clinical communication authorization.

### 7.3 Respecting Individual Needs and Preferences

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-43-preferences-assistive-tools-inclusive-work-practices.json`
- `ucr-44-accommodations-privacy-appropriate-support.json`
- `ucr-45-self-advocacy-allyship-inclusive-workplaces.json`

Decision:

Reuse canonical inclusion/accommodation concepts.

### 7.4 Accessible Healthcare Environments

Classification: EXTEND

Primary reusable sources:

- `ucr-41-accessibility-inclusion-workplace-barriers.json`
- `ucr-42-accessible-communication-digital-content.json`

Decision:

Healthcare-specific physical, digital, communication, sensory, and workflow environment analysis warrants an extension.

No duplicate accommodation authority.

### 7.5 Inclusion Improvement Proposal

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-41-accessibility-inclusion-workplace-barriers.json`
- `ucr-45-self-advocacy-allyship-inclusive-workplaces.json`

Decision:

Reuse transferable capability with healthcare context.

## 11. Unit 8 — Problem Solving in Healthcare Workplaces

### 8.1 Define the Problem Before Acting

Classification: CONTEXTUALIZE

Primary reusable source:

- `ucr-26-define-problem-before-solving.json`

Decision:

Reuse canonical Problem Solving.

Healthcare examples only.

### 8.2 Facts, Assumptions and Missing Information

Classification: REUSE

Primary reusable source:

- `ucr-27-facts-assumptions-missing-information.json`

Decision:

No healthcare-specific capability is needed.

Activity examples may be healthcare-based.

### 8.3 When to Solve and When to Escalate

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-23-scope-authorization-knowing-when-to-stop.json`
- `ucr-29-make-communicate-verify-decision.json`

Decision:

Reuse existing authority/scope and decision capability.

Healthcare adds patient-safety context.

### 8.4 Root Causes and Process Thinking

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-26-define-problem-before-solving.json`
- `ucr-30-learn-from-results-improve-process.json`

Decision:

Reuse existing process-improvement reasoning.

### 8.5 Healthcare Problem-Solving Scenario

Classification: EXTEND

Primary reusable sources:

- `ucr-26-define-problem-before-solving.json`
- `ucr-27-facts-assumptions-missing-information.json`
- `ucr-28-generate-options-compare-tradeoffs.json`
- `ucr-29-make-communicate-verify-decision.json`
- `ucr-30-learn-from-results-improve-process.json`

Decision:

A healthcare integrated scenario may be new.

It must not include diagnosis or treatment decision authority.

## 12. Unit 9 — Digital Healthcare Workplace Readiness

### 9.1 Digital Systems in Healthcare

Classification: MISSING

Closest reusable source:

- `ucr-36-digital-tools-systems-workplace-responsibility.json`

Decision:

General digital workplace literacy exists.

Healthcare-specific system categories and sensitive-data workflow awareness are not represented as governed source lessons.

New healthcare source content is justified.

No production clinical system access.

### 9.2 Secure Account and Device Behavior

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-36-digital-tools-systems-workplace-responsibility.json`
- `ucr-39-privacy-security-data-boundaries.json`

Decision:

Reuse canonical digital/security responsibility.

Healthcare sensitive-data examples only.

### 9.3 Documentation Accuracy

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-13-verbal-written-digital-communication.json`
- `ucr-50-accountability-honest-reporting-ethical-decisions.json`

Decision:

Reuse documentation accuracy and honest-reporting concepts.

Healthcare documentation context can be layered on.

### 9.4 Responsible AI in Healthcare Work

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-37-using-ai-assistants-responsibly.json`
- `ucr-38-verify-before-you-trust-ai-output.json`
- `ucr-40-human-judgment-ownership-responsible-ai-decisions.json`

Supporting source:

- `ucr-39-privacy-security-data-boundaries.json`

Decision:

Reuse Responsible AI Use.

Healthcare must add:

- high-stakes use
- privacy
- human clinical authority
- no diagnosis/prescribing reliance
- verification requirements

No separate AI authority.

### 9.5 Digital Responsibility Scenario

Classification: EXTEND

Primary reusable sources:

- UCR 36–40 digital / AI sequence

Decision:

An integrated healthcare privacy/security/AI scenario may be new.

Underlying competencies should remain reusable where functionally equivalent.

## 13. Unit 10 — Healthcare Careers and Pathways

### 10.1 Direct Care Pathways

Classification: EXTEND

Primary reusable sources:

- `ucr-51-career-exploration-interests-strengths-work-environments.json`
- `ucr-52-reading-career-paths-job-requirements.json`
- `ucr-54-training-credentials-work-based-learning-routes.json`

Reference-only healthcare sources:

- CNA / STNA pathway concepts
- regulated-program classifications

Decision:

Career-exploration capability is reusable.

Healthcare role content requires validated canonical Career data before production.

### 10.2 Diagnostic and Technical Pathways

Classification: EXTEND

Primary reusable sources:

- UCR 51–55 career-planning sequence

Reference-only healthcare sources:

- Phlebotomy Technician pathway concepts

Decision:

Career-planning capability is reusable.

Healthcare role content must use canonical Career authority.

### 10.3 Emergency and Prehospital Connections

Classification: EXTEND

Primary reusable sources:

- UCR 51–55 career-planning sequence

Reference-only healthcare sources:

- EMS regulated-program category

Decision:

Career exploration may be added.

No EMT/paramedic training or certification claims.

### 10.4 Healthcare Operations and Support Careers

Classification: EXTEND

Primary reusable sources:

- UCR 51–55 career-planning sequence

Decision:

General career-planning capability exists.

Healthcare operations/support role content requires new contextualized career material backed by canonical Career records.

### 10.5 Compare Healthcare Pathways

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-51-career-exploration-interests-strengths-work-environments.json`
- `ucr-52-reading-career-paths-job-requirements.json`
- `ucr-54-training-credentials-work-based-learning-routes.json`
- `ucr-55-build-career-plan-next-step.json`

Decision:

Reuse career comparison/planning capability.

Healthcare pathways provide context.

## 14. Unit 11 — Evidence, Portfolio and Self-Advocacy

### 11.1 What Counts as Evidence

Classification: REUSE

Primary reusable sources:

- `ucr-61-from-activity-to-evidence.json`
- `ucr-62-what-makes-evidence-strong.json`

Decision:

Fully reusable canonical evidence concepts.

### 11.2 Evidence Candidate Versus Verified Competency

Classification: REUSE

Primary reusable source:

- `ucr-63-review-verification-competency-decisions.json`

Supporting canonical authority:

- Prepare / Prove
- verified-evidence architecture

Decision:

No healthcare-specific verification model.

Healthcare must consume the canonical evidence chain.

### 11.3 Build a Healthcare Readiness Portfolio

Classification: CONTEXTUALIZE

Primary reusable source:

- `ucr-64-building-a-truthful-portfolio.json`

Supporting source:

- `ucr-57-turning-experience-into-strong-evidence.json`

Decision:

Reuse portfolio concepts.

Healthcare artifacts provide context.

Canonical Portfolio remains authority.

### 11.4 Presenting Your Readiness Without Overclaiming

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-59-presenting-yourself-work-story.json`
- `ucr-65-presenting-skills-without-overclaiming.json`

Decision:

Reuse truthful self-presentation capability.

Healthcare adds explicit regulated-credential and clinical-authority boundaries.

Candidate proof area.

### 11.5 Healthcare Evidence Review

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-62-what-makes-evidence-strong.json`
- `ucr-63-review-verification-competency-decisions.json`
- `ucr-64-building-a-truthful-portfolio.json`
- `ucr-65-presenting-skills-without-overclaiming.json`

Decision:

Reuse evidence-review capability with healthcare artifacts.

## 15. Unit 12 — Transition to Training and Employment

### 12.1 Identify Your Next Step

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-55-build-career-plan-next-step.json`
- `ucr-71-from-career-goal-to-transition-plan.json`

Decision:

Reuse canonical Career Planning and transition capability.

### 12.2 Training and Credential Requirements

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-52-reading-career-paths-job-requirements.json`
- `ucr-53-employer-expectations-preparation-vs-qualification.json`
- `ucr-54-training-credentials-work-based-learning-routes.json`
- `ucr-72-mapping-requirements-gaps-next-steps.json`

Decision:

Reuse requirement-reading capability.

Healthcare credential and licensure facts must come from validated external/canonical sources.

### 12.3 Preparing for Applications and Interviews

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-56-building-a-truthful-resume.json`
- `ucr-58-preparing-for-interviews.json`
- `ucr-59-presenting-yourself-work-story.json`
- `ucr-60-interview-practice-follow-up-professional-presence.json`

Decision:

Reuse canonical career-preparation content.

Healthcare examples only.

### 12.4 Transition Plan

Classification: REUSE

Primary reusable sources:

- `ucr-71-from-career-goal-to-transition-plan.json`
- `ucr-72-mapping-requirements-gaps-next-steps.json`
- `ucr-73-timeline-deadlines-support-network.json`
- `ucr-74-applications-follow-up-backup-plans.json`
- `ucr-75-your-90-day-transition-action-plan.json`

Decision:

The transition-planning capability already exists comprehensively.

Healthcare should supply pathway facts, not recreate the transition framework.

### 12.5 Final Readiness Reflection

Classification: CONTEXTUALIZE

Primary reusable sources:

- `ucr-65-presenting-skills-without-overclaiming.json`
- `ucr-75-your-90-day-transition-action-plan.json`

Decision:

Reuse UCR reflection / transition principles with healthcare context.

Completion does not establish employment eligibility or healthcare qualification.

## 16. Summary by Reuse Classification

### REUSE

Strong direct reuse candidates include:

- 2.5 Professionalism Reflection
- 3.5 Communication Evidence
- 4.5 Teamwork Reflection
- 6.5 Ethics Reflection
- 8.2 Facts, Assumptions and Missing Information
- 11.1 What Counts as Evidence
- 11.2 Evidence Candidate Versus Verified Competency
- 12.4 Transition Plan

### CONTEXTUALIZE

The majority of Healthcare Workforce Readiness should contextualize existing UCR capability, including:

- reliability
- professionalism
- communication
- teamwork
- safety culture
- scope awareness
- dignity and ethics
- privacy
- accessibility
- problem solving
- digital responsibility
- responsible AI
- career planning
- portfolio
- self-advocacy
- applications/interviews
- transition

### EXTEND

Likely extensions include:

- clinical/nonclinical role framing
- healthcare hygiene/workplace-expectation context
- healthcare handoffs
- healthcare team structure
- task coordination with healthcare scope
- integrated safety/scope scenarios
- patient/family/community boundaries
- accessible healthcare-environment analysis
- integrated healthcare problem-solving scenarios
- healthcare digital-responsibility scenario
- healthcare pathway role content
- healthcare readiness presentation

### MISSING

The strongest genuinely missing healthcare-specific source lessons are:

1. Healthcare Workforce Ecosystem
2. Healthcare Settings and Environments
3. Common Healthcare Workplace Hazards
4. Digital Systems in Healthcare

These are candidate new lessons.

They are not yet authorized for implementation until the full Pass 2 planning package is approved.

## 17. UCR Source Lessons With High Reuse Value

The following existing UCR files are particularly important to Healthcare composition:

- `ucr-03-reliability-attendance-punctuality.json`
- `ucr-04-professional-conduct-responsibility.json`
- `ucr-07-professional-appearance-presentation-context.json`
- `ucr-08-accountability-ownership-follow-through.json`
- `ucr-09-boundaries-confidentiality-digital-conduct.json`
- `ucr-11-communication-at-work.json`
- `ucr-12-listening-clarifying-confirming.json`
- `ucr-13-verbal-written-digital-communication.json`
- `ucr-14-difficult-conversations-conflict.json`
- `ucr-15-communication-across-teams-roles-cultures.json`
- `ucr-16-working-as-part-of-a-team.json`
- `ucr-17-roles-responsibilities-shared-goals.json`
- `ucr-18-coordination-handoffs-dependencies.json`
- `ucr-19-team-conflict-trust-accountability.json`
- `ucr-20-high-performing-teams-individual-contribution.json`
- `ucr-21-safety-everyones-responsibility.json`
- `ucr-22-recognizing-hazards-changing-conditions.json`
- `ucr-23-scope-authorization-knowing-when-to-stop.json`
- `ucr-24-reporting-hazards-near-misses-incidents.json`
- `ucr-25-building-strong-safety-culture.json`
- `ucr-26-define-problem-before-solving.json`
- `ucr-27-facts-assumptions-missing-information.json`
- `ucr-28-generate-options-compare-tradeoffs.json`
- `ucr-29-make-communicate-verify-decision.json`
- `ucr-30-learn-from-results-improve-process.json`
- `ucr-36-digital-tools-systems-workplace-responsibility.json`
- `ucr-37-using-ai-assistants-responsibly.json`
- `ucr-38-verify-before-you-trust-ai-output.json`
- `ucr-39-privacy-security-data-boundaries.json`
- `ucr-40-human-judgment-ownership-responsible-ai-decisions.json`
- `ucr-41-accessibility-inclusion-workplace-barriers.json`
- `ucr-42-accessible-communication-digital-content.json`
- `ucr-43-preferences-assistive-tools-inclusive-work-practices.json`
- `ucr-44-accommodations-privacy-appropriate-support.json`
- `ucr-45-self-advocacy-allyship-inclusive-workplaces.json`
- `ucr-46-ethics-integrity-professional-judgment.json`
- `ucr-47-rights-respect-fair-treatment-work.json`
- `ucr-48-confidentiality-privacy-ownership.json`
- `ucr-49-speaking-up-concerns-misconduct-conflicts.json`
- `ucr-50-accountability-honest-reporting-ethical-decisions.json`
- `ucr-51-career-exploration-interests-strengths-work-environments.json`
- `ucr-52-reading-career-paths-job-requirements.json`
- `ucr-53-employer-expectations-preparation-vs-qualification.json`
- `ucr-54-training-credentials-work-based-learning-routes.json`
- `ucr-55-build-career-plan-next-step.json`
- `ucr-56-building-a-truthful-resume.json`
- `ucr-57-turning-experience-into-strong-evidence.json`
- `ucr-58-preparing-for-interviews.json`
- `ucr-59-presenting-yourself-work-story.json`
- `ucr-60-interview-practice-follow-up-professional-presence.json`
- `ucr-61-from-activity-to-evidence.json`
- `ucr-62-what-makes-evidence-strong.json`
- `ucr-63-review-verification-competency-decisions.json`
- `ucr-64-building-a-truthful-portfolio.json`
- `ucr-65-presenting-skills-without-overclaiming.json`
- `ucr-71-from-career-goal-to-transition-plan.json`
- `ucr-72-mapping-requirements-gaps-next-steps.json`
- `ucr-73-timeline-deadlines-support-network.json`
- `ucr-74-applications-follow-up-backup-plans.json`
- `ucr-75-your-90-day-transition-action-plan.json`

## 18. Healthcare Materials That Remain Reference Only

The following categories must not be mistaken for governed source curriculum:

- CNA / STNA fixture concepts
- Phlebotomy Technician fixture concepts
- commercial product candidate records
- mock cohort/program records
- regulated-program type labels
- healthcare images and promotional assets
- candidate onboarding records
- sales review packets

They may help prove that healthcare concepts exist in the repository.

They do not authorize:

- state-approved training
- clinical training
- certification
- licensure
- credential eligibility
- clinical placement
- employer authorization

## 19. Prepare / Prove Finding

The repository contains a real canonical Prepare / Prove system including:

- activity results
- evidence
- competency definitions
- authorized reviewer decisions

Healthcare discovery did not prove a healthcare-specific proof configuration set.

Therefore:

- do not fabricate Healthcare competency IDs
- do not create a parallel Healthcare evidence system
- do not assume candidate proof activities require new competency definitions
- first audit functional equivalence against existing competency definitions and Prepare / Prove configurations
- treat all Healthcare proof concepts as candidates until Artifact 3 resolves them

## 20. Candidate Proof Reuse Questions

The Healthcare Proof Activity Plan must specifically resolve:

### Healthcare Handoff Exercise

Review whether existing communication, coordination, handoff, and evidence competencies are functionally equivalent before creating anything new.

### Safety / Scope Decision Scenario

Review whether existing safety-awareness, scope, authorization, escalation, problem-solving, and decision-making competency definitions are sufficient.

### Evidence / Career Self-Advocacy Presentation

Review whether existing UCR evidence/self-advocacy proof configuration can be reused directly or contextualized.

No healthcare-specific proof authority should be created merely because the examples are healthcare-related.

## 21. Source Construction Implication

If this reuse map is approved, future Healthcare source construction should not mean writing 60 entirely new lessons.

The intended model is:

existing UCR source
→ Healthcare composition / contextualization
→ a limited number of genuinely new healthcare-specific source lessons
→ healthcare-specific activities where needed
→ canonical assessment / evidence / completion / Career systems

The implementation work order must determine how that composition is represented in actual source files.

## 22. Current Estimated New-Content Burden

Pass 2 discovery currently suggests:

- very high reuse of UCR transferable capability
- moderate healthcare-specific contextualization
- limited truly new healthcare foundational lessons
- no evidence yet for a separate healthcare competency architecture
- no evidence yet for a separate healthcare Prepare / Prove architecture
- no evidence yet for regulated healthcare curriculum authority

This is consistent with the Pass 1 architectural decision.

## 23. Acceptance Gate

This reuse map is ready for approval only if review confirms:

- all 60 proposed lessons have a reuse decision
- exact UCR source paths are used where known
- UCR capability is not duplicated
- healthcare fixture data remains reference-only
- regulated-program labels are not treated as training authority
- no competency IDs are fabricated
- Prepare / Prove remains canonical
- Career remains canonical
- Completion Policy remains canonical
- evidence candidates remain distinct from verified competency
- new lessons are limited to genuinely missing healthcare-specific objectives

## 24. Pass 2 Artifact Relationship

Healthcare Pass 2 planning sequence:

1. `HEALTHCARE_WORKFORCE_READINESS_SOURCE_CURRICULUM_PLAN.md`
2. `HEALTHCARE_WORKFORCE_READINESS_LESSON_REUSE_MAP.md`
3. `HEALTHCARE_WORKFORCE_READINESS_PROOF_ACTIVITY_PLAN.md`
4. `HEALTHCARE_WORKFORCE_READINESS_PASS_2_IMPLEMENTATION_WORK_ORDER.md`

Artifact 1 exists as an uncommitted planning document.

This document is Artifact 2.

Implementation remains blocked.

## 25. Current Decision

HEALTHCARE PASS 2 LESSON REUSE MAP — DRAFT FOR REVIEW

Current architecture decision:

REUSE UCR AGGRESSIVELY
→ CONTEXTUALIZE FOR HEALTHCARE
→ EXTEND WHERE HEALTHCARE WORKFLOW REQUIRES IT
→ BUILD NEW ONLY FOR PROVEN MISSING HEALTHCARE OBJECTIVES

No implementation is authorized by this document.
