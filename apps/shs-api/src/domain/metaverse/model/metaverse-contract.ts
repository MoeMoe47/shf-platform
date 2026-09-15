// MET-1 Canonical Metaverse Architecture contracts.
//
// This module is intentionally declarative: no persistence, no routes, no
// gameplay, no credential/evidence issuance. Future implementation phases can
// import these constants as guardrails while existing canonical domains remain
// the source of truth.

export type MetaverseAuthorityClassification = {
  authorityId: string;
  canonicalOwner: string;
  metaverseMayRead: boolean;
  metaverseMayProject: boolean;
  metaverseMayWrite: boolean;
  metaverseMustNotOwn: boolean;
  notes: string;
};

export const METAVERSE_CANONICAL_OWNER = "metaverse-experience-orchestration" as const;

export const METAVERSE_AUTHORITY_MAP: MetaverseAuthorityClassification[] = [
  {
    authorityId: "metaverse-experience",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Owns city experience definitions, sessions, simulation state, and operational event emission only.",
  },
  {
    authorityId: "city-registry",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Owns non-visual city/district/facility definitions and destination mappings.",
  },
  {
    authorityId: "district-registry",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Owns district metadata, status, and access requirements; not visual implementation.",
  },
  {
    authorityId: "facility-registry",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Owns facility metadata and links to canonical app/domain destinations.",
  },
  {
    authorityId: "learner-unlock-projection",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Derived projection only; inputs must be server-authoritative facts from existing domains.",
  },
  {
    authorityId: "metaverse-task-definitions",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Defines task structure, allowed actions, completion conditions, and evidence requirements.",
  },
  {
    authorityId: "job-simulations",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Owns simulated role/task bundles but not employment, credential, or career certification authority.",
  },
  {
    authorityId: "civic-simulations",
    canonicalOwner: "shf-civic",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "SHF Civic owns civic-learning and simulated governance rules; CivicSure is excluded.",
  },
  {
    authorityId: "economy-projection",
    canonicalOwner: "unresolved-treasury-economy-authority",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "MET-0 found disconnected ledgers; metaverse may not fabricate canonical balances.",
  },
  {
    authorityId: "experience-rewards",
    canonicalOwner: METAVERSE_CANONICAL_OWNER,
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: true,
    metaverseMustNotOwn: false,
    notes: "Non-authoritative experience rewards only; resettable and not credentials/currency.",
  },
  {
    authorityId: "evidence-emission",
    canonicalOwner: "verified-evidence-domain",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Metaverse emits operational events/evidence candidates; evidence projection remains canonical.",
  },
  {
    authorityId: "verification",
    canonicalOwner: "prepare-prove-verification-and-truth-domains",
    metaverseMayRead: true,
    metaverseMayProject: false,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Task completion is not verified mastery; reviewer/truth workflows decide verification.",
  },
  {
    authorityId: "portfolio",
    canonicalOwner: "portfolio-domain",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Portfolio projection remains canonical; metaverse may request/provide eligible source references.",
  },
  {
    authorityId: "reporting",
    canonicalOwner: "reporting-and-metric-registry-domains",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Reports consume verified facts and approved metrics, not raw metaverse UI state.",
  },
  {
    authorityId: "accessibility",
    canonicalOwner: "accessibility-profile-effective-runtime",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Metaverse must honor canonical accessibility profile/effective runtime.",
  },
  {
    authorityId: "notifications",
    canonicalOwner: "notification-domain",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Metaverse may request notifications through existing notification authority.",
  },
  {
    authorityId: "identity",
    canonicalOwner: "identity-auth-organization-tenant-domains",
    metaverseMayRead: true,
    metaverseMayProject: false,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "req.user, active organization, tenant, roles, and permissions remain canonical.",
  },
  {
    authorityId: "career-authority",
    canonicalOwner: "career-pathways-credentials-career-events-domains",
    metaverseMayRead: true,
    metaverseMayProject: true,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Metaverse cannot define real career certification, pathway completion, or employment status.",
  },
  {
    authorityId: "credential-issuance",
    canonicalOwner: "credentials-domain",
    metaverseMayRead: true,
    metaverseMayProject: false,
    metaverseMayWrite: false,
    metaverseMustNotOwn: true,
    notes: "Credential definitions/eligibility/issuance remain authority-gated outside metaverse.",
  },
];

export const METAVERSE_DOMAIN_BOUNDARY = {
  owns: [
    "city/district/facility experience definitions",
    "task and simulation definitions",
    "unlock projection logic",
    "metaverse session and non-authoritative progress state",
    "simulation state",
    "non-authoritative experience rewards",
    "operational event emission",
  ],
  doesNotOwn: [
    "identity",
    "organization membership",
    "roles",
    "entitlements",
    "curriculum completion",
    "career certification",
    "civic institutional authority",
    "credentials",
    "verified evidence",
    "Truth Spine facts",
    "reporting metrics",
    "real financial balances",
  ],
} as const;

export const CITY_REGISTRY_REQUIRED_FIELDS = [
  "city_id",
  "version",
  "status",
  "districts",
  "facilities",
  "destinations",
  "activities",
  "access_requirements",
  "career_alignment",
  "curriculum_alignment",
  "civic_alignment",
  "economy_participation",
  "accessibility_alternatives",
  "evidence_capabilities",
] as const;

export const LEARNER_UNLOCK_CONTRACT = {
  projectionOwner: METAVERSE_CANONICAL_OWNER,
  serverAuthoritativeRequired: true,
  clientStateCanGrantAuthority: false,
  unlockTargets: ["district", "facility", "task", "job_simulation", "civic_office_simulation", "advanced_activity"],
  allowedInputs: [
    "organization",
    "program",
    "cohort",
    "course_unit_lesson_completion",
    "milestone",
    "verified_evidence",
    "credential_or_certification",
    "skill_profile",
    "career_pathway_state",
    "age_grade_policy",
    "role_permission",
  ],
  forbiddenInputs: ["localStorage", "query_string_claim", "browser_flag", "client_submitted_mastery", "client_submitted_credential"],
} as const;

export const METAVERSE_TASK_REQUIRED_FIELDS = [
  "task_id",
  "version",
  "title",
  "description",
  "district_id",
  "facility_id",
  "task_type",
  "required_unlocks",
  "curriculum_alignment",
  "career_alignment",
  "civic_alignment",
  "learning_objectives",
  "simulation_inputs",
  "allowed_actions",
  "completion_conditions",
  "evidence_requirements",
  "scoring_rubric_reference",
  "reward_projection",
  "accessibility_equivalent",
  "timeout_retry_policy",
  "safety_constraints",
  "status",
] as const;

export const METAVERSE_TASK_CONTRACT = {
  requiredFields: METAVERSE_TASK_REQUIRED_FIELDS,
  completionEqualsVerifiedMastery: false,
  verifiedMasteryRequiresVerification: true,
  evidenceAuthority: "verified-evidence-domain",
} as const;

export const JOB_SIMULATION_CONTRACT = {
  requiredFields: [
    "job_simulation_id",
    "title",
    "pathway_alignment",
    "prerequisite_unlocks",
    "task_bundle",
    "role_boundaries",
    "allowed_actions",
    "evidence_produced",
    "verification_path",
    "portfolio_output",
    "employer_facing_interpretation",
    "simulated_not_employment_disclaimer",
    "status",
  ],
  exampleRoles: [
    "Data Center Technician",
    "Network Technician",
    "Facilities / Power Technician",
    "Cybersecurity Analyst",
    "Civic Clerk",
    "Treasury Analyst",
    "City Planner",
    "Project Manager",
    "AI / Autonomous Systems Operator",
  ],
  disclaimerRequired: true,
  employmentAuthority: false,
} as const;

export const CIVIC_GOVERNMENT_BOUNDARY = {
  canonicalOwner: "shf-civic",
  civicSureExcluded: true,
  mayHostOrVisualize: ["simulated_elections", "city_council_participation", "simulated_office_roles", "proposals", "treasury_simulation", "planning_exercises", "public_works_exercises"],
  prohibitedClaims: ["actual_government_authority", "real_public_office", "binding_public_budget", "CivicSure_student_government_authority"],
} as const;

export const ECONOMY_BOUNDARY = {
  canonicalEconomyAuthorityResolved: false,
  implementationBlockedUntilAuthorityResolved: true,
  categories: [
    { id: "experience_rewards", canonical: "metaverse-experience", earned: true, displayed: true, spent: false, transferred: false, reset: true, reported: false, audited: false },
    { id: "learning_credits", canonical: "unresolved-canonical-credit-authority", earned: "authority-required", displayed: "projection-only", spent: false, transferred: false, reset: false, reported: "verified-only", audited: true },
    { id: "shf_dollars", canonical: "unresolved-treasury-economy-authority", earned: "blocked", displayed: "projection-only", spent: "blocked", transferred: false, reset: false, reported: "blocked-until-authority", audited: true },
    { id: "real_money", canonical: "external-finance/compliance-authority", earned: false, displayed: false, spent: false, transferred: false, reset: false, reported: false, audited: true },
  ],
} as const;

export const METAVERSE_OPERATIONAL_EVENT_REQUIRED_FIELDS = [
  "event_id",
  "event_type",
  "actor_id",
  "organization_id",
  "session_id",
  "city_id",
  "district_id",
  "facility_id",
  "task_id",
  "task_version",
  "timestamp",
  "attempt_id",
  "action_summary",
  "result_summary",
  "evidence_refs",
  "source_system",
  "provenance",
  "accessibility_mode",
  "verification_status",
] as const;

export const EVIDENCE_VERIFICATION_CONTRACT = {
  path: ["metaverse_task", "operational_event", "evidence_candidate", "evidence_truth_projection", "verification", "portfolio_skill_profile", "reporting"],
  eventRequiredFields: METAVERSE_OPERATIONAL_EVENT_REQUIRED_FIELDS,
  metaverseMayEmitEvents: true,
  metaverseMaySelfCertifyTruth: false,
  verificationStatusInitialValue: "UNVERIFIED",
} as const;

export const METAVERSE_SESSION_REQUIRED_FIELDS = [
  "session_id",
  "user_id",
  "organization_id",
  "active_role",
  "active_learning_context",
  "active_pathway",
  "city_id",
  "district_id",
  "facility_id",
  "active_task",
  "unlock_snapshot_version",
  "started_at",
  "updated_at",
  "ended_at",
  "accessibility_preferences_reference",
] as const;

export const METAVERSE_SESSION_CONTRACT = {
  requiredFields: METAVERSE_SESSION_REQUIRED_FIELDS,
  isIdentityAuthority: false,
  identityReference: "req.user + active organization/tenant context",
} as const;

export const ACCESSIBILITY_CONTRACT = {
  requiredCapabilities: [
    "keyboard_operable_path",
    "screen_reader_equivalent",
    "reduced_motion_mode",
    "non_spatial_alternate_interaction",
    "color_independent_state",
    "captions_transcripts_for_audio_video",
    "mobile_tablet_compatibility",
    "accessible_task_equivalent",
  ],
  preserveLearningObjectiveWhereFeasible: true,
  preserveEvidenceEquivalenceWhereFeasible: true,
} as const;

export const SECURITY_SAFETY_BOUNDARY = {
  requiredProtections: [
    "client_spoofing",
    "fabricated_unlocks",
    "fabricated_completion",
    "replay_attacks",
    "duplicate_evidence",
    "cross_organization_access",
    "role_escalation",
    "economy_manipulation",
    "unsafe_external_links",
    "unauthorized_task_execution",
    "stale_unlock_snapshots",
  ],
  crossOrganizationBoundaryExplicit: true,
  staleUnlockSnapshotsMustRevalidate: true,
} as const;

export const MET0_P0_REMEDIATION = [
  {
    gapId: "MET-GAP-001",
    decision: "Metaverse is an orchestration/experience domain, not an authority for identity, curriculum, credentials, evidence, truth, reporting, or real balances.",
    owner: METAVERSE_CANONICAL_OWNER,
    resultingContract: "METAVERSE_DOMAIN_BOUNDARY and METAVERSE_AUTHORITY_MAP",
    acceptanceTest: "metaverse authority map marks canonical domains as mustNotOwn",
    remainingImplementationDependency: "MET-2+ can implement registries against this boundary",
  },
  {
    gapId: "MET-GAP-002",
    decision: "City/district/facility content must use a declarative registry contract with access, alignment, accessibility, and evidence fields.",
    owner: METAVERSE_CANONICAL_OWNER,
    resultingContract: "CITY_REGISTRY_REQUIRED_FIELDS",
    acceptanceTest: "city registry contract includes required alignment/accessibility/evidence fields",
    remainingImplementationDependency: "MET-2 creates actual registry records",
  },
  {
    gapId: "MET-GAP-003",
    decision: "Unlocks are read-only projections from server-authoritative facts; client-side state cannot grant authority.",
    owner: METAVERSE_CANONICAL_OWNER,
    resultingContract: "LEARNER_UNLOCK_CONTRACT",
    acceptanceTest: "unlock contract rejects localStorage/browser/client-submitted mastery inputs",
    remainingImplementationDependency: "MET-3 implements server-side unlock projection",
  },
  {
    gapId: "MET-GAP-004",
    decision: "Metaverse tasks emit operational events/evidence candidates but cannot self-certify truth or mastery.",
    owner: METAVERSE_CANONICAL_OWNER,
    resultingContract: "METAVERSE_TASK_CONTRACT and EVIDENCE_VERIFICATION_CONTRACT",
    acceptanceTest: "task completion is explicitly distinct from verified mastery",
    remainingImplementationDependency: "MET-4/MET-9 add metaverse source type and evidence projection",
  },
  {
    gapId: "MET-GAP-005",
    decision: "Economy implementation is blocked until a canonical Treasury/economy authority is resolved; categories remain distinct.",
    owner: "unresolved-treasury-economy-authority",
    resultingContract: "ECONOMY_BOUNDARY",
    acceptanceTest: "experience rewards, learning credits, SHF dollars, and real money remain separate categories",
    remainingImplementationDependency: "MET-6 resolves canonical economy authority before transactions",
  },
] as const;

export function validateMetaverseArchitectureContract(): string[] {
  const errors: string[] = [];
  const ids = METAVERSE_AUTHORITY_MAP.map((item) => item.authorityId);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`duplicate authority ids: ${duplicateIds.join(",")}`);

  for (const id of ["identity", "career-authority", "civic-simulations", "evidence-emission", "verification", "credential-issuance"]) {
    const item = METAVERSE_AUTHORITY_MAP.find((entry) => entry.authorityId === id);
    if (!item) errors.push(`missing authority boundary: ${id}`);
    else if (!item.metaverseMustNotOwn || item.metaverseMayWrite) errors.push(`metaverse incorrectly owns/writes ${id}`);
  }

  if (!LEARNER_UNLOCK_CONTRACT.serverAuthoritativeRequired || LEARNER_UNLOCK_CONTRACT.clientStateCanGrantAuthority) {
    errors.push("unlock contract must require server-authoritative facts and reject client authority");
  }
  if (!LEARNER_UNLOCK_CONTRACT.forbiddenInputs.includes("localStorage")) errors.push("unlock contract must forbid localStorage authority");
  if (METAVERSE_TASK_CONTRACT.completionEqualsVerifiedMastery) errors.push("task completion must not equal verified mastery");
  if (!CIVIC_GOVERNMENT_BOUNDARY.civicSureExcluded) errors.push("CivicSure must be excluded from metaverse civic authority");

  const economyIds = ECONOMY_BOUNDARY.categories.map((category) => category.id);
  const requiredEconomyCategories = ["experience_rewards", "learning_credits", "shf_dollars", "real_money"] as const;
  for (const required of requiredEconomyCategories) {
    if (!economyIds.includes(required)) errors.push(`missing economy category: ${required}`);
  }
  if (new Set(economyIds).size !== economyIds.length) errors.push("economy categories must be distinct");
  if (!ECONOMY_BOUNDARY.implementationBlockedUntilAuthorityResolved) errors.push("economy implementation must be blocked until authority is resolved");

  for (const required of ACCESSIBILITY_CONTRACT.requiredCapabilities) {
    if (!required) errors.push("accessibility capability must not be empty");
  }
  if (!ACCESSIBILITY_CONTRACT.requiredCapabilities.includes("accessible_task_equivalent")) errors.push("accessibility equivalent is required");
  if (!SECURITY_SAFETY_BOUNDARY.crossOrganizationBoundaryExplicit) errors.push("cross-org boundary must be explicit");
  if (METAVERSE_SESSION_CONTRACT.isIdentityAuthority) errors.push("session must not become identity authority");
  if (EVIDENCE_VERIFICATION_CONTRACT.metaverseMaySelfCertifyTruth) errors.push("metaverse cannot self-certify truth");
  return errors;
}
