import { createHash, randomUUID } from "node:crypto";
import { SHF_CIVIC_AUTHORITY, CIVIC_AUTHORITY_REUSE, CIVIC_NEUTRALITY_RULES, type CivicActor } from "../model/civic-contract.js";
import { civicScope, deriveCivicEligibility, ShfCivicError } from "./shf-civic-service.js";
import { ShfCivicRepository, shfCivicRepository } from "../repo/shf-civic-repo.js";

const now = () => new Date();
const hashChoice = (electionId: string, candidateId: string) => createHash("sha256").update(`${electionId}|${candidateId}`, "utf8").digest("hex");
const reviewRoles = ["instructor", "org_admin", "program_manager", "shf_admin", "shs_admin"];

function reviewAuthority(actor: CivicActor) {
  const scope = civicScope(actor);
  if (!scope.permissions.includes("project.submission.review") && !scope.permissions.includes("studio.project.finalize") && !scope.roles.some((role) => reviewRoles.includes(role))) throw new ShfCivicError("CIVIC_REVIEW_AUTHORITY_REQUIRED", "Civic review authority is required.", 403);
  return scope;
}
function mapNotFound(code: string, message: string): never { throw new ShfCivicError(code, message, 404); }
function assertStudent(actor: CivicActor) { const scope = civicScope(actor); if (!scope.roles.includes("student")) throw new ShfCivicError("CIVIC_STUDENT_REQUIRED", "An active student identity is required.", 403); return scope; }
function assertWindow(election: any, at = now()) { if (election.status !== "OPEN") throw new ShfCivicError("CIVIC_ELECTION_NOT_OPEN", "Election is not open.", 409); if (at < new Date(election.opensAt)) throw new ShfCivicError("CIVIC_ELECTION_NOT_OPEN", "Voting has not opened.", 409); if (at > new Date(election.closesAt)) throw new ShfCivicError("CIVIC_ELECTION_CLOSED", "Voting has closed.", 409); }

export class DurableShfCivicService {
  constructor(private readonly repo: ShfCivicRepository = shfCivicRepository) {}

  async hall(actor: CivicActor) {
    const scope = civicScope(actor);
    await this.repo.inTransaction(async (db) => this.repo.ensureDefaultOffices(scope, db));
    const offices = await this.repo.listOffices(scope);
    const office = offices[0];
    const eligibility = deriveCivicEligibility(actor, office, { civicCourseEnrolled: true });
    return { authority: SHF_CIVIC_AUTHORITY, authorityReuse: CIVIC_AUTHORITY_REUSE, neutralityRules: CIVIC_NEUTRALITY_RULES, myCivicStatus: { learnerId: scope.userId, organizationId: scope.organizationId, course: { enrolled: true, requiredCompletionSatisfied: true, officeEntitlement: false }, representation: eligibility.representation, eligibility }, offices, elections: await this.repo.listElections(scope), proposals: await this.repo.listProposals(scope), councilSessions: await this.repo.listSessions(scope), persistence: "POSTGRES_SHF_CIVIC_TABLES" };
  }

  async fileCandidacy(actor: CivicActor, body: any) {
    const scope = assertStudent(actor);
    return this.repo.inTransaction(async (db) => { await this.repo.ensureDefaultOffices(scope, db); const office = await this.repo.getOffice(scope, String(body.officeId || "office_student_mayor"), db); if (!office) return mapNotFound("CIVIC_OFFICE_NOT_FOUND", "Civic office was not found."); const eligibility = deriveCivicEligibility(actor, office, { civicCourseEnrolled: true }); if (!eligibility.eligible) throw new ShfCivicError("CIVIC_CANDIDACY_INELIGIBLE", "Only an eligible student may submit candidacy.", 403); return this.repo.insertCandidacy(scope, { candidacyId: `cand_${randomUUID()}`, officeId: office.officeId, representationRef: eligibility.representation.ref, statement: String(body.statement || "").slice(0, 1200), platformSummary: String(body.platformSummary || body.platform_summary || "").slice(0, 800), priorityTopics: Array.isArray(body.priorityTopics) ? body.priorityTopics.slice(0, 5) : [], artifactRefs: Array.isArray(body.artifactRefs) ? body.artifactRefs : [], eligibilitySnapshot: eligibility }, db); });
  }

  async reviewCandidacy(actor: CivicActor, id: string, decision: "APPROVE" | "DECLINE") {
    const scope = reviewAuthority(actor);
    const record = await this.repo.inTransaction((db) => this.repo.reviewCandidacy(scope, id, decision === "APPROVE" ? "APPROVED" : "DECLINED", db));
    if (!record) return mapNotFound("CIVIC_CANDIDACY_NOT_FOUND_OR_STALE", "Candidacy was not found or its lifecycle changed.");
    return record;
  }

  async createElection(actor: CivicActor, body: any) {
    const scope = reviewAuthority(actor);
    return this.repo.inTransaction(async (db) => { await this.repo.ensureDefaultOffices(scope, db); const office = await this.repo.getOffice(scope, String(body.officeId), db); if (!office) return mapNotFound("CIVIC_OFFICE_NOT_FOUND", "Civic office was not found."); const candidates = await this.repo.listApprovedCandidacies(scope, office.officeId, Array.isArray(body.candidateIds) ? body.candidateIds : null, db); if (!candidates.length) throw new ShfCivicError("CIVIC_CANDIDATES_REQUIRED", "An election requires approved candidates.", 409); return this.repo.createElection(scope, { electionId: `election_${randomUUID()}`, officeId: office.officeId, title: String(body.title || `${office.title} educational election`).slice(0, 180), opensAt: body.opensAt, closesAt: body.closesAt, eligibleVoterScope: office.representationScope, candidateIds: candidates.map((candidate) => candidate.candidacyId), seatCount: office.seatCount, ballotMethod: office.electionMethod, status: body.status || "SCHEDULED" }, db); });
  }

  async setElectionStatus(actor: CivicActor, electionId: string, status: string) {
    reviewAuthority(actor);
    const scope = civicScope(actor);
    const allowed: Record<string, string[]> = { OPEN: ["SCHEDULED", "DRAFT"], CLOSED: ["OPEN"], CERTIFICATION_PENDING: ["CLOSED"] };
    const current = await this.repo.getElection(scope, electionId);
    if (!current) return mapNotFound("CIVIC_ELECTION_NOT_FOUND", "Election was not found.");
    if (!allowed[status]?.includes(current.status)) throw new ShfCivicError("CIVIC_ELECTION_TRANSITION_DENIED", "Election lifecycle transition is stale or not governed.", 409);
    const next = await this.repo.updateElectionStatus(scope, electionId, status, current.status);
    if (!next) throw new ShfCivicError("CIVIC_ELECTION_TRANSITION_DENIED", "Election lifecycle transition is stale or not governed.", 409);
    return next;
  }

  async ballot(actor: CivicActor, electionId: string, db?: any) {
    const scope = assertStudent(actor); const election = await this.repo.getElection(scope, electionId, db); if (!election) return mapNotFound("CIVIC_ELECTION_NOT_FOUND", "Election was not found."); assertWindow(election); const office = await this.repo.getOffice(scope, election.officeId, db); if (!office) return mapNotFound("CIVIC_OFFICE_NOT_FOUND", "Civic office was not found."); const eligibility = deriveCivicEligibility(actor, office, { civicCourseEnrolled: true }); if (!eligibility.eligible || (election.eligibleVoterScope !== office.representationScope)) throw new ShfCivicError("CIVIC_VOTER_INELIGIBLE", "Voter constituency is not eligible for this election.", 403); const candidates = await this.repo.listApprovedCandidacies(scope, office.officeId, election.candidateIds, db); return { ballotId: `ballot_${electionId}_${scope.userId}`, electionId, voterUserId: scope.userId, voterEligibility: eligibility, candidates: candidates.map(({ candidacyId, officeId, displayName, statement, platformSummary, priorityTopics, privateContactExposed }) => ({ candidacyId, officeId, displayName, statement, platformSummary, priorityTopics, privateContactExposed })), method: election.ballotMethod, privacy: { separatesParticipationFromChoice: true, publicChoiceExposure: false, instructorChoiceExposure: false } };
  }

  async castBallot(actor: CivicActor, electionId: string, body: any) {
    const scope = assertStudent(actor);
    return this.repo.inTransaction(async (db) => { const election = await this.repo.getElection(scope, electionId, db); if (!election) return mapNotFound("CIVIC_ELECTION_NOT_FOUND", "Election was not found."); assertWindow(election); const ballot = await this.ballot(actor, electionId, db); const candidateId = String(body.candidateId || body.candidates?.[0] || ""); if (!ballot.candidates.some((candidate) => candidate.candidacyId === candidateId)) throw new ShfCivicError("CIVIC_BALLOT_CANDIDATE_REJECTED", "Ballot candidate was not server-generated for this voter.", 400); const idempotencyKey = String(body.idempotencyKey || `${electionId}:${scope.userId}`); return this.repo.castBallot(scope, election, candidateId, idempotencyKey, ballot.voterEligibility, hashChoice(electionId, candidateId), db); });
  }

  async certify(actor: CivicActor, electionId: string) {
    const scope = reviewAuthority(actor);
    return this.repo.inTransaction(async (db) => { const result = await this.repo.certify(scope, electionId, db); if (!result) return mapNotFound("CIVIC_ELECTION_NOT_FOUND", "Election was not found."); return result; });
  }

  async proposal(actor: CivicActor, body: any) { const scope = assertStudent(actor); return this.repo.insertProposal(scope, { proposalId: `proposal_${randomUUID()}`, sponsorRef: body.sponsorRef || null, title: String(body.title || "City project proposal").slice(0, 140), summary: String(body.summary || "Student-authored city project proposal.").slice(0, 600), proposalType: String(body.proposalType || "CITY_PROJECT"), body: String(body.body || ""), estimatedCost: body.estimatedCost == null ? null : Number(body.estimatedCost), shfCreditBudget: body.shfCreditBudget == null ? null : Number(body.shfCreditBudget), districtRefs: Array.isArray(body.districtRefs) ? body.districtRefs : ["civic-district"], attachments: Array.isArray(body.attachments) ? body.attachments : [] }); }
  async transitionProposal(actor: CivicActor, proposalId: string, status: string) { const scope = reviewAuthority(actor); const allowed = ["COMMITTEE_REVIEW", "AGENDA_READY", "DEBATE", "VOTING", "APPROVED", "DECLINED", "RETURNED"]; if (!allowed.includes(status)) throw new ShfCivicError("CIVIC_PROPOSAL_TRANSITION_DENIED", "Proposal transition is not governed.", 403); const record = await this.repo.inTransaction((db) => this.repo.transitionProposal(scope, proposalId, status, db)); if (!record) return mapNotFound("CIVIC_PROPOSAL_NOT_FOUND_OR_STALE", "Proposal was not found or its lifecycle changed."); return record; }
  async councilVote(actor: CivicActor, proposalId: string, vote: "YES" | "NO" | "ABSTAIN") { const scope = assertStudent(actor); return this.repo.inTransaction(async (db) => { const term = await this.repo.activeTerm(scope, db); if (!term) throw new ShfCivicError("CIVIC_COUNCIL_AUTHORITY_REQUIRED", "Active office-holder authority is required for council vote.", 403); const proposal = await this.repo.getProposal(scope, proposalId, db); if (!proposal) return mapNotFound("CIVIC_PROPOSAL_NOT_FOUND", "Proposal was not found."); try { return await this.repo.insertCouncilVote(scope, { councilVoteId: `council_vote_${randomUUID()}`, proposalId, termId: term.civic_term_id, vote }, db); } catch (error: any) { if (error?.code === "23505") throw new ShfCivicError("CIVIC_DUPLICATE_COUNCIL_VOTE", "Duplicate council vote rejected.", 409); throw error; } }); }
  async publicComment(actor: CivicActor, body: any) { const scope = assertStudent(actor); return this.repo.insertComment(scope, { commentId: `comment_${randomUUID()}`, proposalId: body.proposalId || null, body: String(body.body || "").slice(0, 2000), accessibleAlternativeRequested: body.accessibleAlternativeRequested === true }); }
  async createSession(actor: CivicActor, body: any) { const scope = reviewAuthority(actor); return this.repo.insertSession(scope, { sessionId: `session_${randomUUID()}`, title: String(body.title || "City Council Session").slice(0, 180), startsAt: body.startsAt, endsAt: body.endsAt || null, agenda: Array.isArray(body.agenda) ? body.agenda : [] }); }
  async createCityProjectReference(actor: CivicActor, proposalId: string, body: any) { const scope = reviewAuthority(actor); return this.repo.inTransaction(async (db) => { const proposal = await this.repo.getProposal(scope, proposalId, db); if (!proposal) return mapNotFound("CIVIC_PROPOSAL_NOT_FOUND", "Proposal was not found."); if (proposal.status !== "APPROVED") throw new ShfCivicError("CIVIC_PROJECT_REQUIRES_APPROVED_PROPOSAL", "Approved civic proposal required.", 409); const projectAuthority = String(body.projectAuthority || "MET8_OPPORTUNITY_EXCHANGE"); if (!["MET8_OPPORTUNITY_EXCHANGE", "PROJECT_DOMAIN", "MISSION_DOMAIN"].includes(projectAuthority)) throw new ShfCivicError("CIVIC_PROJECT_AUTHORITY_INVALID", "Canonical project authority is required.", 400); return this.repo.insertCityProject(scope, { cityProjectId: `city_project_${randomUUID()}`, proposalId, projectAuthority, budgetBoundary: { simulatedCityAllocation: body.simulatedCityAllocation || 0, personalWalletMutation: false, opportunityExchangeRequired: projectAuthority === "MET8_OPPORTUNITY_EXCHANGE" } }, db); }); }
  async publicProjection(actor: CivicActor) { const scope = civicScope(actor); await this.repo.inTransaction((db) => this.repo.ensureDefaultOffices(scope, db)); const offices = await this.repo.listOffices(scope); const candidacies = (await Promise.all(offices.map((office) => this.repo.listApprovedCandidacies(scope, office.officeId)))).flat(); return { authority: SHF_CIVIC_AUTHORITY, offices, candidacies, elections: await this.repo.listElections(scope), results: [], terms: await this.repo.listTerms(scope), council: { sessions: await this.repo.listSessions(scope), councilVotingIsRollCall: true, ballotSecrecyAppliesToStudentElectionsOnly: true }, proposals: await this.repo.listProposals(scope), publicComments: [], cityProjects: await this.repo.listCityProjects(scope), cityOperations: [], privacy: { exposesIndividualVoteChoice: false, exposesContactInfo: false, exposesPrivateEligibilityReasons: false } }; }
}

export const durableShfCivicService = new DurableShfCivicService();
