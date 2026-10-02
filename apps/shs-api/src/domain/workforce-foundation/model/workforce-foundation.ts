// Phase 6.5 — Workforce / Fundability Foundation contracts.
//
// Programs are configuration and contracts on shared infrastructure, not course-specific software platforms.
// Funding relationships describe potential alignment; they do not establish eligibility or guarantee funding.
//
// A ProgramPackage only *references* canonical records owned elsewhere (operational Program, Curriculum,
// Arcade descriptors, published Missions, MOL systems, Careers, competencies, credential definitions,
// organizations, funding awards, report profiles). It never copies them and grants no authority.
import { WORKFORCE_CAPABILITY_MATURITY, workforceMolSystemIds } from "../workforce-mol-bridge.js";

export const PROGRAM_PACKAGE_CONTRACT_VERSION = 1;

// Package design lifecycle. Distinct from the operational `programs.status` (draft/active/paused/closed/archived),
// which stays the authority for running a Program in an organization.
export const PROGRAM_LIFECYCLE = Object.freeze([
  "PLANNED", "DESIGN", "AUTHORITY_REVIEW", "INTEGRATION_READINESS", "PARTNER_VALIDATION",
  "PILOT_READY", "PILOT", "ACTIVE", "SUSPENDED", "RETIRED",
] as const);
export type ProgramLifecycle = (typeof PROGRAM_LIFECYCLE)[number];

// One capability vocabulary for every program. Each names the authority that actually provides it.
export const WORKFORCE_CAPABILITIES = Object.freeze({
  CURRICULUM_DELIVERY: "curriculum",
  LEARNING_ARCADE: "arcade-integration",
  MISSION_SIMULATION: "mission-runtime",
  MULTIPLAYER: "mission-team",
  METAVERSE_ENVIRONMENT: "mol",
  EVIDENCE_CAPTURE: "verified-evidence",
  CAREER_MAPPING: "careers",
  EMPLOYER_CONNECTION: "opportunities",
  MENTORING: "external-partner",
  CREDENTIAL_BRIDGE: "credentials",
  APPRENTICESHIP_BRIDGE: "external-authority",
  ACCESSIBILITY: "accessibility",
  REPORTING: "reporting",
  MOCC_VISIBILITY: "mocc",
} as const);
export type WorkforceCapability = keyof typeof WORKFORCE_CAPABILITIES;

// Reused from MOL: PLANNED, CONTRACT_DEFINED, SIMULATED, PARTIAL, LIVE, PRODUCTION.
export const CAPABILITY_MATURITY = WORKFORCE_CAPABILITY_MATURITY;
export const maturityRank = (value: string) => CAPABILITY_MATURITY.indexOf(value);

export const DEPENDENCY_TYPES = Object.freeze([
  "CAPABILITY", "EXTERNAL_AUTHORITY", "PARTNER", "SYSTEM", "CREDENTIALING_BODY", "EMPLOYER",
  "FUNDING_SOURCE", "METAVERSE_ENGINE", "CURRICULUM_PACKAGE", "EVIDENCE_WORKFLOW",
] as const);
export const DEPENDENCY_STATUSES = Object.freeze(["UNKNOWN", "PLANNED", "AVAILABLE", "DEGRADED", "UNAVAILABLE"] as const);

export const AUTHORITY_LEVELS = Object.freeze(["ADVISE", "TEACH", "SUPERVISE", "VERIFY", "ISSUE"] as const);
// ISSUE needs an explicit, checkable basis; it is never inferred from ownership of the Program.
export const ISSUANCE_BASES = Object.freeze(["LEGAL", "CONTRACTUAL", "INTERNAL_CREDENTIAL_DEFINITION"] as const);

export const EXTERNAL_AUTHORITY_TYPES = Object.freeze([
  "STATE_APPROVED_TRAINING_PROVIDER", "REGISTERED_APPRENTICESHIP_SPONSOR", "CREDENTIAL_ISSUER",
  "LICENSING_AUTHORITY", "EMPLOYER_QUALIFICATION_PROCESS",
] as const);
export const EXTERNAL_AUTHORITY_STATUSES = Object.freeze(["PLACEHOLDER", "IDENTIFIED", "CONFIRMED"] as const);

export const PARTNER_ROLES = Object.freeze([
  "EMPLOYER_PARTNER", "TRAINING_PARTNER", "CREDENTIAL_AUTHORITY", "APPRENTICESHIP_SPONSOR",
  "MENTOR_PARTNER", "FUNDING_PARTNER", "FACILITY_PARTNER",
] as const);
// A declared partner is a design intent; CONFIRMED needs an agreement reference. Neither implies employment.
export const PARTNER_STATUSES = Object.freeze(["DECLARED", "CONFIRMED", "ENDED"] as const);

export const FUNDING_SOURCE_TYPES = Object.freeze([
  "GRANT", "WORKFORCE", "EMPLOYER", "APPRENTICESHIP", "PHILANTHROPY", "SPONSORSHIP", "INSTITUTIONAL_PURCHASE", "COMMERCIAL",
] as const);
// Alignment is not eligibility. VERIFIED only points at an existing award/assurance record owned elsewhere.
export const FUNDING_ALIGNMENT_STATUSES = Object.freeze(["UNKNOWN", "POTENTIAL", "VERIFIED"] as const);
export const FUNDING_VERIFICATION_SOURCES = Object.freeze(["FUNDING_GRANT", "GPA_FUNDING_REFERENCE"] as const);
export const FUNDING_BUCKETS = Object.freeze(["SHARED_INFRASTRUCTURE", "DESTINATION_PROGRAM", "CROSS_DESTINATION_MISSION"] as const);

export const EVIDENCE_REQUIREMENT_TYPES = Object.freeze([
  "INDIVIDUAL_DEMONSTRATION", "TEAM_PERFORMANCE_CONTEXT", "SUPERVISOR_VERIFICATION", "EXTERNAL_CREDENTIAL_VERIFICATION",
] as const);

export const REPORTING_METRICS = Object.freeze([
  "ENROLLMENT", "PARTICIPATION", "COMPLETION", "DEMONSTRATION", "EVIDENCE", "CAREER_CONNECTION", "CREDENTIAL_PROGRESSION", "EMPLOYMENT_OUTCOME",
] as const);
// An operational metric is observation; only the Truth Spine turns a fact into verified institutional truth.
export const REPORTING_KINDS = Object.freeze(["OPERATIONAL_METRIC", "VERIFIED_INSTITUTIONAL_TRUTH"] as const);

export const READINESS_ANSWERS = Object.freeze(["ANSWERED", "NOT_APPLICABLE", "GAP"] as const);

export interface CapabilityDeclaration {
  capability: WorkforceCapability;
  required: boolean;
  maturity: string;
  // LIVE/PRODUCTION must not overstate the providing system; PRODUCTION needs a passed acceptance reference.
  acceptanceRef?: string | null;
  molSystemIds?: string[];
  fundingBucket: (typeof FUNDING_BUCKETS)[number];
}

export interface DependencyDeclaration {
  dependencyId: string;
  type: (typeof DEPENDENCY_TYPES)[number];
  required: boolean;
  status: (typeof DEPENDENCY_STATUSES)[number];
  owner: string;
  fallback: string | null;
  constraints: string;
}

export interface AuthorityDeclaration {
  domain: string;
  owner: string;
  external: boolean;
  levels: Array<(typeof AUTHORITY_LEVELS)[number]>;
  issuanceBasis?: { type: (typeof ISSUANCE_BASES)[number]; reference: string } | null;
  mayRead: string[];
  mayRequest: string[];
  mayVerify: string[];
  mayNotControl: string[];
}

export interface FundingSource {
  fundingSourceId: string;
  name: string;
  sourceType: (typeof FUNDING_SOURCE_TYPES)[number];
  jurisdiction: string;
  eligibleProgramTypes: string[];
  eligibleCostCategories: string[];
  matchRequired: boolean | "UNKNOWN";
  reportingRequirements: string[];
  authority: string;
  status: "ACTIVE" | "INACTIVE" | "UNKNOWN";
  evidenceRequirements: string[];
}

export interface FundingRelationship {
  fundingSourceId: string;
  alignment: (typeof FUNDING_ALIGNMENT_STATUSES)[number];
  verification?: { source: (typeof FUNDING_VERIFICATION_SOURCES)[number]; recordId: string } | null;
  capabilityRefs: WorkforceCapability[];
}

export interface ReadinessAnswer { answer: (typeof READINESS_ANSWERS)[number]; justification?: string }

export interface ProgramPackage {
  contractVersion: number;
  program: {
    programId: string;
    name: string;
    lifecycle: ProgramLifecycle;
    programType: string;
    owningOrganizationId: string;
    authorityOwner: string;
    geography: string;
    audience: string;
    // Optional binding to the operational Program row (programs table) in the owning organization.
    operationalProgramId: string | null;
  };
  // A course is referenced by its org-scoped id, or (Phase 7) by its deterministic import stable key, which is
  // the only identity that is the same in every organization that imports the canonical curriculum.
  curriculumRefs: Array<{ courseId: string } | { courseStableKey: string }>;
  arcadeExperienceRefs: Array<{ experienceId: string }>;
  missionRefs: Array<{ missionId: string; missionVersion: number }>;
  metaverseRefs: Array<{ molSystemId: string }>;
  careerRefs: Array<{ careerId: string }>;
  competencyRefs: Array<{ competencyId: string }>;
  capabilityRefs: CapabilityDeclaration[];
  evidenceRequirements: Array<{ requirementType: (typeof EVIDENCE_REQUIREMENT_TYPES)[number]; competencyId: string | null }>;
  authorityRefs: AuthorityDeclaration[];
  credentialAuthorityRefs: Array<{ authorityType: (typeof EXTERNAL_AUTHORITY_TYPES)[number]; name: string; status: (typeof EXTERNAL_AUTHORITY_STATUSES)[number]; credentialDefinitionId: string | null }>;
  fundingRefs: FundingRelationship[];
  accessibilityRequirements: string[];
  partnerRefs: Array<{ organizationId: string; role: (typeof PARTNER_ROLES)[number]; status: (typeof PARTNER_STATUSES)[number]; agreementRef: string | null }>;
  reportingRequirements: Array<{ metric: (typeof REPORTING_METRICS)[number]; kind: (typeof REPORTING_KINDS)[number]; reportProfileKey: string | null }>;
  dependencyRefs: DependencyDeclaration[];
  integrationReadiness: Partial<Record<IntegrationReadinessQuestion, ReadinessAnswer>>;
  // References to Experience Layer sensory profiles (src/shared/experience/sensory). Optional; owned there.
  sensoryRefs?: SensoryRefs;
}

export const SENSORY_REF_KEYS = Object.freeze(["soundProfileRef", "celebrationProfileRef", "environmentAudioProfileRef", "sensoryPolicyRef"] as const);
export type SensoryRefs = Record<(typeof SENSORY_REF_KEYS)[number], string | null>;

export const INTEGRATION_READINESS_QUESTIONS = Object.freeze([
  "CURRICULUM", "ARCADE", "MISSIONS", "METAVERSE", "EVIDENCE", "CAREER", "EXTERNAL_CREDENTIAL_AUTHORITY",
  "ACCESSIBILITY", "PARTNERS", "FUNDING_LANES", "CAPABILITY_MATURITY", "BLOCKING_DEPENDENCIES",
] as const);
export type IntegrationReadinessQuestion = (typeof INTEGRATION_READINESS_QUESTIONS)[number];

// Bounds: references stay small; a package is a contract, not a content store.
export const PROGRAM_PACKAGE_LIMITS = Object.freeze({ refs: 24, capabilities: 14, dependencies: 32, authorities: 16, funding: 16, text: 200 });

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const isRecord = (value: unknown): value is Record<string, any> => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number = PROGRAM_PACKAGE_LIMITS.text) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const ids = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string" && ID.test(item));

function onlyKeys(value: Record<string, any>, keys: string[], path: string, errors: string[]) {
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`${path}.${key}: unsupported field`);
}

function refList(errors: string[], value: unknown, path: string, check: (item: any, at: string) => void) {
  if (!Array.isArray(value)) return void errors.push(`${path} must be an array`);
  if (value.length > PROGRAM_PACKAGE_LIMITS.refs) errors.push(`${path} exceeds ${PROGRAM_PACKAGE_LIMITS.refs} references`);
  value.forEach((item, index) => (isRecord(item) ? check(item, `${path}[${index}]`) : errors.push(`${path}[${index}] must be an object`)));
}

export function validateFundingSource(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["funding source must be an object"];
  onlyKeys(value, ["fundingSourceId", "name", "sourceType", "jurisdiction", "eligibleProgramTypes", "eligibleCostCategories", "matchRequired",
    "reportingRequirements", "authority", "status", "evidenceRequirements"], "fundingSource", errors);
  if (!ID.test(String(value.fundingSourceId ?? ""))) errors.push("fundingSourceId is invalid");
  if (!text(value.name)) errors.push("name is required");
  if (!FUNDING_SOURCE_TYPES.includes(value.sourceType)) errors.push("sourceType is invalid");
  if (!text(value.jurisdiction)) errors.push("jurisdiction is required");
  if (!text(value.authority)) errors.push("authority is required");
  for (const key of ["eligibleProgramTypes", "eligibleCostCategories", "reportingRequirements", "evidenceRequirements"]) {
    if (!Array.isArray(value[key]) || !value[key].every((item: unknown) => text(item))) errors.push(`${key} must be an array of bounded text`);
  }
  if (!(value.matchRequired === true || value.matchRequired === false || value.matchRequired === "UNKNOWN")) errors.push("matchRequired must be true, false or UNKNOWN");
  if (!["ACTIVE", "INACTIVE", "UNKNOWN"].includes(value.status)) errors.push("status is invalid");
  return errors;
}

export function validateProgramPackage(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["program package must be an object"];
  onlyKeys(value, ["contractVersion", "program", "curriculumRefs", "arcadeExperienceRefs", "missionRefs", "metaverseRefs", "careerRefs", "competencyRefs",
    "capabilityRefs", "evidenceRequirements", "authorityRefs", "credentialAuthorityRefs", "fundingRefs", "accessibilityRequirements", "partnerRefs",
    "reportingRequirements", "dependencyRefs", "integrationReadiness", "sensoryRefs"], "package", errors);
  if (value.contractVersion !== PROGRAM_PACKAGE_CONTRACT_VERSION) errors.push(`contractVersion must be ${PROGRAM_PACKAGE_CONTRACT_VERSION}`);

  const program = value.program;
  if (!isRecord(program)) errors.push("program is required");
  else {
    onlyKeys(program, ["programId", "name", "lifecycle", "programType", "owningOrganizationId", "authorityOwner", "geography", "audience", "operationalProgramId"], "program", errors);
    if (!ID.test(String(program.programId ?? ""))) errors.push("program.programId is invalid");
    if (!text(program.name)) errors.push("program.name is required");
    if (!PROGRAM_LIFECYCLE.includes(program.lifecycle)) errors.push("program.lifecycle is invalid");
    if (!text(program.programType, 80)) errors.push("program.programType is required");
    if (!ID.test(String(program.owningOrganizationId ?? ""))) errors.push("program.owningOrganizationId is required");
    if (!text(program.authorityOwner, 120)) errors.push("program.authorityOwner is required");
    if (!text(program.geography)) errors.push("program.geography is required");
    if (!text(program.audience)) errors.push("program.audience is required");
    if (!(program.operationalProgramId === null || ID.test(String(program.operationalProgramId ?? "")))) errors.push("program.operationalProgramId must be an id or null");
  }

  refList(errors, value.curriculumRefs, "curriculumRefs", (item, at) => {
    onlyKeys(item, ["courseId", "courseStableKey"], at, errors);
    const byId = item.courseId !== undefined;
    const byKey = item.courseStableKey !== undefined;
    if (byId === byKey) errors.push(`${at} must declare exactly one of courseId or courseStableKey`);
    else if (!ID.test(String(byId ? item.courseId : item.courseStableKey))) errors.push(`${at}.${byId ? "courseId" : "courseStableKey"} is invalid`);
  });
  refList(errors, value.arcadeExperienceRefs, "arcadeExperienceRefs", (item, at) => { onlyKeys(item, ["experienceId"], at, errors); if (!ID.test(String(item.experienceId ?? ""))) errors.push(`${at}.experienceId is invalid`); });
  refList(errors, value.missionRefs, "missionRefs", (item, at) => {
    onlyKeys(item, ["missionId", "missionVersion"], at, errors);
    if (!ID.test(String(item.missionId ?? ""))) errors.push(`${at}.missionId is invalid`);
    // Exact versions only: Programs never float on "latest".
    if (!Number.isInteger(item.missionVersion) || item.missionVersion < 1) errors.push(`${at}.missionVersion must be an exact positive integer`);
  });
  const molIds = workforceMolSystemIds();
  refList(errors, value.metaverseRefs, "metaverseRefs", (item, at) => {
    onlyKeys(item, ["molSystemId"], at, errors);
    if (!molIds.includes(item.molSystemId)) errors.push(`${at}.molSystemId must reference a MOL System Registry entry`);
  });
  refList(errors, value.careerRefs, "careerRefs", (item, at) => { onlyKeys(item, ["careerId"], at, errors); if (!ID.test(String(item.careerId ?? ""))) errors.push(`${at}.careerId is invalid`); });
  refList(errors, value.competencyRefs, "competencyRefs", (item, at) => { onlyKeys(item, ["competencyId"], at, errors); if (!ID.test(String(item.competencyId ?? ""))) errors.push(`${at}.competencyId is invalid`); });

  if (!Array.isArray(value.capabilityRefs)) errors.push("capabilityRefs must be an array");
  else {
    if (value.capabilityRefs.length > PROGRAM_PACKAGE_LIMITS.capabilities) errors.push("capabilityRefs exceeds the capability vocabulary");
    const seen = new Set<string>();
    value.capabilityRefs.forEach((item: any, index: number) => {
      const at = `capabilityRefs[${index}]`;
      if (!isRecord(item)) return void errors.push(`${at} must be an object`);
      onlyKeys(item, ["capability", "required", "maturity", "acceptanceRef", "molSystemIds", "fundingBucket"], at, errors);
      if (!(item.capability in WORKFORCE_CAPABILITIES)) errors.push(`${at}.capability is not in the capability registry`);
      if (seen.has(item.capability)) errors.push(`${at}.capability is duplicated`);
      seen.add(item.capability);
      if (typeof item.required !== "boolean") errors.push(`${at}.required must be boolean`);
      if (!CAPABILITY_MATURITY.includes(item.maturity)) errors.push(`${at}.maturity must be one of ${CAPABILITY_MATURITY.join(", ")}`);
      if (item.maturity === "PRODUCTION" && !text(item.acceptanceRef, 160)) errors.push(`${at}: PRODUCTION requires a passed acceptanceRef`);
      if (item.molSystemIds !== undefined && !(ids(item.molSystemIds) && item.molSystemIds.every((id: string) => molIds.includes(id)))) errors.push(`${at}.molSystemIds must reference MOL systems`);
      if (item.capability === "METAVERSE_ENVIRONMENT" && !(Array.isArray(item.molSystemIds) && item.molSystemIds.length)) errors.push(`${at}: METAVERSE_ENVIRONMENT must name the MOL systems that provide it`);
      if (!FUNDING_BUCKETS.includes(item.fundingBucket)) errors.push(`${at}.fundingBucket is invalid`);
    });
  }

  refList(errors, value.evidenceRequirements, "evidenceRequirements", (item, at) => {
    onlyKeys(item, ["requirementType", "competencyId"], at, errors);
    if (!EVIDENCE_REQUIREMENT_TYPES.includes(item.requirementType)) errors.push(`${at}.requirementType is invalid`);
    if (!(item.competencyId === null || ID.test(String(item.competencyId ?? "")))) errors.push(`${at}.competencyId must be an id or null`);
  });

  if (!Array.isArray(value.authorityRefs) || value.authorityRefs.length === 0) errors.push("authorityRefs must declare at least the program authority");
  else value.authorityRefs.forEach((item: any, index: number) => {
    const at = `authorityRefs[${index}]`;
    if (!isRecord(item)) return void errors.push(`${at} must be an object`);
    onlyKeys(item, ["domain", "owner", "external", "levels", "issuanceBasis", "mayRead", "mayRequest", "mayVerify", "mayNotControl"], at, errors);
    if (!text(item.domain, 80)) errors.push(`${at}.domain is required`);
    if (!text(item.owner, 120)) errors.push(`${at}.owner is required`);
    if (typeof item.external !== "boolean") errors.push(`${at}.external must be boolean`);
    if (!Array.isArray(item.levels) || !item.levels.length || !item.levels.every((level: any) => AUTHORITY_LEVELS.includes(level))) errors.push(`${at}.levels are invalid`);
    if (Array.isArray(item.levels) && item.levels.includes("ISSUE")) {
      const basis = item.issuanceBasis;
      if (!isRecord(basis) || !ISSUANCE_BASES.includes(basis.type) || !text(basis.reference, 160)) errors.push(`${at}: ISSUE requires an explicit issuanceBasis`);
      // An internal (SHF/SHS) authority may only issue its own INTERNAL credential definitions.
      else if (item.external === false && basis.type !== "INTERNAL_CREDENTIAL_DEFINITION") errors.push(`${at}: an internal authority cannot claim ${basis.type} issuance`);
    } else if (item.issuanceBasis != null) errors.push(`${at}.issuanceBasis is only valid with ISSUE`);
    for (const key of ["mayRead", "mayRequest", "mayVerify", "mayNotControl"]) if (!Array.isArray(item[key]) || !item[key].every((entry: unknown) => text(entry, 120))) errors.push(`${at}.${key} must be bounded text`);
  });

  refList(errors, value.credentialAuthorityRefs, "credentialAuthorityRefs", (item, at) => {
    onlyKeys(item, ["authorityType", "name", "status", "credentialDefinitionId"], at, errors);
    if (!EXTERNAL_AUTHORITY_TYPES.includes(item.authorityType)) errors.push(`${at}.authorityType is invalid`);
    if (!text(item.name, 160)) errors.push(`${at}.name is required`);
    if (!EXTERNAL_AUTHORITY_STATUSES.includes(item.status)) errors.push(`${at}.status is invalid`);
    if (!(item.credentialDefinitionId === null || ID.test(String(item.credentialDefinitionId ?? "")))) errors.push(`${at}.credentialDefinitionId must be an id or null`);
  });

  if (!Array.isArray(value.fundingRefs)) errors.push("fundingRefs must be an array");
  else value.fundingRefs.slice(0, PROGRAM_PACKAGE_LIMITS.funding + 1).forEach((item: any, index: number) => {
    const at = `fundingRefs[${index}]`;
    if (index >= PROGRAM_PACKAGE_LIMITS.funding) return void errors.push("fundingRefs exceeds the bound");
    if (!isRecord(item)) return void errors.push(`${at} must be an object`);
    onlyKeys(item, ["fundingSourceId", "alignment", "verification", "capabilityRefs"], at, errors);
    if (!ID.test(String(item.fundingSourceId ?? ""))) errors.push(`${at}.fundingSourceId is invalid`);
    if (!FUNDING_ALIGNMENT_STATUSES.includes(item.alignment)) errors.push(`${at}.alignment must be UNKNOWN, POTENTIAL or VERIFIED`);
    const verification = item.verification;
    if (item.alignment === "VERIFIED") {
      if (!isRecord(verification) || !FUNDING_VERIFICATION_SOURCES.includes(verification.source) || !ID.test(String(verification.recordId ?? ""))) {
        errors.push(`${at}: VERIFIED requires a verification reference to an existing funding award or assurance record`);
      }
    } else if (verification != null) errors.push(`${at}.verification is only valid with VERIFIED`);
    if (!Array.isArray(item.capabilityRefs) || !item.capabilityRefs.every((cap: string) => cap in WORKFORCE_CAPABILITIES)) errors.push(`${at}.capabilityRefs must name registry capabilities`);
  });

  if (!Array.isArray(value.accessibilityRequirements) || !value.accessibilityRequirements.every((item: unknown) => text(item, 120))) errors.push("accessibilityRequirements must be bounded text");
  refList(errors, value.partnerRefs, "partnerRefs", (item, at) => {
    onlyKeys(item, ["organizationId", "role", "status", "agreementRef"], at, errors);
    if (!ID.test(String(item.organizationId ?? ""))) errors.push(`${at}.organizationId is invalid`);
    if (!PARTNER_ROLES.includes(item.role)) errors.push(`${at}.role is invalid`);
    if (!PARTNER_STATUSES.includes(item.status)) errors.push(`${at}.status is invalid`);
    if (item.status === "CONFIRMED" && !text(item.agreementRef, 160)) errors.push(`${at}: CONFIRMED requires an agreementRef`);
  });
  refList(errors, value.reportingRequirements, "reportingRequirements", (item, at) => {
    onlyKeys(item, ["metric", "kind", "reportProfileKey"], at, errors);
    if (!REPORTING_METRICS.includes(item.metric)) errors.push(`${at}.metric is invalid`);
    if (!REPORTING_KINDS.includes(item.kind)) errors.push(`${at}.kind is invalid`);
    if (!(item.reportProfileKey === null || text(item.reportProfileKey, 160))) errors.push(`${at}.reportProfileKey must be text or null`);
  });

  if (!Array.isArray(value.dependencyRefs)) errors.push("dependencyRefs must be an array");
  else {
    if (value.dependencyRefs.length > PROGRAM_PACKAGE_LIMITS.dependencies) errors.push("dependencyRefs exceeds the bound");
    const seen = new Set<string>();
    value.dependencyRefs.forEach((item: any, index: number) => {
      const at = `dependencyRefs[${index}]`;
      if (!isRecord(item)) return void errors.push(`${at} must be an object`);
      onlyKeys(item, ["dependencyId", "type", "required", "status", "owner", "fallback", "constraints"], at, errors);
      if (!ID.test(String(item.dependencyId ?? ""))) errors.push(`${at}.dependencyId is invalid`);
      if (seen.has(item.dependencyId)) errors.push(`${at}.dependencyId is duplicated`);
      seen.add(item.dependencyId);
      if (!DEPENDENCY_TYPES.includes(item.type)) errors.push(`${at}.type is invalid`);
      if (typeof item.required !== "boolean") errors.push(`${at}.required must be boolean`);
      if (!DEPENDENCY_STATUSES.includes(item.status)) errors.push(`${at}.status is invalid`);
      if (!text(item.owner, 120)) errors.push(`${at}.owner is required`);
      if (!(item.fallback === null || text(item.fallback))) errors.push(`${at}.fallback must be text or null`);
      if (typeof item.constraints !== "string" || item.constraints.length > PROGRAM_PACKAGE_LIMITS.text) errors.push(`${at}.constraints must be bounded text`);
    });
  }

  if (value.sensoryRefs !== undefined) {
    if (!isRecord(value.sensoryRefs)) errors.push("sensoryRefs must be an object");
    else {
      onlyKeys(value.sensoryRefs, [...SENSORY_REF_KEYS], "sensoryRefs", errors);
      for (const key of SENSORY_REF_KEYS) {
        const ref = value.sensoryRefs[key];
        if (!(ref === null || (typeof ref === "string" && ID.test(ref)))) errors.push(`sensoryRefs.${key} must be a reference id or null`);
      }
    }
  }

  if (!isRecord(value.integrationReadiness)) errors.push("integrationReadiness must be an object");
  else for (const [question, answer] of Object.entries(value.integrationReadiness)) {
    if (!INTEGRATION_READINESS_QUESTIONS.includes(question as IntegrationReadinessQuestion)) errors.push(`integrationReadiness.${question}: unknown question`);
    else if (!isRecord(answer) || !READINESS_ANSWERS.includes(answer.answer)) errors.push(`integrationReadiness.${question}: invalid answer`);
    else if (answer.answer === "NOT_APPLICABLE" && !text(answer.justification)) errors.push(`integrationReadiness.${question}: NOT_APPLICABLE requires a justification`);
  }
  return errors;
}
