// SHF Ecosystem Phase 6/7 — Journey Milestones projection.
//
// Journey Milestones is a read-only PROJECTION over canonical facts from
// Enrollment, Projects, Career Events, and (as of Phase 7) Credentials.
// It is never a second source of institutional truth: it invents no
// dates, no statuses, and no milestone types beyond what a real producer
// already backs. ASSESSMENT/PORTFOLIO milestone types remain deliberately
// unimplemented — no canonical producer exists for them yet (see
// docs/SHF_PROJECT_PORTFOLIO_CAPSTONE_JOURNEY_INTEGRATION.md and
// docs/SHF_CREDENTIAL_ARCHITECTURE.md) — and must stay absent rather than
// fabricated.
import { query } from "../../../db/client.js";
import { CareerEventRepo } from "../../career-events/repo/career-event-repo.js";
import { LearnerCredentialRepo } from "../../credentials/repo/learner-credential-repo.js";
import { CredentialDefinitionRepo } from "../../credentials/repo/credential-definition-repo.js";
import { ArcadeRepo } from "../../arcade/repo/arcade-repo.js";

const careerEventRepo = new CareerEventRepo();
const learnerCredentialRepo = new LearnerCredentialRepo();
const credentialDefinitionRepo = new CredentialDefinitionRepo();
const arcadeRepo = new ArcadeRepo();

export type JourneyMilestoneType = "PROGRAM_START" | "PROJECT" | "CAPSTONE" | "CAREER_EVENT" | "CREDENTIAL_EARNED" | "ARCADE_MASTERY";

export interface JourneyMilestone {
  id: string;
  type: JourneyMilestoneType;
  title: string;
  occursAt: string;
  // "completed" is only ever set from the owning domain's own status —
  // never from date passage alone (see brief §22: displayed != verified).
  status: "completed" | "upcoming";
}

function isPast(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

async function programStartMilestones(organizationId: string, userId: string): Promise<JourneyMilestone[]> {
  const res = await query(
    `SELECT e.enrollment_id, e.starts_at, p.name AS program_name
     FROM enrollments e
     JOIN programs p ON p.program_id = e.program_id AND p.organization_id = e.organization_id
     WHERE e.organization_id=$1 AND e.learner_user_id=$2 AND e.status='ACTIVE'
     ORDER BY e.starts_at ASC`,
    [organizationId, userId],
  );
  return res.rows.map((row: any) => ({
    id: `program-start:${row.enrollment_id}`,
    type: "PROGRAM_START" as const,
    title: `Started ${row.program_name}`,
    occursAt: row.starts_at instanceof Date ? row.starts_at.toISOString() : row.starts_at,
    status: isPast(row.starts_at) ? "completed" : "upcoming",
  }));
}

async function projectMilestones(organizationId: string, userId: string): Promise<JourneyMilestone[]> {
  // Only the learner's own ACTIVE team memberships, never every
  // organization Project — identical entitlement rule to
  // ProjectService.listScheduleForActor's student branch. DRAFT Projects
  // are excluded (not yet assigned to the learner in any real sense).
  // DISTINCT on Project identity alone (never team_id) — a learner who
  // belongs to two different teams on the same Project (a real, allowed
  // shape) must still produce exactly one PROJECT/CAPSTONE milestone, not
  // one per team.
  const res = await query(
    `SELECT DISTINCT p.project_id, p.title, p.project_type, p.due_at, p.presentation_at
     FROM projects p
     JOIN project_teams t ON t.project_id = p.project_id
     JOIN project_team_members m ON m.team_id = t.team_id
     WHERE p.organization_id=$1 AND p.status != 'DRAFT' AND m.learner_id=$2 AND m.left_at IS NULL
       AND (p.due_at IS NOT NULL OR p.presentation_at IS NOT NULL)`,
    [organizationId, userId],
  );
  const milestones: JourneyMilestone[] = [];
  for (const row of res.rows) {
    const type: JourneyMilestoneType = row.project_type === "CAPSTONE" ? "CAPSTONE" : "PROJECT";
    // Completion truth lives in project_submissions.status ('ACCEPTED') on
    // any of the learner's own teams for this Project — never in whether
    // due_at/presentation_at has merely passed.
    const accepted = await query(
      `SELECT 1 FROM project_submissions s
       JOIN project_team_members m ON m.team_id = s.team_id
       WHERE s.project_id=$1 AND m.learner_id=$2 AND m.left_at IS NULL AND s.status='ACCEPTED' LIMIT 1`,
      [row.project_id, userId],
    );
    const status: "completed" | "upcoming" = accepted.rows[0] ? "completed" : "upcoming";
    if (row.due_at) {
      milestones.push({
        id: `project:${row.project_id}:due`,
        type,
        title: row.title,
        occursAt: row.due_at instanceof Date ? row.due_at.toISOString() : row.due_at,
        status,
      });
    }
    if (row.presentation_at) {
      milestones.push({
        id: `project:${row.project_id}:presentation`,
        type,
        title: `${row.title} — Presentation`,
        occursAt: row.presentation_at instanceof Date ? row.presentation_at.toISOString() : row.presentation_at,
        status,
      });
    }
  }
  return milestones;
}

async function careerEventMilestones(organizationId: string, userId: string): Promise<JourneyMilestone[]> {
  const events = await careerEventRepo.listVisibleForStudent(organizationId, userId);
  return events.map((event) => ({
    id: `career-event:${event.id}:milestone`,
    type: "CAREER_EVENT" as const,
    title: event.title,
    occursAt: event.startsAt,
    // COMPLETED is a real status in CAREER_EVENT_STATUSES — never derived
    // from date passage; a PUBLISHED event whose date has passed but was
    // never transitioned to COMPLETED stays "upcoming" here rather than
    // guessing.
    status: event.status === "COMPLETED" ? "completed" : "upcoming",
  }));
}

// SHF Ecosystem Phase 7 — a credential-earned milestone requires the
// stored status to be 'ISSUED' (never derived from eligibility, and
// never a REVOKED row). Its occursAt is issued_at — the one real,
// canonical timestamp for the achievement itself. Expiration does not
// remove this milestone: "expiration does not delete issuance history"
// (see docs/SHF_CREDENTIAL_ARCHITECTURE.md) — the learner did earn it,
// regardless of whether it has since lapsed.
async function credentialMilestones(organizationId: string, userId: string): Promise<JourneyMilestone[]> {
  const credentials = await learnerCredentialRepo.listForLearner(organizationId, userId);
  const milestones: JourneyMilestone[] = [];
  for (const credential of credentials) {
    if (credential.status !== "ISSUED") continue;
    const definition = await credentialDefinitionRepo.getById(credential.credentialDefinitionId);
    if (!definition) continue;
    milestones.push({
      id: `credential:${credential.id}:earned`,
      type: "CREDENTIAL_EARNED",
      title: definition.name,
      occursAt: credential.issuedAt,
      status: "completed",
    });
  }
  return milestones;
}

// SHF Ecosystem Phase 8 — an Arcade mastery milestone requires a real,
// stored arcade_results.mastery_achieved=true row for that Activity —
// never merely an attempt, a launch, or a raw score below the Activity's
// own threshold. The first time a learner masters a given Activity is the
// milestone; repeated re-mastery of the same Activity does not produce a
// second one (DISTINCT ON in the repo query already collapses this).
async function arcadeMasteryMilestones(organizationId: string, userId: string): Promise<JourneyMilestone[]> {
  const mastered = await arcadeRepo.listMasteredActivitiesForLearner(organizationId, userId);
  const milestones: JourneyMilestone[] = [];
  for (const entry of mastered) {
    const activity = await arcadeRepo.getActivityById(entry.arcadeActivityId);
    if (!activity) continue;
    milestones.push({
      id: `arcade:${activity.id}:mastery`,
      type: "ARCADE_MASTERY",
      title: `Mastered ${activity.title}`,
      occursAt: entry.achievedAt,
      status: "completed",
    });
  }
  return milestones;
}

export async function listJourneyMilestonesForLearner(actor: { organization_id: string; user_id: string }): Promise<JourneyMilestone[]> {
  const [programStart, projects, careerEvents, credentials, arcadeMastery] = await Promise.all([
    programStartMilestones(actor.organization_id, actor.user_id),
    projectMilestones(actor.organization_id, actor.user_id),
    careerEventMilestones(actor.organization_id, actor.user_id),
    credentialMilestones(actor.organization_id, actor.user_id),
    arcadeMasteryMilestones(actor.organization_id, actor.user_id),
  ]);
  return [...programStart, ...projects, ...careerEvents, ...credentials, ...arcadeMastery].sort(
    (a, b) => new Date(a.occursAt).getTime() - new Date(b.occursAt).getTime(),
  );
}
