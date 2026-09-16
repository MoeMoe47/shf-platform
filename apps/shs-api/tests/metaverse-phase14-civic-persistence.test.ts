import { test } from "node:test";
import assert from "node:assert/strict";
import { ShfCivicRepository } from "../src/domain/shf-civic/repo/shf-civic-repo.ts";
import { readFileSync } from "node:fs";

const scope = { organizationId: "org_shf_001", tenantId: "tenant:org_shf_001", userId: "learner_met14_persisted" };

function durableExecutor() {
  const state: Record<string, any[]> = { candidacies: [], elections: [], participation: [], choices: [], proposals: [], sessions: [], comments: [], projects: [] };
  return {
    state,
    async query(sql: string, params: any[] = []) {
      if (sql.startsWith("INSERT INTO shf_civic_candidacies")) { const row = { candidacy_id: params[0], organization_id: params[1], tenant_id: params[2], office_id: params[3], student_user_id: params[4], representation_ref: params[5], statement: params[6], platform_summary: params[7], priority_topics_json: JSON.parse(params[8]), artifact_refs_json: JSON.parse(params[9]), status: "SUBMITTED", eligibility_snapshot_json: JSON.parse(params[10]), filed_at: new Date().toISOString(), reviewed_by_user_id: null, reviewed_at: null, display_name: "Persisted Candidate", moderation_status: "PENDING" }; state.candidacies.push(row); return { rows: [row] }; }
      if (sql.includes("FROM shf_civic_candidacies") && sql.includes("candidacy_id=$1")) return { rows: state.candidacies.filter((row) => row.candidacy_id === params[0] && row.organization_id === params[1] && row.tenant_id === params[2]) };
      if (sql.startsWith("UPDATE shf_civic_candidacies")) { const row = state.candidacies.find((item) => item.candidacy_id === params[0] && item.organization_id === params[1] && item.tenant_id === params[2]); if (!row || !["SUBMITTED", "UNDER_REVIEW"].includes(row.status)) return { rows: [] }; row.status = params[3]; row.reviewed_by_user_id = params[4]; row.reviewed_at = new Date().toISOString(); return { rows: [row] }; }
      if (sql.startsWith("INSERT INTO shf_civic_elections")) { const row = { civic_election_id: params[0], organization_id: params[1], tenant_id: params[2], office_id: params[3], title: params[4], opens_at: params[5], closes_at: params[6], eligible_voter_scope: params[7], candidate_ids_json: JSON.parse(params[8]), seat_count: params[9], ballot_method: params[10], status: params[11], results_release_policy: "AFTER_CERTIFICATION", candidate_ordering_policy: "ALPHABETIC_BY_DISPLAY_NAME" }; state.elections.push(row); return { rows: [row] }; }
      if (sql.includes("FROM shf_civic_elections") && !sql.includes("FOR UPDATE")) return { rows: state.elections.filter((row) => row.civic_election_id === params[0] && row.organization_id === params[1] && row.tenant_id === params[2]) };
      if (sql.includes("FOR UPDATE") && sql.includes("shf_civic_elections")) return { rows: state.elections.filter((row) => row.civic_election_id === params[0] && row.organization_id === params[1] && row.tenant_id === params[2]) };
      if (sql.startsWith("INSERT INTO shf_civic_vote_participation")) { if (state.participation.some((row) => row.election_id === params[3] && row.voter_user_id === params[4])) { const error: any = new Error("unique"); error.code = "23505"; throw error; } const row = { vote_participation_id: params[0], organization_id: params[1], tenant_id: params[2], election_id: params[3], voter_user_id: params[4], idempotency_key: params[7] }; state.participation.push(row); return { rows: [row] }; }
      if (sql.includes("FROM shf_civic_vote_participation")) return { rows: state.participation.filter((row) => row.organization_id === params[0] && row.tenant_id === params[1] && row.election_id === params[2] && row.voter_user_id === params[3]) };
      if (sql.startsWith("INSERT INTO shf_civic_vote_choice_vault")) { const row = { vote_choice_id: params[0], election_id: params[3], vote_participation_id: params[4], choice_hash: params[6] }; state.choices.push(row); return { rows: [row] }; }
      if (sql.startsWith("INSERT INTO shf_civic_proposals")) { const row = { civic_proposal_id: params[0], organization_id: params[1], tenant_id: params[2], author_user_id: params[3], sponsor_ref: params[4], title: params[5], summary: params[6], proposal_type: params[7], body: params[8], estimated_cost: params[9], simulated_shf_credit_budget: params[10], district_refs_json: JSON.parse(params[11]), attachments_json: JSON.parse(params[12]), status: "SUBMITTED", submitted_at: new Date().toISOString(), reviewed_at: null, decision_at: null }; state.proposals.push(row); return { rows: [row] }; }
      if (sql.startsWith("SELECT * FROM shf_civic_proposals")) return { rows: state.proposals.filter((row) => row.civic_proposal_id === params[0] && row.organization_id === params[1] && row.tenant_id === params[2]) };
      if (sql.startsWith("SELECT * FROM shf_civic_proposals") && sql.includes("FOR UPDATE")) return { rows: state.proposals.filter((row) => row.civic_proposal_id === params[0] && row.organization_id === params[1] && row.tenant_id === params[2]) };
      if (sql.startsWith("UPDATE shf_civic_proposals")) { const row = state.proposals.find((item) => item.civic_proposal_id === params[0] && item.organization_id === params[1] && item.tenant_id === params[2]); if (!row || row.status !== params[4]) return { rows: [] }; row.status = params[3]; return { rows: [row] }; }
      return { rows: [] };
    },
  };
}

test("MET-14 durable repository round-trips canonical state across repository recreation", async () => {
  const db = durableExecutor();
  const first = new ShfCivicRepository(db.query.bind(db), async (fn: any) => fn(db));
  const candidacy = await first.insertCandidacy(scope, { candidacyId: "cand_restart", officeId: "office_student_mayor", representationRef: "city:org_shf_001", statement: "statement", platformSummary: "priorities", priorityTopics: [], artifactRefs: [], eligibilitySnapshot: { eligible: true } });
  const election = await first.createElection(scope, { electionId: "election_restart", officeId: "office_student_mayor", title: "Election", opensAt: "2026-01-01T00:00:00Z", closesAt: "2026-12-31T00:00:00Z", eligibleVoterScope: "CITY_AT_LARGE", candidateIds: [candidacy.candidacyId], seatCount: 1, ballotMethod: "SINGLE_CHOICE", status: "OPEN" });
  const receipt = await first.castBallot(scope, election, candidacy.candidacyId, "idempotency-restart", { representation: { ref: "city:org_shf_001" } }, "choice-hash", db);
  const proposal = await first.insertProposal(scope, { proposalId: "proposal_restart", sponsorRef: null, title: "Proposal", summary: "Summary", proposalType: "CITY_PROJECT", body: "Body", estimatedCost: null, shfCreditBudget: null, districtRefs: [], attachments: [] });
  const second = new ShfCivicRepository(db.query.bind(db), async (fn: any) => fn(db));
  assert.equal((await second.getCandidacy(scope, candidacy.candidacyId))?.candidacyId, "cand_restart");
  assert.equal((await second.getElection(scope, election.electionId))?.status, "OPEN");
  assert.equal((await second.castBallot(scope, election, candidacy.candidacyId, "idempotency-restart", { representation: { ref: "city:org_shf_001" } }, "choice-hash", db)).idempotent, true);
  assert.equal((await second.getProposal(scope, proposal.proposalId))?.status, "SUBMITTED");
  assert.equal(db.state.participation.length, 1);
  assert.equal(db.state.choices.length, 1);
});

test("MET-14 durable persistence contract is transaction-scoped and privacy-separated", () => {
  const repoSource = readFileSync(new URL("../src/domain/shf-civic/repo/shf-civic-repo.ts", import.meta.url), "utf8");
  const serviceSource = readFileSync(new URL("../src/domain/shf-civic/service/durable-shf-civic-service.ts", import.meta.url), "utf8");
  assert.match(repoSource, /UNIQUE|FOR UPDATE/);
  assert.match(repoSource, /shf_civic_vote_participation/);
  assert.match(repoSource, /shf_civic_vote_choice_vault/);
  assert.match(serviceSource, /inTransaction/);
  assert.match(serviceSource, /SHF_CIVIC/);
  assert.doesNotMatch(serviceSource, /CivicSure/);
});
