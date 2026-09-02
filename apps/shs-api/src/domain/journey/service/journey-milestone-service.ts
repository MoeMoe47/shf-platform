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

export type JourneyMilestoneType = "PROGRAM_START" | "PROJECT" | "CAPSTONE" | "CAREER_EVENT" | "CREDENTIAL_EARNED" | "ARCADE_MASTERY" | "LESSON_COMPLETED" | "UNIT_COMPLETED" | "COURSE_COMPLETED" | "COMPETENCY_DEMONSTRATED" | "EVIDENCE_VERIFIED";

export interface JourneyMilestone {
  id: string;
  type: JourneyMilestoneType;
  title: string;
  occursAt: string;
  // "completed" is only ever set from the owning domain's own status —
  // never from date passage alone (see brief §22: displayed != verified).
  status: "completed" | "upcoming";
  organizationId?: string;
  learnerId?: string;
  sourceDomain?: string;
  sourceRecordId?: string;
  assignmentId?: string | null;
  curriculumReleaseId?: string | null;
  releaseVersion?: number | null;
  competencyId?: string | null;
  verificationStatus?: "VERIFIED";
  tier?: "ACKNOWLEDGEMENT" | "ACHIEVEMENT" | "MAJOR_MILESTONE";
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

type CurriculumCompletionRow = {
  completion_id: string;
  lesson_id: string;
  completed_at: string | Date;
  assignment_id: string | null;
  curriculum_release_id: string | null;
  release_version: number | null;
  course_id: string;
  course_title: string;
  unit_stable_key: string;
  unit_title: string;
  lesson_stable_key: string;
  lesson_title: string;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

// Completion milestones are a projection of the existing completion table.
// The release snapshot and catalog joins establish instructional lineage;
// no denominator or completion fact is created here.
async function curriculumCompletionMilestones(organizationId: string, userId: string): Promise<JourneyMilestone[]> {
  const result = await query(
    `SELECT c.completion_id, c.lesson_id, c.completed_at, c.assignment_id,
            c.curriculum_release_id, c.release_version,
            cr.course_id, cc.title AS course_title,
            cu.stable_key AS unit_stable_key, cu.title AS unit_title,
            cl.stable_key AS lesson_stable_key, cl.title AS lesson_title
       FROM curriculum_lesson_completions c
       LEFT JOIN curriculum_releases cr
         ON cr.release_id = c.curriculum_release_id AND cr.organization_id = c.organization_id
       LEFT JOIN curriculum_courses cc
         ON cc.course_id = cr.course_id AND cc.organization_id = c.organization_id
       LEFT JOIN curriculum_lessons cl
         ON cl.organization_id = c.organization_id
        AND (cl.lesson_id = c.lesson_id OR cl.stable_key = c.lesson_id)
       LEFT JOIN curriculum_units cu
         ON cu.unit_id = cl.unit_id AND cu.organization_id = c.organization_id
      WHERE c.organization_id=$1 AND c.user_id=$2
        AND c.curriculum_release_id IS NOT NULL
      ORDER BY c.completed_at ASC, c.completion_id ASC`,
    [organizationId, userId],
  );
  const rows = result.rows as CurriculumCompletionRow[];
  const milestones: JourneyMilestone[] = rows.map((row) => ({
    id: `lesson:${row.completion_id}:completed`,
    type: "LESSON_COMPLETED",
    title: row.lesson_title || row.lesson_id,
    occursAt: iso(row.completed_at),
    status: "completed",
    organizationId,
    learnerId: userId,
    sourceDomain: "curriculum",
    sourceRecordId: row.completion_id,
    assignmentId: row.assignment_id,
    curriculumReleaseId: row.curriculum_release_id,
    releaseVersion: row.release_version,
    verificationStatus: "VERIFIED",
  }));

  // Aggregate only complete canonical release scopes. A course/unit
  // milestone is intentionally absent until every lesson in that same
  // immutable release snapshot has a matching canonical completion.
  const groups = new Map<string, { rows: CurriculumCompletionRow[] }>();
  for (const row of rows) {
    if (!row.curriculum_release_id || !row.course_id || !row.unit_stable_key || !row.lesson_stable_key) continue;
    const key = `${row.curriculum_release_id}\u0000${row.assignment_id || "unassigned"}`;
    const group = groups.get(key) || { rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  for (const [key, group] of groups) {
    const [releaseId, assignmentKey] = key.split("\u0000", 2);
    const releaseResult = await query("SELECT snapshot FROM curriculum_releases WHERE organization_id=$1 AND release_id=$2", [organizationId, releaseId]);
    const snapshot: any = releaseResult.rows[0]?.snapshot;
    const units: any[] = Array.isArray(snapshot?.units) ? snapshot.units : [];
    const completedAt = group.rows.reduce((latest, row) => Math.max(latest, new Date(row.completed_at).getTime()), 0);
    const latest = group.rows[group.rows.length - 1];
    let allCourseLessons = units.flatMap((unit) => (Array.isArray(unit.lessons) ? unit.lessons : []).map((lesson: any) => `${unit.stableKey}:${lesson.stableKey}`));
    const completedCourseLessons = new Set(group.rows.map((row) => `${row.unit_stable_key}:${row.lesson_stable_key}`));
    if (allCourseLessons.length > 0 && allCourseLessons.every((lesson) => completedCourseLessons.has(lesson))) {
      milestones.push({
        id: `course:${releaseId}:${assignmentKey}:completed`, type: "COURSE_COMPLETED",
        title: snapshot.course?.title || latest.course_title || "Course completed", occursAt: new Date(completedAt).toISOString(), status: "completed",
        organizationId, learnerId: userId, sourceDomain: "curriculum", sourceRecordId: releaseId,
        assignmentId: latest.assignment_id, curriculumReleaseId: releaseId, releaseVersion: latest.release_version,
        verificationStatus: "VERIFIED",
      });
    }
    for (const unit of units) {
      const unitLessons: any[] = Array.isArray(unit.lessons) ? unit.lessons : [];
      if (!unitLessons.length || !unitLessons.every((lesson) => completedCourseLessons.has(`${unit.stableKey}:${lesson.stableKey}`))) continue;
      milestones.push({
        id: `unit:${releaseId}:${unit.stableKey}:${assignmentKey}:completed`, type: "UNIT_COMPLETED",
        title: unit.title || unit.stableKey, occursAt: new Date(completedAt).toISOString(), status: "completed",
        organizationId, learnerId: userId, sourceDomain: "curriculum", sourceRecordId: `${releaseId}:${unit.stableKey}`,
        assignmentId: latest.assignment_id, curriculumReleaseId: releaseId, releaseVersion: latest.release_version,
        verificationStatus: "VERIFIED",
      });
    }
  }
  return milestones;
}

async function verifiedEvidenceMilestones(organizationId: string, userId: string): Promise<JourneyMilestone[]> {
  const result = await query(
    `SELECT e.evidence_id, e.source_occurred_at, e.assignment_id, e.curriculum_release_id,
            e.release_version, e.competency_id, e.source_type, e.source_record_id,
            d.decision, d.reviewed_at, c.title AS competency_title
       FROM prepare_prove_evidence e
       JOIN learner_competency_decisions d ON d.evidence_id=e.evidence_id
       LEFT JOIN competency_definitions c ON c.competency_id=e.competency_id
      WHERE e.organization_id=$1 AND e.user_id=$2 AND e.status='REVIEWED'
        AND d.decision='DEMONSTRATED'
      ORDER BY COALESCE(d.reviewed_at, e.source_occurred_at, e.created_at) ASC, e.evidence_id ASC`,
    [organizationId, userId],
  );
  const milestones: JourneyMilestone[] = [];
  for (const row of result.rows as any[]) {
    const occurredAt = row.reviewed_at || row.source_occurred_at;
    if (!occurredAt) continue;
    const common = {
      occursAt: iso(occurredAt), status: "completed" as const, organizationId, learnerId: userId,
      sourceDomain: "verified-evidence", sourceRecordId: row.evidence_id,
      assignmentId: row.assignment_id, curriculumReleaseId: row.curriculum_release_id,
      releaseVersion: row.release_version, competencyId: row.competency_id,
      verificationStatus: "VERIFIED" as const,
    };
    milestones.push({ id: `evidence:${row.evidence_id}:verified`, type: "EVIDENCE_VERIFIED", title: "Evidence verified", ...common });
    if (row.competency_id) milestones.push({ id: `competency:${row.competency_id}:${row.evidence_id}:demonstrated`, type: "COMPETENCY_DEMONSTRATED", title: row.competency_title || "Competency demonstrated", ...common });
  }
  return milestones;
}

export async function listJourneyMilestonesForLearner(actor: { organization_id: string; user_id: string }): Promise<JourneyMilestone[]> {
  const [programStart, projects, careerEvents, credentials, arcadeMastery, curriculumCompletions, verifiedEvidence] = await Promise.all([
    programStartMilestones(actor.organization_id, actor.user_id),
    projectMilestones(actor.organization_id, actor.user_id),
    careerEventMilestones(actor.organization_id, actor.user_id),
    credentialMilestones(actor.organization_id, actor.user_id),
    arcadeMasteryMilestones(actor.organization_id, actor.user_id),
    curriculumCompletionMilestones(actor.organization_id, actor.user_id),
    verifiedEvidenceMilestones(actor.organization_id, actor.user_id),
  ]);
  return [...programStart, ...projects, ...careerEvents, ...credentials, ...arcadeMastery, ...curriculumCompletions, ...verifiedEvidence].sort(
    (a, b) => new Date(a.occursAt).getTime() - new Date(b.occursAt).getTime(),
  );
}
