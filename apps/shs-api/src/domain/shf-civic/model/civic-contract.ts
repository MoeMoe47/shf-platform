export const SHF_CIVIC_AUTHORITY = {
  authority: "SHF_CIVIC",
  authorityLabel: "SHF Civic",
  excludedAuthority: "CivicSure",
  scope: "CITY_LEVEL_EDUCATIONAL_SIMULATION",
  civicSureIsAuthority: false,
  cityLevelOnly: true,
  neutralProcedureOnly: true,
  duplicateCivicAuthorityPersisted: false,
} as const;

export const CIVIC_NEUTRALITY_RULES = [
  "NO_PARTY_INFRASTRUCTURE",
  "NO_IDEOLOGY_PROFILE",
  "NO_POLITICAL_VIEWPOINT_ELIGIBILITY",
  "NO_CANDIDATE_RANKING",
  "NO_FAVORED_CANDIDATE",
  "NO_TARGETED_PERSUASION",
  "NO_FUNDRAISING",
  "NO_PAID_VISIBILITY",
  "NO_ELECTION_PREDICTION",
] as const;

export const CIVIC_AUTHORITY_REUSE = {
  identity: "req.user plus canonical membership/role permissions",
  organization: "active organization and tenant context",
  enrollment: "enrollments/cohorts/program facts where present",
  curriculum: "curriculum/completion-policy facts for civic course prerequisites",
  missions: "MET-7 mission projection service",
  opportunityExchange: "MET-8 Opportunity Exchange for governed project/procurement handoff",
  treasury: "MET-9 Treasury/Student Market; simulated city allocations only",
  workPassport: "MET-10 Work Passport projections; civic experience is source-backed but not verified skill by default",
  orchestration: "MET-11 City Orchestration next-action projection",
  studentEnterprise: "MET-12 Student Enterprise through MET-8 project/procurement boundary",
  simulations: "MET-13 simulations registry/runtime",
  communication: "MET-6 metaverse communication room policy; no student DMs",
  notifications: "NCA notification service/outbox projection",
  evidence: "Portfolio/verified evidence remain source-gated; civic participation is evidence candidate only",
  civicSure: "EXCLUDED: CivicSure government-assurance/cases/reporting never owns student civic government",
} as const;

export type CivicRepresentationScope = "SCHOOL" | "SCHOOL_DISTRICT" | "PROGRAM" | "COHORT" | "CITY_AT_LARGE" | "CIVIC_DISTRICT";
export type CivicOfficeType = "EXECUTIVE" | "COUNCIL" | "COMMITTEE" | "CLERK" | "BUDGET" | "INFRASTRUCTURE" | "TECHNOLOGY" | "COMMUNITY" | "EDUCATION" | "ACCESSIBILITY" | "SUSTAINABILITY";
export type CivicCandidacyStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "DECLINED" | "WITHDRAWN" | "DISQUALIFIED" | "ELECTION_COMPLETE";
export type CivicElectionStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" | "CERTIFICATION_PENDING" | "CERTIFIED" | "CANCELLED" | "ARCHIVED";
export type CivicProposalStatus = "DRAFT" | "SUBMITTED" | "COMMITTEE_REVIEW" | "AGENDA_READY" | "DEBATE" | "VOTING" | "APPROVED" | "DECLINED" | "RETURNED" | "IMPLEMENTATION_PENDING" | "IMPLEMENTING" | "COMPLETED" | "ARCHIVED";
export type CivicTermStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "VACATED" | "SUSPENDED" | "REMOVED";

export interface CivicActor {
  user_id?: string;
  id?: string;
  active_organization_id?: string;
  organization_id?: string;
  tenant_id?: string;
  roles?: string[];
  permissions?: string[];
  org_context_error?: string;
}

export interface CivicOffice {
  officeId: string;
  cityId: string;
  title: string;
  officeType: CivicOfficeType;
  representationScope: CivicRepresentationScope;
  representationRef: string | null;
  termLengthDays: number;
  eligibilityPolicy: string[];
  seatCount: number;
  electionMethod: "SINGLE_CHOICE" | "MULTI_SEAT";
  status: "ACTIVE" | "INACTIVE";
  description: string;
  responsibilities: string[];
}

export interface CivicEligibilityDecision {
  eligible: boolean;
  reasons: string[];
  requirementsRemaining: string[];
  representation: {
    scope: CivicRepresentationScope;
    ref: string;
    displayName: string;
    serverDerived: true;
  };
  disallowedFactors: string[];
}

export interface CivicCandidateProfile {
  candidacyId: string;
  officeId: string;
  studentUserId: string;
  displayName: string;
  representationRef: string;
  statement: string;
  platformSummary: string;
  priorityTopics: string[];
  artifactRefs: string[];
  filedAt: string;
  status: CivicCandidacyStatus;
  eligibilitySnapshot: CivicEligibilityDecision;
  reviewedBy: string | null;
  reviewedAt: string | null;
  privateContactExposed: false;
  visibilityBoostPurchased: false;
}

export interface CivicElection {
  electionId: string;
  officeId: string;
  title: string;
  opensAt: string;
  closesAt: string;
  eligibleVoterScope: CivicRepresentationScope;
  candidateIds: string[];
  seatCount: number;
  ballotMethod: "SINGLE_CHOICE" | "MULTI_SEAT";
  status: CivicElectionStatus;
  resultsReleasePolicy: "AFTER_CERTIFICATION";
  candidateOrderingPolicy: "ALPHABETIC_BY_DISPLAY_NAME";
}

export interface CivicBallot {
  ballotId: string;
  electionId: string;
  voterUserId: string;
  voterEligibility: CivicEligibilityDecision;
  candidates: Array<Pick<CivicCandidateProfile, "candidacyId" | "officeId" | "displayName" | "statement" | "platformSummary" | "priorityTopics" | "privateContactExposed">>;
  method: CivicElection["ballotMethod"];
  privacy: {
    separatesParticipationFromChoice: true;
    publicChoiceExposure: false;
    instructorChoiceExposure: false;
  };
}

export interface CivicProposal {
  proposalId: string;
  authorUserId: string;
  sponsorRef: string | null;
  title: string;
  summary: string;
  proposalType: string;
  body: string;
  estimatedCost: number | null;
  shfCreditBudget: number | null;
  districtRefs: string[];
  attachments: string[];
  status: CivicProposalStatus;
  submittedAt: string;
  reviewedAt: string | null;
  decisionAt: string | null;
}

export interface CivicCouncilVote {
  councilVoteId: string;
  proposalId: string;
  officeHolderUserId: string;
  vote: "YES" | "NO" | "ABSTAIN";
  rollCallPublic: true;
  castAt: string;
}

export interface CivicPublicProjection {
  authority: typeof SHF_CIVIC_AUTHORITY;
  offices: CivicOffice[];
  candidacies: CivicCandidateProfile[];
  elections: CivicElection[];
  results: any[];
  terms: any[];
  council: any;
  proposals: CivicProposal[];
  publicComments: any[];
  cityProjects: any[];
  cityOperations: any[];
  privacy: {
    exposesIndividualVoteChoice: false;
    exposesContactInfo: false;
    exposesPrivateEligibilityReasons: false;
  };
}
