import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";

export interface MissionPublicationScope { organizationId: string; tenantId: string; userId: string }
export type MissionPublicationExecutor = { query: typeof query };

function date(value: unknown) { return value instanceof Date ? value.toISOString() : value; }
function submissionDto(row: any) {
  return {
    submissionId: row.submission_id, draftId: row.draft_id, draftRevision: Number(row.draft_revision),
    missionId: row.mission_id, missionVersion: Number(row.mission_version), status: row.status,
    definition: row.definition_snapshot, submittedAt: date(row.submitted_at),
    submissionNote: row.submission_note, reviewedAt: date(row.reviewed_at), decisionNote: row.decision_note,
  };
}
function releaseDto(row: any) {
  return {
    releaseId: row.release_id, missionId: row.mission_id, missionVersion: Number(row.mission_version),
    status: row.status, definition: row.definition_snapshot, sourceSubmissionId: row.source_submission_id,
    publishedAt: date(row.published_at), retiredAt: date(row.retired_at), retirementNote: row.retirement_note,
  };
}

export class MissionPublicationRepo {
  constructor(
    private readonly dbQuery: typeof query = query,
    private readonly transaction: typeof withTransaction = withTransaction,
  ) {}

  async submit(scope: MissionPublicationScope, draftId: string, expectedRevision: number, submissionNote: string | null) {
    return this.transaction(async (tx: any) => {
      const draft = (await tx.query(
        `SELECT draft_id, mission_id, mission_version, revision, definition_json
         FROM mission_definition_drafts
         WHERE draft_id=$1 AND organization_id=$2 AND tenant_id=$3 AND author_user_id=$4
         FOR UPDATE`, [draftId, scope.organizationId, scope.tenantId, scope.userId],
      )).rows[0];
      if (!draft) return { kind: "NOT_FOUND" as const };
      if (Number(draft.revision) !== expectedRevision) return { kind: "REVISION_CONFLICT" as const, currentRevision: Number(draft.revision) };
      const existing = (await tx.query(
        `SELECT * FROM mission_review_submissions
         WHERE organization_id=$1 AND tenant_id=$2 AND draft_id=$3 AND draft_revision=$4`,
        [scope.organizationId, scope.tenantId, draftId, expectedRevision],
      )).rows[0];
      if (existing) return { kind: "OK" as const, submission: submissionDto(existing), reused: true };
      const submissionId = randomUUID();
      const inserted = (await tx.query(
        `INSERT INTO mission_review_submissions
          (submission_id, organization_id, tenant_id, draft_id, draft_revision, mission_id, mission_version,
           definition_snapshot, status, submitted_by_user_id, submission_note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,'SUBMITTED',$9,$10) RETURNING *`,
        [submissionId, scope.organizationId, scope.tenantId, draftId, expectedRevision, draft.mission_id,
          draft.mission_version, JSON.stringify(draft.definition_json), scope.userId, submissionNote],
      )).rows[0];
      await this.insertEvent(tx, scope, inserted.mission_id, inserted.mission_version, "SUBMITTED", submissionId, null, { draftRevision: expectedRevision });
      return { kind: "OK" as const, submission: submissionDto(inserted), reused: false };
    });
  }

  async listSubmissions(scope: MissionPublicationScope, status = "SUBMITTED") {
    const result = await this.dbQuery(
      `SELECT * FROM mission_review_submissions WHERE organization_id=$1 AND tenant_id=$2 AND status=$3
       ORDER BY submitted_at ASC, submission_id ASC LIMIT 100`, [scope.organizationId, scope.tenantId, status],
    );
    return result.rows.map(submissionDto);
  }

  async getSubmission(scope: MissionPublicationScope, submissionId: string) {
    const result = await this.dbQuery(
      `SELECT * FROM mission_review_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3`,
      [submissionId, scope.organizationId, scope.tenantId],
    );
    return result.rows[0] ? submissionDto(result.rows[0]) : null;
  }

  async listAuthorSubmissions(scope: MissionPublicationScope, draftId: string) {
    const result = await this.dbQuery(
      `SELECT s.* FROM mission_review_submissions s
       JOIN mission_definition_drafts d ON d.draft_id=s.draft_id AND d.organization_id=s.organization_id AND d.tenant_id=s.tenant_id
       WHERE s.draft_id=$1 AND s.organization_id=$2 AND s.tenant_id=$3 AND d.author_user_id=$4
       ORDER BY s.draft_revision DESC, s.submitted_at DESC LIMIT 20`,
      [draftId, scope.organizationId, scope.tenantId, scope.userId],
    );
    return result.rows.map(submissionDto);
  }

  async decide(scope: MissionPublicationScope, submissionId: string, decision: "APPROVED" | "REJECTED", note: string | null) {
    return this.transaction(async (tx: any) => {
      const row = (await tx.query(
        `SELECT * FROM mission_review_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3 FOR UPDATE`,
        [submissionId, scope.organizationId, scope.tenantId],
      )).rows[0];
      if (!row) return { kind: "NOT_FOUND" as const };
      if (row.submitted_by_user_id === scope.userId) return { kind: "SELF_REVIEW" as const };
      if (row.status !== "SUBMITTED") return { kind: row.status === decision ? "IDEMPOTENT" as const : "INVALID_STATE" as const, submission: submissionDto(row) };
      const updated = (await tx.query(
        `UPDATE mission_review_submissions SET status=$4, reviewed_by_user_id=$5, reviewed_at=NOW(), decision_note=$6, updated_at=NOW()
         WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *`,
        [submissionId, scope.organizationId, scope.tenantId, decision, scope.userId, note],
      )).rows[0];
      await this.insertEvent(tx, scope, row.mission_id, row.mission_version, decision, submissionId, null, note ? { note } : {});
      return { kind: "OK" as const, submission: submissionDto(updated) };
    });
  }

  async publish(scope: MissionPublicationScope, submissionId: string, definition: Record<string, unknown>) {
    return this.transaction(async (tx: any) => {
      const submission = (await tx.query(
        `SELECT * FROM mission_review_submissions WHERE submission_id=$1 AND organization_id=$2 AND tenant_id=$3 FOR UPDATE`,
        [submissionId, scope.organizationId, scope.tenantId],
      )).rows[0];
      if (!submission) return { kind: "NOT_FOUND" as const };
      const prior = (await tx.query(
        `SELECT * FROM mission_published_releases WHERE organization_id=$1 AND tenant_id=$2 AND source_submission_id=$3`,
        [scope.organizationId, scope.tenantId, submissionId],
      )).rows[0];
      if (prior) return { kind: "OK" as const, release: releaseDto(prior), reused: true };
      if (submission.status !== "APPROVED") return { kind: "NOT_APPROVED" as const };
      const release = (await tx.query(
        `INSERT INTO mission_published_releases
          (release_id, organization_id, tenant_id, mission_id, mission_version, definition_snapshot,
           source_submission_id, status, published_by_user_id)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,'PUBLISHED',$8) RETURNING *`,
        [randomUUID(), scope.organizationId, scope.tenantId, submission.mission_id, submission.mission_version,
          JSON.stringify(definition), submissionId, scope.userId],
      )).rows[0];
      await this.insertEvent(tx, scope, submission.mission_id, submission.mission_version, "PUBLISHED", submissionId, release.release_id, {});
      return { kind: "OK" as const, release: releaseDto(release), reused: false };
    });
  }

  async retire(scope: MissionPublicationScope, releaseId: string, note: string) {
    return this.transaction(async (tx: any) => {
      const row = (await tx.query(
        `SELECT * FROM mission_published_releases WHERE release_id=$1 AND organization_id=$2 AND tenant_id=$3 FOR UPDATE`,
        [releaseId, scope.organizationId, scope.tenantId],
      )).rows[0];
      if (!row) return { kind: "NOT_FOUND" as const };
      if (row.status === "RETIRED") return { kind: "IDEMPOTENT" as const, release: releaseDto(row) };
      const updated = (await tx.query(
        `UPDATE mission_published_releases SET status='RETIRED', retired_by_user_id=$4, retired_at=NOW(), retirement_note=$5
         WHERE release_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *`,
        [releaseId, scope.organizationId, scope.tenantId, scope.userId, note],
      )).rows[0];
      await this.insertEvent(tx, scope, row.mission_id, row.mission_version, "RETIRED", row.source_submission_id, releaseId, { note });
      return { kind: "OK" as const, release: releaseDto(updated) };
    });
  }

  async listReleases(scope: MissionPublicationScope) {
    const result = await this.dbQuery(
      `SELECT * FROM mission_published_releases WHERE organization_id=$1 AND tenant_id=$2
       ORDER BY published_at DESC, release_id ASC LIMIT 100`, [scope.organizationId, scope.tenantId],
    );
    return result.rows.map(releaseDto);
  }

  async resolvePublishedMission(scope: Pick<MissionPublicationScope, "organizationId" | "tenantId">, missionId: string, version: number) {
    const result = await this.dbQuery(
      `SELECT definition_snapshot FROM mission_published_releases
       WHERE organization_id=$1 AND tenant_id=$2 AND mission_id=$3 AND mission_version=$4 AND status='PUBLISHED'`,
      [scope.organizationId, scope.tenantId, missionId, version],
    );
    return result.rows[0]?.definition_snapshot ?? null;
  }

  private async insertEvent(tx: any, scope: MissionPublicationScope, missionId: string, version: number, eventType: string, submissionId: string | null, releaseId: string | null, metadata: Record<string, unknown>) {
    await tx.query(
      `INSERT INTO mission_publication_events
       (event_id, organization_id, tenant_id, mission_id, mission_version, submission_id, release_id, actor_user_id, event_type, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [randomUUID(), scope.organizationId, scope.tenantId, missionId, version, submissionId, releaseId, scope.userId, eventType, JSON.stringify(metadata)],
    );
  }
}
