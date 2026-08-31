import { createHash } from "node:crypto";
import { query } from "../../db/client.js";
import { withTransaction } from "../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions.js";
import { CAPSTONE_ROLE_BY_SPECIALIZATION } from "../programs/model/grade12-eligibility-policy.js";
import { isAdminTier } from "../shared/audience-eligibility.js";

// SHF Ecosystem Phase 6 — Calendar-facing Project schedule shape. Never
// includes submission payloads/artifact refs (that stays behind
// PROJECT_SUBMISSION_VIEW) — only enough to project a due date/milestone.
const SCHEDULE_COLUMNS = "project_id, organization_id, program_id, title, project_type, status, starts_at, due_at, presentation_at, created_by_user_id";
const SCHEDULE_COLUMNS_P = "p.project_id, p.organization_id, p.program_id, p.title, p.project_type, p.status, p.starts_at, p.due_at, p.presentation_at, p.created_by_user_id";
function toSchedule(row: any) {
  return {
    id: row.project_id,
    organizationId: row.organization_id,
    programId: row.program_id,
    title: row.title,
    projectType: row.project_type,
    status: row.status,
    startsAt: row.starts_at,
    dueAt: row.due_at,
    presentationAt: row.presentation_at,
    createdByUserId: row.created_by_user_id,
  };
}
function assertScheduleDatesValid(input: any) {
  const starts = input.starts_at ? new Date(input.starts_at) : null;
  const due = input.due_at ? new Date(input.due_at) : null;
  const presentation = input.presentation_at ? new Date(input.presentation_at) : null;
  for (const [label, value] of [["starts_at", starts], ["due_at", due], ["presentation_at", presentation]] as const) {
    if (value && Number.isNaN(value.getTime())) throw new Error(`invalid_date:${label}`);
  }
  if (starts && due && due < starts) throw new Error("invalid_date_range:due_before_start");
  if (due && presentation && presentation < due) throw new Error("invalid_date_range:presentation_before_due");
}

function scope(actor: any) { const userId=String(actor?.user_id||actor?.id||""); const organizationId=String(actor?.active_organization_id||actor?.organization_id||""); const tenantId=String(actor?.tenant_id||`tenant:${organizationId}`); if(!userId||!organizationId||tenantId!==`tenant:${organizationId}`) throw new Error("scope_missing"); return {userId,organizationId,tenantId}; }
function stable(...parts: string[]) { return createHash("sha256").update(parts.join("|"),"utf8").digest("hex").slice(0,32); }
export class ProjectService {
  constructor(private dbQuery: typeof query=query, private transaction=withTransaction) {}
  async create(actor:any,input:any) { if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_CREATE)) throw new Error("project_create_required"); const s=scope(actor); assertScheduleDatesValid(input); const projectId=`project_${stable(s.organizationId,String(input.title||""),new Date().toISOString())}`; const r=await this.dbQuery(`INSERT INTO projects (project_id,organization_id,tenant_id,program_id,course_id,title,project_type,status,starts_at,due_at,presentation_at,created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8,$9,$10,$11) RETURNING *`,[projectId,s.organizationId,s.tenantId,input.program_id||null,input.course_id||null,String(input.title||"Untitled project").slice(0,200),String(input.project_type||"EDUCATIONAL_PROJECT"),input.starts_at||null,input.due_at||null,input.presentation_at||null,s.userId]); return r.rows[0]; }
  async createTeam(actor:any,projectId:string,input:any) { if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_TEAM_MANAGE)) throw new Error("project_team_manage_required"); const s=scope(actor); const p=await this.dbQuery("SELECT * FROM projects WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3",[projectId,s.organizationId,s.tenantId]); if(!p.rows[0]) throw new Error("project_not_found"); const teamId=`team_${stable(projectId,String(input.mode||"COLLABORATIVE_MODE"))}`; const r=await this.dbQuery(`INSERT INTO project_teams (team_id,project_id,organization_id,tenant_id,mode,status) VALUES ($1,$2,$3,$4,$5,'ACTIVE') ON CONFLICT (team_id) DO UPDATE SET updated_at=NOW() RETURNING *`,[teamId,projectId,s.organizationId,s.tenantId,input.mode||"COLLABORATIVE_MODE"]); return r.rows[0]; }
  async addMember(actor:any,teamId:string,input:any) { if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_TEAM_MANAGE)) throw new Error("project_team_manage_required"); const s=scope(actor); const t=await this.dbQuery("SELECT team_id FROM project_teams WHERE team_id=$1 AND organization_id=$2 AND tenant_id=$3",[teamId,s.organizationId,s.tenantId]); if(!t.rows[0]) throw new Error("team_not_found"); const learner=await this.dbQuery("SELECT user_id FROM users WHERE user_id=$1 AND organization_id=$2",[input.learner_id,s.organizationId]); if(!learner.rows[0]) throw new Error("learner_not_found");
    // Educational roles are derived from the current institutional assignment;
    // client input cannot spoof a branch or capstone role.
    const assignment=await this.dbQuery("SELECT specialization_id FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND assignment_type='PRIMARY' AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1",[input.learner_id,s.organizationId,s.tenantId]);
    const specializationId=String(assignment.rows[0]?.specialization_id||""); const role=CAPSTONE_ROLE_BY_SPECIALIZATION[specializationId]; if(!role) throw new Error("active_specialization_assignment_required");
    const requestedSpecialization=String(input.specialization_id||""); if(requestedSpecialization && requestedSpecialization!==specializationId) throw new Error("specialization_assignment_mismatch");
    const r=await this.dbQuery(`INSERT INTO project_team_members (membership_id,team_id,learner_id,organization_id,tenant_id,specialization_id,role_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (team_id,learner_id) DO UPDATE SET left_at=NULL, specialization_id=EXCLUDED.specialization_id, role_id=EXCLUDED.role_id RETURNING *`,[`membership_${stable(teamId,String(input.learner_id))}`,teamId,input.learner_id,s.organizationId,s.tenantId,specializationId,role]); return r.rows[0]; }
  async submit(actor:any,teamId:string,input:any) { if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_WRITE)) throw new Error("project_submission_write_required"); const s=scope(actor); return this.transaction(async(db:any)=>{ const t=await db.query("SELECT project_id FROM project_teams WHERE team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' FOR UPDATE",[teamId,s.organizationId,s.tenantId]); if(!t.rows[0]) throw new Error("team_not_found"); const member=await db.query("SELECT membership_id FROM project_team_members WHERE team_id=$1 AND learner_id=$2 AND organization_id=$3 AND tenant_id=$4 AND left_at IS NULL",[teamId,s.userId,s.organizationId,s.tenantId]); if(!member.rows[0]) throw new Error("team_membership_required"); const requestedVersion=input?.version===undefined?null:Number(input.version); if(requestedVersion!==null&&(!Number.isInteger(requestedVersion)||requestedVersion<1)) throw new Error("invalid_submission_version"); const n=requestedVersion===null?await db.query("SELECT COALESCE(MAX(version),0)+1 AS version FROM project_submissions WHERE team_id=$1",[teamId]):{rows:[{version:requestedVersion}]}; const version=Number(n.rows[0].version); const existing=await db.query("SELECT submission_id FROM project_submissions WHERE team_id=$1 AND version=$2",[teamId,version]); if(existing.rows[0]) throw new Error("submission_version_conflict"); const r=await db.query(`INSERT INTO project_submissions (submission_id,project_id,team_id,organization_id,tenant_id,submitted_by_user_id,version,payload_json,artifact_refs_json,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'SUBMITTED') RETURNING *`,[`submission_${stable(teamId,String(version))}`,t.rows[0].project_id,teamId,s.organizationId,s.tenantId,s.userId,version,JSON.stringify(input.payload||{}),JSON.stringify(input.artifact_refs||[])]); return r.rows[0]; }); }
  async list(actor:any,projectId:string) { const s=scope(actor); if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_VIEW)&&!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_TEAM_MANAGE)) throw new Error("project_submission_view_required"); const project=await this.dbQuery("SELECT project_id FROM projects WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3",[projectId,s.organizationId,s.tenantId]); if(!project.rows[0]) throw new Error("project_not_found"); const r=await this.dbQuery("SELECT * FROM project_submissions WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY version",[projectId,s.organizationId,s.tenantId]); return r.rows; }
  async review(actor:any,submissionId:string,status:string) { if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW)) throw new Error("project_submission_review_required"); const s=scope(actor); if(!["ACCEPTED","NEEDS_REVISION"].includes(status)) throw new Error("invalid_project_review"); const r=await this.dbQuery("UPDATE project_submissions SET status=$2 WHERE submission_id=$1 AND organization_id=$3 AND tenant_id=$4 RETURNING *",[submissionId,status,s.organizationId,s.tenantId]); if(!r.rows[0]) throw new Error("submission_not_found"); return r.rows[0]; }

  // SHF Ecosystem Phase 6 — Calendar-facing schedule reads. Admin-tier
  // (org_admin/program_manager/super_admin) sees every non-DRAFT-or-DRAFT
  // Project in the organization (mirrors the existing broad admin
  // visibility pattern used by Career Events/Opportunities). A student
  // sees only Projects where they hold an ACTIVE (left_at IS NULL) team
  // membership, and never a DRAFT Project — DRAFT means "not yet
  // assigned," identical to the DRAFT-hidden-except-creator/admin rule
  // already established for Career Events and Opportunities.
  async listScheduleForActor(actor:any) {
    if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_VIEW)) throw new Error("project_view_required");
    const s=scope(actor);
    if (isAdminTier(actor?.roles||[])) {
      const r=await this.dbQuery(`SELECT ${SCHEDULE_COLUMNS} FROM projects WHERE organization_id=$1 AND tenant_id=$2 ORDER BY due_at ASC NULLS LAST`,[s.organizationId,s.tenantId]);
      return r.rows.map(toSchedule);
    }
    const r=await this.dbQuery(
      `SELECT DISTINCT ${SCHEDULE_COLUMNS_P} FROM projects p
       JOIN project_teams t ON t.project_id = p.project_id
       JOIN project_team_members m ON m.team_id = t.team_id
       WHERE p.organization_id=$1 AND p.tenant_id=$2 AND p.status != 'DRAFT'
         AND m.learner_id=$3 AND m.left_at IS NULL
       ORDER BY p.due_at ASC NULLS LAST`,
      [s.organizationId,s.tenantId,s.userId],
    );
    return r.rows.map(toSchedule);
  }

  async getScheduleForActor(actor:any,projectId:string) {
    if(!hasPermission(actor?.permissions,SHS_SECURITY_PERMISSIONS.PROJECT_VIEW)) throw new Error("project_view_required");
    const s=scope(actor);
    const project=await this.dbQuery(`SELECT ${SCHEDULE_COLUMNS} FROM projects WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3`,[projectId,s.organizationId,s.tenantId]);
    if(!project.rows[0]) return null;
    if (isAdminTier(actor?.roles||[])) return toSchedule(project.rows[0]);
    if (project.rows[0].status === "DRAFT") return null;
    const member=await this.dbQuery(
      `SELECT 1 FROM project_teams t JOIN project_team_members m ON m.team_id = t.team_id
       WHERE t.project_id=$1 AND m.learner_id=$2 AND m.left_at IS NULL LIMIT 1`,
      [projectId,s.userId],
    );
    if(!member.rows[0]) return null;
    return toSchedule(project.rows[0]);
  }
}
