// Phase 6.5 — Workforce / Fundability Foundation contracts.
// Phase 8 — Workforce Program Integration Contract (ProgramPackage schemaVersion 2).
//
// ProgramPackages coordinate canonical authorities; they do not replace them.
// A workforce program may add content, mappings and configuration without creating a new engine when a shared
// platform capability already exists.
// Program completion does not establish verified mastery, credential attainment, career eligibility, funding
// eligibility, employment eligibility or institutional truth.
//
// Programs are configuration and contracts on shared infrastructure, not course-specific software platforms.
// Funding relationships describe potential alignment; they do not establish eligibility or guarantee funding.
//
// A ProgramPackage only *references* canonical records owned elsewhere (operational Program, Curriculum,
// Arcade descriptors, published Missions, MOL systems, Careers, competencies, credential definitions,
// organizations, funding awards, report profiles). It never copies them and grants no authority.
import { MISSION_WORLD_CAPABILITY_NAMES } from "../../mission-content/model/mission-world.js";
import { WORKFORCE_CAPABILITY_MATURITY, WORKFORCE_PROVIDER_MODES, isWorkforceDestinationId, workforceMolSystemIds } from "../workforce-mol-bridge.js";

// The schema version belongs to the package contract only — never to a Mission, curriculum, descriptor, credential
// or sensory profile version. Validation fails closed on any unsupported version (schemaVersion 1 used the former
// "contractVersion" field and is no longer accepted).
export const PROGRAM_PACKAGE_SCHEMA_VERSION = 2;
export const SUPPORTED_PROGRAM_SCHEMA_VERSIONS: readonly number[] = Object.freeze([PROGRAM_PACKAGE_SCHEMA_VERSION]);

// Execution level: how much of the shared world a program needs. STANDALONE uses approved simulated stand-ins;
// HYBRID mixes LIVE engines with simulated stand-ins; LIVING_WORLD needs the future regional simulation authority.
export const EXECUTION_LEVELS = Object.freeze(["STANDALONE", "HYBRID", "LIVING_WORLD"] as const);
export type ExecutionLevel = (typeof EXECUTION_LEVELS)[number];
export const executionLevelRank = (level: string) => EXECUTION_LEVELS.indexOf(level as ExecutionLevel);
// Reused from MOL: LIVE, SIMULATED, HYBRID, TEST, UNAVAILABLE. A provider mode is not a maturity.
export const PROVIDER_MODES = WORKFORCE_PROVIDER_MODES;
export const CAPABILITY_FALLBACK_POLICIES = Object.freeze(["NONE", "SIMULATED_STAND_IN", "OMIT"] as const);
export const CAPABILITY_DEGRADATION_POLICIES = Object.freeze(["BLOCK", "DEGRADE"] as const);

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

// Partner categories (schemaVersion 2). Partners are existing organizations; no partner database is created.
export const PARTNER_ROLES = Object.freeze([
  "EMPLOYER", "TRAINING_PROVIDER", "COLLEGE", "K12", "WORKFORCE_BOARD", "APPRENTICESHIP", "UNION_TRADE_ORGANIZATION",
  "PUBLIC_AGENCY", "COMMUNITY_ORGANIZATION", "MENTOR", "FUNDING_PARTNER", "CREDENTIAL_AUTHORITY", "FACILITY_PARTNER",
] as const);
// A declared partner is a design intent. CONFIRMED needs a relationshipRef to an existing ACTIVE service agreement or
// organization relationship between the owning organization and the partner. Neither implies employment.
export const PARTNER_STATUSES = Object.freeze(["DECLARED", "CONFIRMED", "ENDED"] as const);
export const PARTNER_RELATIONSHIP_KINDS = Object.freeze(["SERVICE_AGREEMENT", "ORGANIZATION_RELATIONSHIP"] as const);

export const FUNDING_SOURCE_TYPES = Object.freeze([
  "GRANT", "WORKFORCE", "EMPLOYER", "APPRENTICESHIP", "PHILANTHROPY", "SPONSORSHIP", "INSTITUTIONAL_PURCHASE", "COMMERCIAL",
] as const);
// Alignment is not eligibility. VERIFIED only points at an existing award/assurance record owned elsewhere.
export const FUNDING_ALIGNMENT_STATUSES = Object.freeze(["UNKNOWN", "POTENTIAL", "VERIFIED"] as const);
export const FUNDING_VERIFICATION_SOURCES = Object.freeze(["FUNDING_GRANT", "GPA_FUNDING_REFERENCE"] as const);
export const FUNDING_BUCKETS = Object.freeze(["SHARED_INFRASTRUCTURE", "DESTINATION_PROGRAM", "CROSS_DESTINATION_MISSION"] as const);

// Requirements only; ProgramPackage never creates Evidence. INDIVIDUAL_DEMONSTRATION covers individual behavior and
// TEAM_PERFORMANCE_CONTEXT covers team behavior (never individual evidence by itself).
export const EVIDENCE_REQUIREMENT_TYPES = Object.freeze([
  "INDIVIDUAL_DEMONSTRATION", "TEAM_PERFORMANCE_CONTEXT", "SUPERVISOR_VERIFICATION", "EXTERNAL_CREDENTIAL_VERIFICATION",
  "PERFORMANCE_EVENT", "ASSESSMENT_RESULT", "REFLECTION", "INSTRUCTOR_VERIFICATION",
] as const);

// Platform support a program requires. Never learner accommodation data: learner preferences live elsewhere.
export const ACCESSIBILITY_SUPPORT_REQUIREMENTS = Object.freeze([
  "KEYBOARD", "REDUCED_MOTION", "REDUCED_SENSORY", "NO_AUDIO", "CAPTIONS", "SCREEN_READER", "NO_FLASHING", "HAPTICS_OFF", "VISUAL_ALERTS",
] as const);

// Governance references: a repository governance document, or a service entitlement the owning organization needs.
export const GOVERNANCE_REF_TYPES = Object.freeze(["DOCUMENT", "SERVICE_ENTITLEMENT"] as const);

export const REPORTING_METRICS = Object.freeze([
  "ENROLLMENT", "PARTICIPATION", "COMPLETION", "DEMONSTRATION", "EVIDENCE", "CAREER_CONNECTION", "CREDENTIAL_PROGRESSION", "EMPLOYMENT_OUTCOME",
] as const);
// An operational metric is observation; only the Truth Spine turns a fact into verified institutional truth.
export const REPORTING_KINDS = Object.freeze(["OPERATIONAL_METRIC", "VERIFIED_INSTITUTIONAL_TRUTH"] as const);

export const READINESS_ANSWERS = Object.freeze(["ANSWERED", "NOT_APPLICABLE", "GAP"] as const);

export interface CapabilityDeclaration {
  capability: WorkforceCapability;
  required: boolean;
  // Current declared maturity; never above the providing systems' own maturity.
  maturity: string;
  // Phase 8 capability requirement contract.
  minimumMaturity: string;
  providerAuthority: string;
  allowedProviderModes: string[];
  fallbackPolicy: (typeof CAPABILITY_FALLBACK_POLICIES)[number];
  degradationPolicy: (typeof CAPABILITY_DEGRADATION_POLICIES)[number];
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
  schemaVersion: number;
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
    // Declared target execution level; the evaluated level comes from MOL provider modes.
    executionLevel: ExecutionLevel;
  };
  // A course is referenced by its org-scoped id, or (Phase 7) by its deterministic import stable key, which is
  // the only identity that is the same in every organization that imports the canonical curriculum.
  curriculumRefs: Array<{ courseId: string } | { courseStableKey: string }>;
  arcadeExperienceRefs: Array<{ experienceId: string }>;
  // Exact version only; optional role and world-capability requirements are checked against the published definition.
  missionRefs: Array<{ missionId: string; missionVersion: number; roleRequirements?: string[]; worldCapabilities?: string[] }>;
  metaverseRefs: Array<{ molSystemId: string }>;
  destinationRefs: Array<{ destinationId: string }>;
  careerRefs: Array<{ careerId: string }>;
  competencyRefs: Array<{ competencyId: string }>;
  capabilityRefs: CapabilityDeclaration[];
  evidenceRequirements: Array<{ requirementType: (typeof EVIDENCE_REQUIREMENT_TYPES)[number]; competencyId: string | null }>;
  authorityRefs: AuthorityDeclaration[];
  credentialAuthorityRefs: Array<{ authorityType: (typeof EXTERNAL_AUTHORITY_TYPES)[number]; name: string; status: (typeof EXTERNAL_AUTHORITY_STATUSES)[number]; credentialDefinitionId: string | null }>;
  fundingRefs: FundingRelationship[];
  accessibilityRequirements: Array<(typeof ACCESSIBILITY_SUPPORT_REQUIREMENTS)[number]>;
  partnerRefs: Array<{ organizationId: string; role: (typeof PARTNER_ROLES)[number]; status: (typeof PARTNER_STATUSES)[number];
    relationshipRef: { kind: (typeof PARTNER_RELATIONSHIP_KINDS)[number]; id: string } | null }>;
  reportingRequirements: Array<{ metric: (typeof REPORTING_METRICS)[number]; kind: (typeof REPORTING_KINDS)[number]; reportProfileKey: string | null }>;
  dependencyRefs: DependencyDeclaration[];
  integrationReadiness: Partial<Record<IntegrationReadinessQuestion, ReadinessAnswer>>;
  // References to Experience Layer sensory profiles (src/shared/experience/sensory). Optional; owned there.
  sensoryRefs?: SensoryRefs;
  governanceRefs: Array<{ refType: (typeof GOVERNANCE_REF_TYPES)[number]; ref: string }>;
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

function refList(errors: string[], value: unknown, path: string, check: (item: any, at: string) => void, key?: (item: any) => string) {
  if (!Array.isArray(value)) return void errors.push(`${path} must be an array`);
  if (value.length > PROGRAM_PACKAGE_LIMITS.refs) errors.push(`${path} exceeds ${PROGRAM_PACKAGE_LIMITS.refs} references`);
  const seen = new Set<string>();
  value.forEach((item, index) => {
    if (!isRecord(item)) return void errors.push(`${path}[${index}] must be an object`);
    check(item, `${path}[${index}]`);
    if (key) {
      const identity = key(item);
      if (seen.has(identity)) errors.push(`${path}[${index}] is a duplicated reference`);
      seen.add(identity);
    }
  });
}

// Fail closed on embedded authority data anywhere in a package: a package references; it never carries learner
// identity, accommodation detail, Evidence/Truth, issuance, eligibility, awards, financial data, runtime or world
// state, lesson/Mission bodies, tokens or secrets.
const PROHIBITED_PAYLOAD_KEYS = /^(learner(id|userid)?|userid|user_id|studentid|accommodations?|accommodationtype|diagnosis|evidence|verifiedevidence|evidencerecords?|credentialissuance|issuedcredentials?|issuedat|eligibility|careereligibility|jobeligibility|employmenteligibility|awards?|awardamount|grantawards?|bankaccount|accountnumber|routingnumber|runtimestate|objectivestates|sessionstate|worldstate|liveworldstate|truthfacts?|truthrecords?|tokens?|accesstoken|apikey|secrets?|password|lessonbody|lessoncontent|content|body|fulldescription|definition|missiondefinition|objectives|stages|payload|score|masteryachieved)$/i;

export function findProhibitedPayloads(value: unknown, path = "package", found: string[] = [], depth = 0): string[] {
  if (depth > 8 || found.length >= 32) return found;
  if (Array.isArray(value)) value.forEach((item, index) => findProhibitedPayloads(item, `${path}[${index}]`, found, depth + 1));
  else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      // Readiness question keys (e.g. EVIDENCE) are a fixed vocabulary, not embedded payloads.
      const readinessQuestion = path === "package.integrationReadiness" && INTEGRATION_READINESS_QUESTIONS.includes(key as IntegrationReadinessQuestion);
      if (!readinessQuestion && PROHIBITED_PAYLOAD_KEYS.test(key)) found.push(`${path}.${key}: PROHIBITED_EMBEDDED_PAYLOAD`);
      findProhibitedPayloads(child, `${path}.${key}`, found, depth + 1);
    }
  }
  return found;
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
  // Unsupported schema versions fail closed before anything else is interpreted.
  if (!SUPPORTED_PROGRAM_SCHEMA_VERSIONS.includes(value.schemaVersion)) {
    return [`schemaVersion ${JSON.stringify(value.schemaVersion ?? null)} is unsupported (supported: ${SUPPORTED_PROGRAM_SCHEMA_VERSIONS.join(", ")})`];
  }
  errors.push(...findProhibitedPayloads(value));
  onlyKeys(value, ["schemaVersion", "program", "curriculumRefs", "arcadeExperienceRefs", "missionRefs", "metaverseRefs", "destinationRefs", "careerRefs", "competencyRefs",
    "capabilityRefs", "evidenceRequirements", "authorityRefs", "credentialAuthorityRefs", "fundingRefs", "accessibilityRequirements", "partnerRefs",
    "reportingRequirements", "dependencyRefs", "integrationReadiness", "sensoryRefs", "governanceRefs"], "package", errors);

  const program = value.program;
  if (!isRecord(program)) errors.push("program is required");
  else {
    onlyKeys(program, ["programId", "name", "lifecycle", "programType", "owningOrganizationId", "authorityOwner", "geography", "audience", "operationalProgramId", "executionLevel"], "program", errors);
    if (!EXECUTION_LEVELS.includes(program.executionLevel)) errors.push("program.executionLevel must be STANDALONE, HYBRID or LIVING_WORLD");
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
  }, (item) => `${item.courseId ?? ""}|${item.courseStableKey ?? ""}`);
  refList(errors, value.arcadeExperienceRefs, "arcadeExperienceRefs", (item, at) => { onlyKeys(item, ["experienceId"], at, errors); if (!ID.test(String(item.experienceId ?? ""))) errors.push(`${at}.experienceId is invalid`); }, (item) => item.experienceId);
  refList(errors, value.missionRefs, "missionRefs", (item, at) => {
    onlyKeys(item, ["missionId", "missionVersion", "roleRequirements", "worldCapabilities"], at, errors);
    if (!ID.test(String(item.missionId ?? ""))) errors.push(`${at}.missionId is invalid`);
    // Exact versions only: Programs never float on "latest".
    if (!Number.isInteger(item.missionVersion) || item.missionVersion < 1) errors.push(`${at}.missionVersion must be an exact positive integer`);
    if (item.roleRequirements !== undefined && !(Array.isArray(item.roleRequirements) && item.roleRequirements.length <= 8 && item.roleRequirements.every((role: unknown) => typeof role === "string" && /^[A-Z][A-Z0-9_]{1,47}$/.test(role)))) {
      errors.push(`${at}.roleRequirements must be up to 8 Mission role ids`);
    }
    if (item.worldCapabilities !== undefined && !(Array.isArray(item.worldCapabilities) && item.worldCapabilities.every((cap: string) => MISSION_WORLD_CAPABILITY_NAMES.includes(cap as any)))) {
      errors.push(`${at}.worldCapabilities must name Mission world capabilities`);
    }
  }, (item) => `${item.missionId}@${item.missionVersion}`);
  const molIds = workforceMolSystemIds();
  refList(errors, value.metaverseRefs, "metaverseRefs", (item, at) => {
    onlyKeys(item, ["molSystemId"], at, errors);
    if (!molIds.includes(item.molSystemId)) errors.push(`${at}.molSystemId must reference a MOL System Registry entry`);
  }, (item) => item.molSystemId);
  refList(errors, value.destinationRefs, "destinationRefs", (item, at) => {
    onlyKeys(item, ["destinationId"], at, errors);
    if (!isWorkforceDestinationId(String(item.destinationId ?? ""))) errors.push(`${at}.destinationId must reference a canonical Metaverse destination`);
  }, (item) => item.destinationId);
  refList(errors, value.careerRefs, "careerRefs", (item, at) => { onlyKeys(item, ["careerId"], at, errors); if (!ID.test(String(item.careerId ?? ""))) errors.push(`${at}.careerId is invalid`); }, (item) => item.careerId);
  refList(errors, value.competencyRefs, "competencyRefs", (item, at) => { onlyKeys(item, ["competencyId"], at, errors); if (!ID.test(String(item.competencyId ?? ""))) errors.push(`${at}.competencyId is invalid`); }, (item) => item.competencyId);

  if (!Array.isArray(value.capabilityRefs)) errors.push("capabilityRefs must be an array");
  else {
    if (value.capabilityRefs.length > PROGRAM_PACKAGE_LIMITS.capabilities) errors.push("capabilityRefs exceeds the capability vocabulary");
    const seen = new Set<string>();
    value.capabilityRefs.forEach((item: any, index: number) => {
      const at = `capabilityRefs[${index}]`;
      if (!isRecord(item)) return void errors.push(`${at} must be an object`);
      onlyKeys(item, ["capability", "required", "maturity", "minimumMaturity", "providerAuthority", "allowedProviderModes", "fallbackPolicy", "degradationPolicy",
        "acceptanceRef", "molSystemIds", "fundingBucket"], at, errors);
      if (!CAPABILITY_MATURITY.includes(item.minimumMaturity)) errors.push(`${at}.minimumMaturity must be one of ${CAPABILITY_MATURITY.join(", ")}`);
      if (item.capability in WORKFORCE_CAPABILITIES && item.providerAuthority !== WORKFORCE_CAPABILITIES[item.capability as WorkforceCapability]) {
        errors.push(`${at}.providerAuthority must be the registered authority ${WORKFORCE_CAPABILITIES[item.capability as WorkforceCapability]}`);
      }
      if (!Array.isArray(item.allowedProviderModes) || !item.allowedProviderModes.length || !item.allowedProviderModes.every((mode: string) => PROVIDER_MODES.includes(mode) && mode !== "UNAVAILABLE")) {
        errors.push(`${at}.allowedProviderModes must list provider modes (UNAVAILABLE is never an allowed supply)`);
      }
      if (!CAPABILITY_FALLBACK_POLICIES.includes(item.fallbackPolicy)) errors.push(`${at}.fallbackPolicy is invalid`);
      if (!CAPABILITY_DEGRADATION_POLICIES.includes(item.degradationPolicy)) errors.push(`${at}.degradationPolicy is invalid`);
      if (item.fallbackPolicy === "SIMULATED_STAND_IN" && Array.isArray(item.allowedProviderModes) && !item.allowedProviderModes.includes("SIMULATED")) {
        errors.push(`${at}: a SIMULATED_STAND_IN fallback requires SIMULATED among allowedProviderModes`);
      }
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
  }, (item) => `${item.requirementType}|${item.competencyId}`);

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
    // CONFIRMED is checked against the credential authority itself at resolution; it needs a definition to point to.
    if (item.status === "CONFIRMED" && item.credentialDefinitionId === null) errors.push(`${at}: CONFIRMED requires a credentialDefinitionId`);
  }, (item) => `${item.authorityType}|${item.name}|${item.credentialDefinitionId}`);

  if (Array.isArray(value.fundingRefs) && new Set(value.fundingRefs.map((item: any) => item?.fundingSourceId)).size !== value.fundingRefs.length) errors.push("fundingRefs contains a duplicated funding source");
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

  if (!Array.isArray(value.accessibilityRequirements) || !value.accessibilityRequirements.every((item: any) => ACCESSIBILITY_SUPPORT_REQUIREMENTS.includes(item))) {
    errors.push(`accessibilityRequirements must use the platform support vocabulary (${ACCESSIBILITY_SUPPORT_REQUIREMENTS.join(", ")})`);
  } else if (new Set(value.accessibilityRequirements).size !== value.accessibilityRequirements.length) errors.push("accessibilityRequirements contains a duplicated requirement");
  refList(errors, value.partnerRefs, "partnerRefs", (item, at) => {
    onlyKeys(item, ["organizationId", "role", "status", "relationshipRef"], at, errors);
    if (!ID.test(String(item.organizationId ?? ""))) errors.push(`${at}.organizationId is invalid`);
    if (!PARTNER_ROLES.includes(item.role)) errors.push(`${at}.role is invalid`);
    if (!PARTNER_STATUSES.includes(item.status)) errors.push(`${at}.status is invalid`);
    const ref = item.relationshipRef;
    if (ref !== null && !(isRecord(ref) && PARTNER_RELATIONSHIP_KINDS.includes(ref.kind) && ID.test(String(ref.id ?? "")) && Object.keys(ref).every((key) => ["kind", "id"].includes(key)))) {
      errors.push(`${at}.relationshipRef must be null or {kind: SERVICE_AGREEMENT|ORGANIZATION_RELATIONSHIP, id}`);
    }
    if (item.status === "CONFIRMED" && ref === null) errors.push(`${at}: CONFIRMED requires a relationshipRef to an existing agreement or relationship`);
  }, (item) => `${item.organizationId}|${item.role}`);
  refList(errors, value.reportingRequirements, "reportingRequirements", (item, at) => {
    onlyKeys(item, ["metric", "kind", "reportProfileKey"], at, errors);
    if (!REPORTING_METRICS.includes(item.metric)) errors.push(`${at}.metric is invalid`);
    if (!REPORTING_KINDS.includes(item.kind)) errors.push(`${at}.kind is invalid`);
    if (!(item.reportProfileKey === null || text(item.reportProfileKey, 160))) errors.push(`${at}.reportProfileKey must be text or null`);
  }, (item) => `${item.metric}|${item.kind}`);
  refList(errors, value.governanceRefs, "governanceRefs", (item, at) => {
    onlyKeys(item, ["refType", "ref"], at, errors);
    if (!GOVERNANCE_REF_TYPES.includes(item.refType)) errors.push(`${at}.refType is invalid`);
    else if (item.refType === "DOCUMENT" && !(typeof item.ref === "string" && /^docs\/[A-Za-z0-9._/-]+\.md$/.test(item.ref) && !item.ref.includes(".."))) errors.push(`${at}.ref must be a repository docs/*.md path`);
    else if (item.refType === "SERVICE_ENTITLEMENT" && !ID.test(String(item.ref ?? ""))) errors.push(`${at}.ref must be a service key`);
  }, (item) => `${item.refType}|${item.ref}`);

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

// Structured validation result. Every error carries a stable code, the path it applies to and the message.
export type ProgramValidationErrorCode = "UNSUPPORTED_SCHEMA_VERSION" | "PROHIBITED_EMBEDDED_PAYLOAD" | "UNSUPPORTED_FIELD" | "DUPLICATE_REFERENCE"
  | "BOUNDS_EXCEEDED" | "REQUIRED" | "INVALID_VALUE";

function classify(message: string): ProgramValidationErrorCode {
  if (/^schemaVersion /.test(message)) return "UNSUPPORTED_SCHEMA_VERSION";
  if (/PROHIBITED_EMBEDDED_PAYLOAD/.test(message)) return "PROHIBITED_EMBEDDED_PAYLOAD";
  if (/unsupported field/.test(message)) return "UNSUPPORTED_FIELD";
  if (/duplicated/.test(message)) return "DUPLICATE_REFERENCE";
  if (/exceeds/.test(message)) return "BOUNDS_EXCEEDED";
  if (/is required|must declare|requires /.test(message)) return "REQUIRED";
  return "INVALID_VALUE";
}

export function validateProgramPackageStructured(value: unknown) {
  const errors = validateProgramPackage(value).map((message) => ({ code: classify(message), path: message.split(/[ :]/)[0], message }));
  return { valid: errors.length === 0, errors };
}
