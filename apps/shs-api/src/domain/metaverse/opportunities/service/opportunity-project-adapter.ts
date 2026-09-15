// MET-8 — governed project/assignment creation boundary (build brief §13).
//
// Audit finding: apps/shs-api/src/domain/projects (generic Project/Team/
// Submission) gates team membership on an ACTIVE capstone specialization
// assignment (CAPSTONE_ROLE_BY_SPECIALIZATION) — narrower than the general
// student population an Opportunity Award can reach. apps/shs-api/src/
// domain/studio (StudioProjectService) is narrower still: only WEBSITE/
// AI_AGENT project types, assignment- or student-idea-origin only. Neither
// is safely composable as-is for an arbitrary Opportunity award (P1: unify
// once team/project authority generalizes past capstone — see MET-8 doc).
//
// This adapter is therefore intentionally bounded: the Award record itself
// (work_scope_snapshot/deliverables_snapshot/due_date/status) is the
// durable execution record for this phase. As a best-effort, non-blocking
// convenience, when the awarding sponsor actor already holds
// project.create (org_admin/program_manager), this adapter also projects
// a real schedule-visible row into the canonical `projects` table so it
// shows up on /projects/schedule — but award creation never depends on
// this succeeding, and it is never attempted for a sponsor who lacks the
// permission (no permission escalation is performed on the sponsor's
// behalf).
import { ProjectService } from "../../../projects/project-service.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";

const projectService = new ProjectService();

export interface AwardProjectContext {
  title: string;
  dueDate: string;
  opportunityType: string;
}

/** Returns a projects.project_id on success, or null when not attempted/not composable. Never throws. */
export async function tryProjectScheduleProjection(sponsorActor: any, context: AwardProjectContext): Promise<string | null> {
  if (!hasPermission(sponsorActor?.permissions || [], SHS_SECURITY_PERMISSIONS.PROJECT_CREATE)) return null;
  try {
    const created = await projectService.create(sponsorActor, {
      title: context.title,
      project_type: `OPPORTUNITY_${context.opportunityType}`,
      due_at: context.dueDate,
    });
    return created?.project_id || null;
  } catch {
    // Best-effort only — an award is always valid without a schedule projection.
    return null;
  }
}
