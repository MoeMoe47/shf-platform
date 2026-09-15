import { query } from "../../../../db/client.js";
import type {
  StudentOpportunity,
  StudentOpportunityBid,
  StudentOpportunityAward,
  StudentOpportunitySubmission,
  EligibilityRules,
} from "../model/opportunity-contract.js";

type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

function toIso(value: any): string {
  return value instanceof Date ? value.toISOString() : value;
}
function toIsoOrNull(value: any): string | null {
  return value == null ? null : toIso(value);
}

const OPPORTUNITY_COLUMNS = `
  opportunity_id, organization_id, tenant_id, sponsor_org_id, sponsor_user_id, title, summary, description,
  opportunity_type, source_type, source_ref, district_id, facility_id, mission_projection_id, program_id,
  career_id, required_skills_json, preferred_skills_json, required_evidence_refs_json, eligibility_rules_json,
  difficulty_tier, participation_mode, team_size_min, team_size_max, deliverables_json, deadline,
  application_open_at, application_close_at, status, compensation_type, compensation_amount, currency_type,
  selection_method, max_awards, created_by_user_id, created_at, updated_at, version
`;

function rowToOpportunity(row: any): StudentOpportunity {
  return {
    opportunityId: row.opportunity_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    sponsorOrgId: row.sponsor_org_id,
    sponsorUserId: row.sponsor_user_id,
    title: row.title,
    summary: row.summary,
    description: row.description,
    opportunityType: row.opportunity_type,
    sourceType: row.source_type,
    sourceRef: row.source_ref,
    districtId: row.district_id,
    facilityId: row.facility_id,
    missionProjectionId: row.mission_projection_id,
    programId: row.program_id,
    careerId: row.career_id,
    requiredSkills: row.required_skills_json || [],
    preferredSkills: row.preferred_skills_json || [],
    requiredEvidenceRefs: row.required_evidence_refs_json || [],
    eligibilityRules: (row.eligibility_rules_json || {}) as EligibilityRules,
    difficultyTier: row.difficulty_tier,
    participationMode: row.participation_mode,
    teamSizeMin: row.team_size_min,
    teamSizeMax: row.team_size_max,
    deliverables: row.deliverables_json || [],
    deadline: toIso(row.deadline),
    applicationOpenAt: toIsoOrNull(row.application_open_at),
    applicationCloseAt: toIso(row.application_close_at),
    status: row.status,
    compensationType: row.compensation_type,
    compensationAmount: row.compensation_amount == null ? null : Number(row.compensation_amount),
    currencyType: row.currency_type,
    selectionMethod: row.selection_method,
    maxAwards: Number(row.max_awards),
    createdByUserId: row.created_by_user_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    version: Number(row.version),
  };
}

function rowToBid(row: any): StudentOpportunityBid {
  return {
    bidId: row.bid_id,
    opportunityId: row.opportunity_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    bidderType: row.bidder_type,
    studentId: row.student_id,
    teamId: row.team_id,
    proposalSummary: row.proposal_summary,
    approach: row.approach,
    requestedCompensationAmount: row.requested_compensation_amount == null ? null : Number(row.requested_compensation_amount),
    requestedCompensationType: row.requested_compensation_type,
    estimatedCompletionDays: row.estimated_completion_days == null ? null : Number(row.estimated_completion_days),
    portfolioEvidenceRefs: row.portfolio_evidence_refs_json || [],
    skillEvidenceRefs: row.skill_evidence_refs_json || [],
    availability: row.availability,
    submittedAt: toIsoOrNull(row.submitted_at),
    status: row.status,
    revision: Number(row.revision),
    withdrawnAt: toIsoOrNull(row.withdrawn_at),
    createdByUserId: row.created_by_user_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function rowToAward(row: any): StudentOpportunityAward {
  return {
    awardId: row.award_id,
    opportunityId: row.opportunity_id,
    bidId: row.bid_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    studentId: row.student_id,
    teamId: row.team_id,
    sponsorUserId: row.sponsor_user_id,
    awardedAt: toIso(row.awarded_at),
    workScopeSnapshot: row.work_scope_snapshot_json,
    deliverablesSnapshot: row.deliverables_snapshot_json,
    compensationSnapshot: row.compensation_snapshot_json,
    dueDate: toIso(row.due_date),
    status: row.status,
    projectRef: row.project_ref,
    paymentIntentRef: row.payment_intent_ref,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function rowToSubmission(row: any): StudentOpportunitySubmission {
  return {
    submissionId: row.submission_id,
    awardId: row.award_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    submittedByUserId: row.submitted_by_user_id,
    artifactRefs: row.artifact_refs_json || [],
    studentComment: row.student_comment,
    submittedAt: toIso(row.submitted_at),
    status: row.status,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedAt: toIsoOrNull(row.reviewed_at),
    reviewFeedback: row.review_feedback,
    version: Number(row.version),
    createdAt: toIso(row.created_at),
  };
}

export class OpportunityExchangeRepo {
  async createOpportunity(input: Omit<StudentOpportunity, "createdAt" | "updatedAt" | "version">, db: Executor = { query }): Promise<StudentOpportunity> {
    const res = await db.query(
      `INSERT INTO student_opportunities (
        opportunity_id, organization_id, tenant_id, sponsor_org_id, sponsor_user_id, title, summary, description,
        opportunity_type, source_type, source_ref, district_id, facility_id, mission_projection_id, program_id,
        career_id, required_skills_json, preferred_skills_json, required_evidence_refs_json, eligibility_rules_json,
        difficulty_tier, participation_mode, team_size_min, team_size_max, deliverables_json, deadline,
        application_open_at, application_close_at, status, compensation_type, compensation_amount, currency_type,
        selection_method, max_awards, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35)
      RETURNING ${OPPORTUNITY_COLUMNS}`,
      [
        input.opportunityId, input.organizationId, input.tenantId, input.sponsorOrgId, input.sponsorUserId,
        input.title, input.summary, input.description, input.opportunityType, input.sourceType, input.sourceRef,
        input.districtId, input.facilityId, input.missionProjectionId, input.programId, input.careerId,
        JSON.stringify(input.requiredSkills), JSON.stringify(input.preferredSkills), JSON.stringify(input.requiredEvidenceRefs),
        JSON.stringify(input.eligibilityRules), input.difficultyTier, input.participationMode, input.teamSizeMin,
        input.teamSizeMax, JSON.stringify(input.deliverables), input.deadline, input.applicationOpenAt,
        input.applicationCloseAt, input.status, input.compensationType, input.compensationAmount, input.currencyType,
        input.selectionMethod, input.maxAwards, input.createdByUserId,
      ],
    );
    return rowToOpportunity(res.rows[0]);
  }

  async getOpportunityById(id: string, db: Executor = { query }): Promise<StudentOpportunity | null> {
    const res = await db.query(`SELECT ${OPPORTUNITY_COLUMNS} FROM student_opportunities WHERE opportunity_id=$1`, [id]);
    return res.rows[0] ? rowToOpportunity(res.rows[0]) : null;
  }

  async listOpportunitiesForOrganization(organizationId: string, db: Executor = { query }): Promise<StudentOpportunity[]> {
    const res = await db.query(`SELECT ${OPPORTUNITY_COLUMNS} FROM student_opportunities WHERE organization_id=$1 ORDER BY created_at DESC`, [organizationId]);
    return res.rows.map(rowToOpportunity);
  }

  async listOpenOpportunitiesForOrganization(organizationId: string, db: Executor = { query }): Promise<StudentOpportunity[]> {
    const res = await db.query(
      `SELECT ${OPPORTUNITY_COLUMNS} FROM student_opportunities
       WHERE organization_id=$1 AND status='OPEN' AND application_close_at >= NOW()
       ORDER BY application_close_at ASC`,
      [organizationId],
    );
    return res.rows.map(rowToOpportunity);
  }

  async updateOpportunityStatus(id: string, status: string, expectedVersion: number, db: Executor = { query }): Promise<StudentOpportunity | null> {
    const res = await db.query(
      `UPDATE student_opportunities SET status=$2, updated_at=NOW(), version=version+1
       WHERE opportunity_id=$1 AND version=$3 RETURNING ${OPPORTUNITY_COLUMNS}`,
      [id, status, expectedVersion],
    );
    return res.rows[0] ? rowToOpportunity(res.rows[0]) : null;
  }

  async countBidsForOpportunity(opportunityId: string, db: Executor = { query }): Promise<number> {
    const res = await db.query(
      `SELECT COUNT(*)::int AS n FROM student_opportunity_bids WHERE opportunity_id=$1 AND status NOT IN ('DRAFT','WITHDRAWN')`,
      [opportunityId],
    );
    return Number(res.rows[0]?.n || 0);
  }

  async countActiveAwardsForOpportunity(opportunityId: string, db: Executor = { query }): Promise<number> {
    const res = await db.query(
      `SELECT COUNT(*)::int AS n FROM student_opportunity_awards WHERE opportunity_id=$1 AND status NOT IN ('CANCELLED','EXPIRED')`,
      [opportunityId],
    );
    return Number(res.rows[0]?.n || 0);
  }

  async countCompletedAwardsForStudent(organizationId: string, studentId: string, db: Executor = { query }): Promise<number> {
    const res = await db.query(
      `SELECT COUNT(*)::int AS n FROM student_opportunity_awards WHERE organization_id=$1 AND student_id=$2 AND status='COMPLETED'`,
      [organizationId, studentId],
    );
    return Number(res.rows[0]?.n || 0);
  }

  // Bids
  async createBid(input: Omit<StudentOpportunityBid, "createdAt" | "updatedAt">, db: Executor = { query }): Promise<StudentOpportunityBid> {
    const res = await db.query(
      `INSERT INTO student_opportunity_bids (
        bid_id, opportunity_id, organization_id, tenant_id, bidder_type, student_id, team_id, proposal_summary,
        approach, requested_compensation_amount, requested_compensation_type, estimated_completion_days,
        portfolio_evidence_refs_json, skill_evidence_refs_json, availability, submitted_at, status, revision,
        withdrawn_at, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        input.bidId, input.opportunityId, input.organizationId, input.tenantId, input.bidderType, input.studentId,
        input.teamId, input.proposalSummary, input.approach, input.requestedCompensationAmount,
        input.requestedCompensationType, input.estimatedCompletionDays, JSON.stringify(input.portfolioEvidenceRefs),
        JSON.stringify(input.skillEvidenceRefs), input.availability, input.submittedAt, input.status, input.revision,
        input.withdrawnAt, input.createdByUserId,
      ],
    );
    return rowToBid(res.rows[0]);
  }

  async getBidById(id: string, db: Executor = { query }): Promise<StudentOpportunityBid | null> {
    const res = await db.query("SELECT * FROM student_opportunity_bids WHERE bid_id=$1", [id]);
    return res.rows[0] ? rowToBid(res.rows[0]) : null;
  }

  async listBidsForOpportunity(opportunityId: string, db: Executor = { query }): Promise<StudentOpportunityBid[]> {
    const res = await db.query("SELECT * FROM student_opportunity_bids WHERE opportunity_id=$1 ORDER BY created_at ASC", [opportunityId]);
    return res.rows.map(rowToBid);
  }

  async findActiveBidByStudent(opportunityId: string, studentId: string, db: Executor = { query }): Promise<StudentOpportunityBid | null> {
    const res = await db.query(
      `SELECT * FROM student_opportunity_bids WHERE opportunity_id=$1 AND student_id=$2 AND bidder_type='INDIVIDUAL'
       AND status NOT IN ('WITHDRAWN','DECLINED','EXPIRED') ORDER BY created_at DESC LIMIT 1`,
      [opportunityId, studentId],
    );
    return res.rows[0] ? rowToBid(res.rows[0]) : null;
  }

  async findActiveBidByTeam(opportunityId: string, teamId: string, db: Executor = { query }): Promise<StudentOpportunityBid | null> {
    const res = await db.query(
      `SELECT * FROM student_opportunity_bids WHERE opportunity_id=$1 AND team_id=$2 AND bidder_type='TEAM'
       AND status NOT IN ('WITHDRAWN','DECLINED','EXPIRED') ORDER BY created_at DESC LIMIT 1`,
      [opportunityId, teamId],
    );
    return res.rows[0] ? rowToBid(res.rows[0]) : null;
  }

  async updateBidStatus(id: string, status: string, db: Executor = { query }, extra: { withdrawnAt?: string | null } = {}): Promise<StudentOpportunityBid | null> {
    const res = await db.query(
      `UPDATE student_opportunity_bids SET status=$2, withdrawn_at=COALESCE($3, withdrawn_at), updated_at=NOW() WHERE bid_id=$1 RETURNING *`,
      [id, status, extra.withdrawnAt ?? null],
    );
    return res.rows[0] ? rowToBid(res.rows[0]) : null;
  }

  // Awards
  async createAward(input: Omit<StudentOpportunityAward, "createdAt" | "updatedAt">, db: Executor = { query }): Promise<StudentOpportunityAward> {
    const res = await db.query(
      `INSERT INTO student_opportunity_awards (
        award_id, opportunity_id, bid_id, organization_id, tenant_id, student_id, team_id, sponsor_user_id,
        awarded_at, work_scope_snapshot_json, deliverables_snapshot_json, compensation_snapshot_json, due_date,
        status, project_ref, payment_intent_ref
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        input.awardId, input.opportunityId, input.bidId, input.organizationId, input.tenantId, input.studentId,
        input.teamId, input.sponsorUserId, input.awardedAt, JSON.stringify(input.workScopeSnapshot),
        JSON.stringify(input.deliverablesSnapshot), JSON.stringify(input.compensationSnapshot), input.dueDate,
        input.status, input.projectRef, input.paymentIntentRef,
      ],
    );
    return rowToAward(res.rows[0]);
  }

  async getAwardById(id: string, db: Executor = { query }): Promise<StudentOpportunityAward | null> {
    const res = await db.query("SELECT * FROM student_opportunity_awards WHERE award_id=$1", [id]);
    return res.rows[0] ? rowToAward(res.rows[0]) : null;
  }

  async listAwardsForOpportunity(opportunityId: string, db: Executor = { query }): Promise<StudentOpportunityAward[]> {
    const res = await db.query("SELECT * FROM student_opportunity_awards WHERE opportunity_id=$1 ORDER BY awarded_at ASC", [opportunityId]);
    return res.rows.map(rowToAward);
  }

  async listAwardsForStudent(organizationId: string, studentId: string, db: Executor = { query }): Promise<StudentOpportunityAward[]> {
    const res = await db.query("SELECT * FROM student_opportunity_awards WHERE organization_id=$1 AND student_id=$2 ORDER BY awarded_at DESC", [organizationId, studentId]);
    return res.rows.map(rowToAward);
  }

  async updateAwardStatus(id: string, status: string, db: Executor = { query }, extra: { projectRef?: string | null; paymentIntentRef?: string | null } = {}): Promise<StudentOpportunityAward | null> {
    const res = await db.query(
      `UPDATE student_opportunity_awards SET status=$2, project_ref=COALESCE($3, project_ref), payment_intent_ref=COALESCE($4, payment_intent_ref), updated_at=NOW() WHERE award_id=$1 RETURNING *`,
      [id, status, extra.projectRef ?? null, extra.paymentIntentRef ?? null],
    );
    return res.rows[0] ? rowToAward(res.rows[0]) : null;
  }

  // Submissions
  async createSubmission(input: Omit<StudentOpportunitySubmission, "createdAt">, db: Executor = { query }): Promise<StudentOpportunitySubmission> {
    const res = await db.query(
      `INSERT INTO student_opportunity_submissions (
        submission_id, award_id, organization_id, tenant_id, submitted_by_user_id, artifact_refs_json,
        student_comment, submitted_at, status, reviewed_by_user_id, reviewed_at, review_feedback, version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        input.submissionId, input.awardId, input.organizationId, input.tenantId, input.submittedByUserId,
        JSON.stringify(input.artifactRefs), input.studentComment, input.submittedAt, input.status,
        input.reviewedByUserId, input.reviewedAt, input.reviewFeedback, input.version,
      ],
    );
    return rowToSubmission(res.rows[0]);
  }

  async listSubmissionsForAward(awardId: string, db: Executor = { query }): Promise<StudentOpportunitySubmission[]> {
    const res = await db.query("SELECT * FROM student_opportunity_submissions WHERE award_id=$1 ORDER BY version ASC", [awardId]);
    return res.rows.map(rowToSubmission);
  }

  async getSubmissionById(id: string, db: Executor = { query }): Promise<StudentOpportunitySubmission | null> {
    const res = await db.query("SELECT * FROM student_opportunity_submissions WHERE submission_id=$1", [id]);
    return res.rows[0] ? rowToSubmission(res.rows[0]) : null;
  }

  async reviewSubmission(id: string, status: string, reviewerUserId: string, feedback: string | null, db: Executor = { query }): Promise<StudentOpportunitySubmission | null> {
    const res = await db.query(
      `UPDATE student_opportunity_submissions SET status=$2, reviewed_by_user_id=$3, reviewed_at=NOW(), review_feedback=$4
       WHERE submission_id=$1 RETURNING *`,
      [id, status, reviewerUserId, feedback],
    );
    return res.rows[0] ? rowToSubmission(res.rows[0]) : null;
  }
}
