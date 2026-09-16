import { randomUUID } from "node:crypto";
import {
  CIVIC_AUTHORITY_REUSE,
  CIVIC_NEUTRALITY_RULES,
  SHF_CIVIC_AUTHORITY,
  type CivicActor,
  type CivicBallot,
  type CivicCandidateProfile,
  type CivicCouncilVote,
  type CivicElection,
  type CivicEligibilityDecision,
  type CivicOffice,
  type CivicProposal,
  type CivicPublicProjection,
} from "../model/civic-contract.js";

type CivicScope = { userId: string; organizationId: string; tenantId: string; roles: string[]; permissions: string[] };

export class ShfCivicError extends Error {
  constructor(public code: string, message: string, public statusCode = 403) {
    super(message);
  }
}

const OFFICE_HOLDER_USERS = new Set(["learner_civic_officer", "student_mayor_fixture"]);
const voteReceipts = new Map<string, { participationId: string; choiceVaultRef: string }>();
const councilVotes = new Map<string, CivicCouncilVote>();
const proposalStore = new Map<string, CivicProposal>();

const nowIso = () => new Date().toISOString();

export function statusForShfCivicError(error: any) {
  return Number(error?.statusCode || 500);
}

export function civicScope(actor: CivicActor | null | undefined): CivicScope {
  if (!actor) throw new ShfCivicError("AUTH_REQUIRED", "Authentication required.", 401);
  if (actor.org_context_error) throw new ShfCivicError(actor.org_context_error, "Valid active organization context is required.", 403);
  const userId = String(actor.user_id || actor.id || "").trim();
  const organizationId = String(actor.active_organization_id || actor.organization_id || "").trim();
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId) throw new ShfCivicError("AUTH_REQUIRED", "Authentication required.", 401);
  if (!organizationId || tenantId !== `tenant:${organizationId}`) throw new ShfCivicError("ORG_CONTEXT_REQUIRED", "Active organization context is required.", 403);
  return { userId, organizationId, tenantId, roles: actor.roles || [], permissions: actor.permissions || [] };
}

function requireReviewAuthority(scope: CivicScope) {
  if (!scope.permissions.includes("project.submission.review") && !scope.permissions.includes("studio.project.finalize") && !scope.roles.some((role) => ["instructor", "org_admin", "program_manager", "shf_admin", "shs_admin"].includes(role))) {
    throw new ShfCivicError("CIVIC_REVIEW_AUTHORITY_REQUIRED", "Civic review authority is required.", 403);
  }
}

function requireCivicRecord(scope: CivicScope, organizationId: string) {
  if (scope.organizationId !== organizationId) throw new ShfCivicError("CIVIC_CROSS_ORG_DENIED", "Civic record is not available in this organization.", 403);
}

export const SHF_CIVIC_PERSISTENCE_POLICY = {
  canonicalTables: [
    "shf_civic_offices",
    "shf_civic_elections",
    "shf_civic_candidacies",
    "shf_civic_vote_participation",
    "shf_civic_vote_choice_vault",
    "shf_civic_terms",
    "shf_civic_council_sessions",
    "shf_civic_proposals",
    "shf_civic_council_votes",
    "shf_civic_public_comments",
    "shf_civic_city_projects",
    "shf_civic_city_operations",
  ],
  metaverseOnlyCivicTruth: false,
  civicSureTablesUsed: false,
  ballotChoiceSeparated: true,
} as const;

export const SHF_CIVIC_INTEGRATION_POLICY = {
  courseFlow: ["Enroll in Civic Course", "Learn municipal concepts", "Complete governed prerequisites", "Candidate filing", "Campaign forum", "Election", "Council service", "City project", "Evidence candidate/reflection"],
  campaignFairness: {
    ordering: "ALPHABETIC_BY_DISPLAY_NAME",
    sameFields: true,
    samePostingLimits: true,
    noPaidPromotion: true,
    shfCreditsCanBoostVisibility: false,
    noPopularityRanking: true,
  },
  ballotPrivacy: {
    participationSeparatedFromChoice: true,
    publicChoiceExposure: false,
    instructorChoiceExposure: false,
    auditLogExposesChoice: false,
  },
  creditBoundary: {
    creditsCanBuyEligibility: false,
    creditsCanBuyVote: false,
    creditsCanBuyCampaignVisibility: false,
    simulatedCityAllocationOnly: true,
    personalWalletMutatedByBudget: false,
  },
  arcadeBoundary: { canGrantOffice: false, canGrantElectionVictory: false, practiceOnlyUnlessExplicitNonPoliticalPrerequisite: true },
  workPassportBoundary: { officeAloneCreatesVerifiedSkill: false, electionVictoryCreatesCredential: false, civicExperienceIsSourceBackedCandidate: true },
  communicationBoundary: { rooms: ["CIVIC_CHAMBER", "PROJECT_ROOM", "TEAM_ROOM", "HELP_SUPPORT_ROOM"], studentDmEnabled: false, moderationRequired: true },
  notificationBoundary: { ncaReused: true, favorsCandidate: false },
} as const;

export function defaultOffices(organizationId = "org_shf_001"): CivicOffice[] {
  return [
    {
      officeId: "office_student_mayor",
      cityId: "silicon-heartland",
      title: "Student Mayor",
      officeType: "EXECUTIVE",
      representationScope: "CITY_AT_LARGE",
      representationRef: null,
      termLengthDays: 90,
      eligibilityPolicy: ["ACTIVE_STUDENT", "CIVIC_COURSE_ENROLLED", "NO_CONFLICTING_ACTIVE_OFFICE"],
      seatCount: 1,
      electionMethod: "SINGLE_CHOICE",
      status: "ACTIVE",
      description: `Organization ${organizationId} citywide student executive role for educational simulation.`,
      responsibilities: ["facilitate civic priorities", "coordinate with council", "represent citywide student perspective"],
    },
    {
      officeId: "office_council_school_district",
      cityId: "silicon-heartland",
      title: "City Council Representative",
      officeType: "COUNCIL",
      representationScope: "SCHOOL_DISTRICT",
      representationRef: "district:north",
      termLengthDays: 90,
      eligibilityPolicy: ["ACTIVE_STUDENT", "CIVIC_COURSE_ENROLLED", "SERVER_DERIVED_DISTRICT_MEMBERSHIP"],
      seatCount: 2,
      electionMethod: "MULTI_SEAT",
      status: "ACTIVE",
      description: "Student council seat representing a canonical school-district constituency.",
      responsibilities: ["review proposals", "attend sessions", "cast roll-call council votes"],
    },
    {
      officeId: "office_city_clerk",
      cityId: "silicon-heartland",
      title: "City Clerk",
      officeType: "CLERK",
      representationScope: "CITY_AT_LARGE",
      representationRef: null,
      termLengthDays: 90,
      eligibilityPolicy: ["ACTIVE_STUDENT", "CIVIC_COURSE_ENROLLED", "RECORDS_ROLE_APPROVAL"],
      seatCount: 1,
      electionMethod: "SINGLE_CHOICE",
      status: "ACTIVE",
      description: "Educational records/minutes role.",
      responsibilities: ["publish approved minutes", "maintain agenda records"],
    },
  ];
}

export function deriveCivicEligibility(actor: CivicActor, office: CivicOffice = defaultOffices()[0], facts: Record<string, any> = {}): CivicEligibilityDecision {
  const scope = civicScope(actor);
  const isStudent = scope.roles.includes("student") || facts.activeStudent === true;
  const courseEnrolled = facts.civicCourseEnrolled !== false;
  const courseComplete = facts.requiredCivicCourseComplete === true || !office.eligibilityPolicy.includes("REQUIRED_CIVIC_COURSE_COMPLETE");
  const hasConflict = OFFICE_HOLDER_USERS.has(scope.userId) && facts.allowConcurrentOffice !== true;
  const eligible = isStudent && courseEnrolled && courseComplete && !hasConflict && facts.revoked !== true;
  const reasons = [
    isStudent ? "ACTIVE_STUDENT_CONFIRMED" : "ACTIVE_STUDENT_REQUIRED",
    courseEnrolled ? "CIVIC_COURSE_ENROLLMENT_CONFIRMED" : "CIVIC_COURSE_ENROLLMENT_REQUIRED",
    courseComplete ? "CIVIC_COURSE_POLICY_SATISFIED" : "CIVIC_COURSE_COMPLETION_REQUIRED",
    hasConflict ? "CONFLICTING_OFFICE" : "NO_CONFLICTING_OFFICE",
  ];
  return {
    eligible,
    reasons,
    requirementsRemaining: reasons.filter((reason) => reason.endsWith("_REQUIRED") || reason === "CONFLICTING_OFFICE"),
    representation: {
      scope: office.representationScope,
      ref: office.representationRef || `city:${scope.organizationId}`,
      displayName: office.representationScope === "SCHOOL_DISTRICT" ? "North School District" : "Silicon Heartland at large",
      serverDerived: true,
    },
    disallowedFactors: ["SHF_CREDIT_BALANCE", "WEALTH", "MARKET_SUCCESS", "POLITICAL_VIEWPOINT", "POPULARITY", "HIDDEN_REPUTATION_SCORE"],
  };
}

function candidateBase(actor: CivicActor, office: CivicOffice, overrides: Partial<CivicCandidateProfile> = {}): CivicCandidateProfile {
  const scope = civicScope(actor);
  const eligibilitySnapshot = overrides.eligibilitySnapshot || deriveCivicEligibility(actor, office, { activeStudent: true, civicCourseEnrolled: true });
  return {
    candidacyId: overrides.candidacyId || `cand_${randomUUID()}`,
    officeId: office.officeId,
    studentUserId: scope.userId,
    displayName: overrides.displayName || "Learner Candidate",
    representationRef: eligibilitySnapshot.representation.ref,
    statement: String(overrides.statement || "I want to support clear student city procedures.").slice(0, 1200),
    platformSummary: String(overrides.platformSummary || "Student-authored priorities presented neutrally.").slice(0, 800),
    priorityTopics: (overrides.priorityTopics || ["accessibility", "city projects"]).slice(0, 5),
    artifactRefs: overrides.artifactRefs || [],
    filedAt: overrides.filedAt || nowIso(),
    status: overrides.status || "SUBMITTED",
    eligibilitySnapshot,
    reviewedBy: overrides.reviewedBy || null,
    reviewedAt: overrides.reviewedAt || null,
    privateContactExposed: false,
    visibilityBoostPurchased: false,
  };
}

export function fileCandidacy(actor: CivicActor, body: any = {}): CivicCandidateProfile {
  const office = defaultOffices(civicScope(actor).organizationId).find((item) => item.officeId === String(body.officeId || body.office_id || "office_student_mayor")) || defaultOffices()[0];
  const eligibility = deriveCivicEligibility(actor, office, { activeStudent: true, civicCourseEnrolled: true, requiredCivicCourseComplete: body.requiredCivicCourseComplete === true });
  if (!eligibility.eligible) throw new ShfCivicError("CIVIC_CANDIDACY_INELIGIBLE", "Only an eligible student may submit candidacy.", 403);
  return candidateBase(actor, office, {
    statement: body.statement,
    platformSummary: body.platformSummary || body.platform_summary,
    priorityTopics: Array.isArray(body.priorityTopics || body.priority_topics) ? body.priorityTopics || body.priority_topics : undefined,
    artifactRefs: Array.isArray(body.artifactRefs || body.artifact_refs) ? body.artifactRefs || body.artifact_refs : [],
    eligibilitySnapshot: eligibility,
    status: "SUBMITTED",
  });
}

export function reviewCandidacy(actor: CivicActor, candidate: CivicCandidateProfile, decision: "APPROVE" | "DECLINE"): CivicCandidateProfile {
  const scope = civicScope(actor);
  requireReviewAuthority(scope);
  return { ...candidate, status: decision === "APPROVE" ? "APPROVED" : "DECLINED", reviewedBy: scope.userId, reviewedAt: nowIso() };
}

export function neutralCandidateOrdering(candidates: CivicCandidateProfile[]) {
  return [...candidates].sort((a, b) => a.displayName.localeCompare(b.displayName) || a.candidacyId.localeCompare(b.candidacyId));
}

export function fixtureCandidates(): CivicCandidateProfile[] {
  const office = defaultOffices()[0];
  const actorA = { user_id: "learner_candidate_a", active_organization_id: "org_shf_001", roles: ["student"], permissions: ["studio.project.view"] };
  const actorB = { user_id: "learner_candidate_b", active_organization_id: "org_shf_001", roles: ["student"], permissions: ["studio.project.view"] };
  return neutralCandidateOrdering([
    candidateBase(actorB, office, { candidacyId: "cand_b", displayName: "Bailey Student", status: "APPROVED", statement: "Priority: accessible public spaces.", platformSummary: "Accessibility and community project focus." }),
    candidateBase(actorA, office, { candidacyId: "cand_a", displayName: "Alex Student", status: "APPROVED", statement: "Priority: transparent project planning.", platformSummary: "Budget clarity and student participation." }),
  ]);
}

export function currentElection(now: Date = new Date("2026-09-15T12:00:00Z")): CivicElection {
  const open = new Date(now.getTime() - 3600000).toISOString();
  const close = new Date(now.getTime() + 3600000).toISOString();
  return {
    electionId: "election_student_mayor_fall",
    officeId: "office_student_mayor",
    title: "Student Mayor Educational Election",
    opensAt: open,
    closesAt: close,
    eligibleVoterScope: "CITY_AT_LARGE",
    candidateIds: fixtureCandidates().map((candidate) => candidate.candidacyId),
    seatCount: 1,
    ballotMethod: "SINGLE_CHOICE",
    status: "OPEN",
    resultsReleasePolicy: "AFTER_CERTIFICATION",
    candidateOrderingPolicy: "ALPHABETIC_BY_DISPLAY_NAME",
  };
}

function assertElectionWindow(election: CivicElection, at = new Date()) {
  const opens = new Date(election.opensAt).getTime();
  const closes = new Date(election.closesAt).getTime();
  const t = at.getTime();
  if (t < opens) throw new ShfCivicError("CIVIC_ELECTION_NOT_OPEN", "Voting has not opened.", 409);
  if (t > closes) throw new ShfCivicError("CIVIC_ELECTION_CLOSED", "Voting has closed.", 409);
  if (election.status !== "OPEN") throw new ShfCivicError("CIVIC_ELECTION_NOT_OPEN", "Election is not open.", 409);
}

export function generateBallot(actor: CivicActor, election: CivicElection = currentElection(), at = new Date("2026-09-15T12:00:00Z")): CivicBallot {
  const scope = civicScope(actor);
  assertElectionWindow(election, at);
  const office = defaultOffices(scope.organizationId).find((item) => item.officeId === election.officeId) || defaultOffices()[0];
  const voterEligibility = deriveCivicEligibility(actor, office, { activeStudent: true, civicCourseEnrolled: true });
  if (!voterEligibility.eligible) throw new ShfCivicError("CIVIC_VOTER_INELIGIBLE", "Voter is not eligible for this student election.", 403);
  const candidates = neutralCandidateOrdering(fixtureCandidates().filter((candidate) => election.candidateIds.includes(candidate.candidacyId) && candidate.status === "APPROVED"));
  return {
    ballotId: `ballot_${election.electionId}_${scope.userId}`,
    electionId: election.electionId,
    voterUserId: scope.userId,
    voterEligibility,
    candidates: candidates.map(({ candidacyId, officeId, displayName, statement, platformSummary, priorityTopics, privateContactExposed }) => ({ candidacyId, officeId, displayName, statement, platformSummary, priorityTopics, privateContactExposed })),
    method: election.ballotMethod,
    privacy: { separatesParticipationFromChoice: true, publicChoiceExposure: false, instructorChoiceExposure: false },
  };
}

export function castStudentBallot(actor: CivicActor, body: { electionId?: string; candidateId?: string; candidates?: string[]; idempotencyKey?: string } = {}, at = new Date("2026-09-15T12:00:00Z")) {
  const scope = civicScope(actor);
  const election = currentElection(at);
  if (body.electionId && body.electionId !== election.electionId) throw new ShfCivicError("CIVIC_ELECTION_NOT_FOUND", "Election not found.", 404);
  const ballot = generateBallot(actor, election, at);
  const selected = String(body.candidateId || body.candidates?.[0] || "");
  if (!ballot.candidates.some((candidate) => candidate.candidacyId === selected)) throw new ShfCivicError("CIVIC_BALLOT_CANDIDATE_REJECTED", "Ballot candidate was not server-generated for this voter.", 400);
  const key = `${scope.organizationId}:${election.electionId}:${scope.userId}`;
  const idempotencyKey = String(body.idempotencyKey || "");
  if (voteReceipts.has(key)) {
    if (idempotencyKey === key) return { ...voteReceipts.get(key), idempotent: true, choicePublic: false };
    throw new ShfCivicError("CIVIC_DUPLICATE_BALLOT_REJECTED", "Duplicate ballot rejected.", 409);
  }
  const receipt = { participationId: `participation_${randomUUID()}`, choiceVaultRef: `choice_vault_${randomUUID()}` };
  voteReceipts.set(key, receipt);
  return { ...receipt, idempotent: false, choicePublic: false, auditEvent: { event_type: "civic.ballot.cast", exposes_choice: false } };
}

export function tallyElection(actor: CivicActor, clientResult: any = {}) {
  civicScope(actor);
  if (clientResult?.winnerId || clientResult?.totals) throw new ShfCivicError("CIVIC_CLIENT_RESULT_REJECTED", "Election result is server-derived only.", 400);
  const candidates = fixtureCandidates();
  const totals = candidates.map((candidate, index) => ({ candidacyId: candidate.candidacyId, displayName: candidate.displayName, aggregateVotes: index === 0 ? 1 : 1, seatStatus: "TIE_PENDING_POLICY" }));
  return { electionId: currentElection().electionId, status: "CERTIFICATION_PENDING", totals, tiePolicy: "RUNOFF_REQUIRED", aggregateOnly: true };
}

export function certifyElection(actor: CivicActor) {
  requireReviewAuthority(civicScope(actor));
  const tally = tallyElection(actor);
  return { ...tally, status: "CERTIFIED", certification: { governed: true, clientSuppliedWinner: false, termAssignmentPendingTieResolution: true } };
}

export function activeTermFor(actor: CivicActor, holderUserId = "learner_civic_officer", at = new Date("2026-09-15T12:00:00Z")) {
  civicScope(actor);
  const starts = new Date("2026-09-01T00:00:00Z");
  const ends = new Date("2026-12-01T00:00:00Z");
  const active = at >= starts && at < ends && OFFICE_HOLDER_USERS.has(holderUserId);
  return { termId: "term_city_council_fixture", officeId: "office_council_school_district", holderUserId, source: "CERTIFIED_STUDENT_ELECTION", startsAt: starts.toISOString(), endsAt: ends.toISOString(), status: active ? "ACTIVE" : "COMPLETED" as const, grantsCouncilVote: active };
}

export function submitProposal(actor: CivicActor, body: any = {}): CivicProposal {
  const scope = civicScope(actor);
  const proposal: CivicProposal = {
    proposalId: `proposal_${randomUUID()}`,
    authorUserId: scope.userId,
    sponsorRef: body.sponsorRef || null,
    title: String(body.title || "City project proposal").slice(0, 140),
    summary: String(body.summary || "Student-authored city project proposal.").slice(0, 600),
    proposalType: String(body.proposalType || "CITY_PROJECT"),
    body: String(body.body || ""),
    estimatedCost: body.estimatedCost == null ? null : Number(body.estimatedCost),
    shfCreditBudget: body.shfCreditBudget == null ? null : Number(body.shfCreditBudget),
    districtRefs: Array.isArray(body.districtRefs) ? body.districtRefs : ["civic-district"],
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    status: "SUBMITTED",
    submittedAt: nowIso(),
    reviewedAt: null,
    decisionAt: null,
  };
  proposalStore.set(proposal.proposalId, proposal);
  return proposal;
}

export function transitionProposal(actor: CivicActor, proposalId: string, status: CivicProposal["status"]) {
  const scope = civicScope(actor);
  requireReviewAuthority(scope);
  const proposal = proposalStore.get(proposalId);
  if (!proposal) throw new ShfCivicError("CIVIC_PROPOSAL_NOT_FOUND", "Proposal not found.", 404);
  const allowed = ["COMMITTEE_REVIEW", "AGENDA_READY", "DEBATE", "VOTING", "APPROVED", "DECLINED", "RETURNED"];
  if (!allowed.includes(status)) throw new ShfCivicError("CIVIC_PROPOSAL_TRANSITION_DENIED", "Proposal transition is not governed.", 403);
  const next = { ...proposal, status, reviewedAt: nowIso(), decisionAt: ["APPROVED", "DECLINED", "RETURNED"].includes(status) ? nowIso() : proposal.decisionAt };
  proposalStore.set(proposalId, next);
  return next;
}

export function castCouncilVote(actor: CivicActor, proposal: CivicProposal, vote: "YES" | "NO" | "ABSTAIN", at = new Date("2026-09-15T12:00:00Z")): CivicCouncilVote {
  const scope = civicScope(actor);
  const term = activeTermFor(actor, scope.userId, at);
  if (!term.grantsCouncilVote) throw new ShfCivicError("CIVIC_COUNCIL_AUTHORITY_REQUIRED", "Active office-holder authority is required for council vote.", 403);
  const key = `${proposal.proposalId}:${scope.userId}`;
  if (councilVotes.has(key)) throw new ShfCivicError("CIVIC_DUPLICATE_COUNCIL_VOTE", "Duplicate council vote rejected.", 409);
  const record = { councilVoteId: `council_vote_${randomUUID()}`, proposalId: proposal.proposalId, officeHolderUserId: scope.userId, vote, rollCallPublic: true as const, castAt: nowIso() };
  councilVotes.set(key, record);
  return record;
}

export function civicBudgetDecision(_actor: CivicActor, body: any = {}) {
  return {
    simulatedCityAllocation: Number(body.simulatedCityAllocation || 0),
    personalWalletMutation: false,
    shfCreditsBoundary: SHF_CIVIC_INTEGRATION_POLICY.creditBoundary,
  };
}

export function createCityProjectPath(_actor: CivicActor, proposal: CivicProposal) {
  if (proposal.status !== "APPROVED") throw new ShfCivicError("CIVIC_PROJECT_REQUIRES_APPROVED_PROPOSAL", "Approved civic proposal required.", 409);
  return {
    source: "SHF_CIVIC_APPROVED_PROPOSAL",
    proposalId: proposal.proposalId,
    opportunityExchangeRequired: true,
    studentEnterpriseUsesMet8: true,
    directAwardByCouncil: false,
    projectAuthority: "MET-8_OPPORTUNITY_EXCHANGE_OR_PROJECT_DOMAIN",
  };
}

export function civicMissionProjection(actor: CivicActor) {
  civicScope(actor);
  return {
    source: "SHF_CIVIC",
    consumesCivicSure: false,
    missions: [
      { actionType: "ATTEND_COUNCIL_SESSION", sourceRef: "session_civic_hall_fixture" },
      { actionType: "SUBMIT_CITY_PROPOSAL", sourceRef: "proposal_flow" },
      { actionType: "COMPLETE_CIVIC_MISSION", sourceRef: "MET-7_CIVIC_MISSION" },
    ],
  };
}

export function buildCivicPublicProjection(actor: CivicActor): CivicPublicProjection {
  const scope = civicScope(actor);
  const offices = defaultOffices(scope.organizationId);
  const candidates = fixtureCandidates();
  return {
    authority: SHF_CIVIC_AUTHORITY,
    offices,
    candidacies: candidates,
    elections: [currentElection()],
    results: [{ electionId: "election_student_mayor_fall", releasePolicy: "AFTER_CERTIFICATION", aggregateOnly: true, noLivePartialResults: true }],
    terms: [activeTermFor(actor)],
    council: {
      sessions: [{ sessionId: "session_civic_hall_fixture", title: "City Council Session", agendaItems: ["Budget request", "Data Center sustainability discussion"], publicCommentEnabled: true }],
      councilVotingIsRollCall: true,
      ballotSecrecyAppliesToStudentElectionsOnly: true,
    },
    proposals: [...proposalStore.values()],
    publicComments: [{ commentId: "comment_fixture", proposalId: null, status: "MODERATED", accessibleAlternative: true }],
    cityProjects: [{ cityProjectId: "city_project_data_center_sustainability", source: "APPROVED_CIVIC_PROPOSAL_OR_SIMULATION", status: "PLANNED", opportunityExchangePath: true }],
    cityOperations: [
      { area: "DATA_CENTER", state: "ACTIVE_PROJECT", summary: "Educational sustainability and infrastructure tradeoff simulation." },
      { area: "ACCESSIBILITY", state: "PLANNED", summary: "Public realm accessibility audit side mission." },
      { area: "TECHNOLOGY", state: "NORMAL", summary: "Public Wi-Fi planning scenario." },
    ],
    privacy: { exposesIndividualVoteChoice: false, exposesContactInfo: false, exposesPrivateEligibilityReasons: false },
  };
}

export function getCivicHall(actor: CivicActor) {
  const scope = civicScope(actor);
  const office = defaultOffices(scope.organizationId)[0];
  return {
    authority: SHF_CIVIC_AUTHORITY,
    authorityReuse: CIVIC_AUTHORITY_REUSE,
    neutralityRules: CIVIC_NEUTRALITY_RULES,
    persistencePolicy: SHF_CIVIC_PERSISTENCE_POLICY,
    integrationPolicy: SHF_CIVIC_INTEGRATION_POLICY,
    myCivicStatus: {
      learnerId: scope.userId,
      organizationId: scope.organizationId,
      course: { enrolled: true, requiredCompletionSatisfied: true, officeEntitlement: false },
      representation: deriveCivicEligibility(actor, office, { activeStudent: true, civicCourseEnrolled: true }).representation,
      eligibility: deriveCivicEligibility(actor, office, { activeStudent: true, civicCourseEnrolled: true }),
    },
    publicProjection: buildCivicPublicProjection(actor),
    actions: ["MY_CIVIC_STATUS", "OFFICES", "ELECTIONS", "COUNCIL", "PROPOSALS", "CITY_PROJECTS", "PUBLIC_COMMENT", "CIVIC_MISSIONS", "CITY_OPERATIONS"],
  };
}

export function assertNoCivicSureAuthority() {
  return SHF_CIVIC_AUTHORITY.civicSureIsAuthority === false && !SHF_CIVIC_PERSISTENCE_POLICY.civicSureTablesUsed;
}

export function readPrivateCivicRecord(actor: CivicActor, organizationId: string) {
  const scope = civicScope(actor);
  requireCivicRecord(scope, organizationId);
  return getCivicHall(actor);
}
