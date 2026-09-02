import { query } from "../../../db/client.js";
import type { LiveSession, LiveSessionStatus } from "../model/live-session.js";

function rowToSession(row: any): LiveSession {
  return {
    id: row.live_session_id,
    organizationId: row.organization_id,
    provider: row.provider,
    providerSessionId: row.provider_session_id,
    title: row.title,
    description: row.description,
    courseId: row.course_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    instructorId: row.instructor_id,
    cohortId: row.cohort_id,
    audienceScope: row.audience_scope || (row.cohort_id ? "COHORT" : "ORGANIZATION"),
    startsAt: row.starts_at instanceof Date ? row.starts_at.toISOString() : row.starts_at,
    endsAt: row.ends_at instanceof Date ? row.ends_at.toISOString() : row.ends_at,
    timezone: row.timezone,
    status: row.status,
    accessPolicy: row.access_policy_json,
    recordingPolicy: row.recording_policy_json,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    version: row.version,
  };
}

const SELECT_COLUMNS = `
  live_session_id, organization_id, provider, provider_session_id, title, description,
  course_id, module_id, lesson_id, instructor_id, cohort_id, audience_scope,
  starts_at, ends_at, timezone, status, access_policy_json, recording_policy_json,
  created_at, updated_at, version
`;

const SELECT_COLUMNS_ALIASED = `
  s.live_session_id, s.organization_id, s.provider, s.provider_session_id, s.title, s.description,
  s.course_id, s.module_id, s.lesson_id, s.instructor_id, s.cohort_id, s.audience_scope,
  s.starts_at, s.ends_at, s.timezone, s.status, s.access_policy_json, s.recording_policy_json,
  s.created_at, s.updated_at, s.version
`;

export class LiveSessionRepo {
  async confirmAttendance(joinEventId: string, organizationId: string) {
    const result = await query(
      `UPDATE live_session_join_events e SET attendance_status='attended'
       FROM live_sessions s
       WHERE e.join_event_id=$1 AND s.live_session_id=e.live_session_id
         AND s.organization_id=$2 AND e.decision='allow'
       RETURNING e.join_event_id, e.live_session_id, e.user_id, e.attendance_status, e.created_at, s.organization_id`,
      [joinEventId, organizationId],
    );
    return result.rows[0] || null;
  }

  async create(input: Omit<LiveSession, "createdAt" | "updatedAt" | "version">): Promise<LiveSession> {
    const res = await query(
      `INSERT INTO live_sessions (
        live_session_id, organization_id, provider, provider_session_id, title, description,
        course_id, module_id, lesson_id, instructor_id, cohort_id, audience_scope,
        starts_at, ends_at, timezone, status, access_policy_json, recording_policy_json
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb)
      RETURNING ${SELECT_COLUMNS}`,
      [
        input.id,
        input.organizationId,
        input.provider,
        input.providerSessionId,
        input.title,
        input.description,
        input.courseId,
        input.moduleId,
        input.lessonId,
        input.instructorId,
        input.cohortId,
        input.audienceScope,
        input.startsAt,
        input.endsAt,
        input.timezone,
        input.status,
        JSON.stringify(input.accessPolicy),
        JSON.stringify(input.recordingPolicy),
      ]
    );
    return rowToSession(res.rows[0]);
  }

  async getById(id: string): Promise<LiveSession | null> {
    const res = await query(
      `SELECT ${SELECT_COLUMNS} FROM live_sessions WHERE live_session_id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] ? rowToSession(res.rows[0]) : null;
  }

  async list(filters: { organizationId?: string; lessonId?: string; instructorId?: string; status?: LiveSessionStatus } = {}): Promise<LiveSession[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filters.organizationId) { params.push(filters.organizationId); clauses.push(`organization_id = $${params.length}`); }
    if (filters.lessonId) { params.push(filters.lessonId); clauses.push(`lesson_id = $${params.length}`); }
    if (filters.instructorId) { params.push(filters.instructorId); clauses.push(`instructor_id = $${params.length}`); }
    if (filters.status) { params.push(filters.status); clauses.push(`status = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const res = await query(
      `SELECT ${SELECT_COLUMNS} FROM live_sessions ${where} ORDER BY starts_at ASC`,
      params
    );
    return res.rows.map(rowToSession);
  }

  async listVisibleForStudent(filters: { organizationId: string; userId: string; lessonId?: string; instructorId?: string; status?: LiveSessionStatus }): Promise<LiveSession[]> {
    const clauses: string[] = [
      `s.organization_id = $1`,
      `(s.audience_scope = 'ORGANIZATION' OR EXISTS (
        SELECT 1
        FROM enrollments e
        WHERE e.organization_id = s.organization_id
          AND e.learner_user_id = $2
          AND e.status = 'ACTIVE'
          AND e.cohort_id = s.cohort_id
      ))`,
    ];
    const params: unknown[] = [filters.organizationId, filters.userId];
    if (filters.lessonId) { params.push(filters.lessonId); clauses.push(`s.lesson_id = $${params.length}`); }
    if (filters.instructorId) { params.push(filters.instructorId); clauses.push(`s.instructor_id = $${params.length}`); }
    if (filters.status) { params.push(filters.status); clauses.push(`s.status = $${params.length}`); }
    const res = await query(
      `SELECT ${SELECT_COLUMNS_ALIASED}
       FROM live_sessions s
       WHERE ${clauses.join(" AND ")}
       ORDER BY s.starts_at ASC`,
      params
    );
    return res.rows.map(rowToSession);
  }

  async listVisibleForInstructor(filters: { organizationId: string; userId: string; lessonId?: string; instructorId?: string; status?: LiveSessionStatus }): Promise<LiveSession[]> {
    const clauses: string[] = [
      `s.organization_id = $1`,
      `(s.instructor_id = $2 OR s.audience_scope = 'ORGANIZATION' OR EXISTS (
        SELECT 1
        FROM cohort_staff cs
        WHERE cs.organization_id = s.organization_id
          AND cs.cohort_id = s.cohort_id
          AND cs.user_id = $2
          AND cs.status = 'ACTIVE'
      ))`,
    ];
    const params: unknown[] = [filters.organizationId, filters.userId];
    if (filters.lessonId) { params.push(filters.lessonId); clauses.push(`s.lesson_id = $${params.length}`); }
    if (filters.instructorId) { params.push(filters.instructorId); clauses.push(`s.instructor_id = $${params.length}`); }
    if (filters.status) { params.push(filters.status); clauses.push(`s.status = $${params.length}`); }
    const res = await query(
      `SELECT ${SELECT_COLUMNS_ALIASED}
       FROM live_sessions s
       WHERE ${clauses.join(" AND ")}
       ORDER BY s.starts_at ASC`,
      params
    );
    return res.rows.map(rowToSession);
  }

  async updateStatus(id: string, status: LiveSessionStatus): Promise<LiveSession | null> {
    const res = await query(
      `UPDATE live_sessions SET status = $2, updated_at = NOW(), version = version + 1
       WHERE live_session_id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [id, status]
    );
    return res.rows[0] ? rowToSession(res.rows[0]) : null;
  }

  async setProviderSessionId(id: string, providerSessionId: string): Promise<void> {
    await query(
      `UPDATE live_sessions SET provider_session_id = $2, updated_at = NOW(), version = version + 1 WHERE live_session_id = $1`,
      [id, providerSessionId]
    );
  }

  async recordJoinEvent(input: {
    joinEventId: string;
    liveSessionId: string;
    userId: string;
    decision: "allow" | "deny";
    reason: string | null;
    attendanceStatus: string;
  }) {
    const res = await query(
      `INSERT INTO live_session_join_events (
        join_event_id, live_session_id, user_id, decision, reason, attendance_status
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING join_event_id, live_session_id, user_id, decision, reason, attendance_status, created_at`,
      [input.joinEventId, input.liveSessionId, input.userId, input.decision, input.reason, input.attendanceStatus]
    );
    return res.rows[0];
  }

  async listJoinEventsForSession(liveSessionId: string) {
    const res = await query(
      `SELECT join_event_id, live_session_id, user_id, decision, reason, attendance_status, created_at
       FROM live_session_join_events WHERE live_session_id = $1 ORDER BY created_at DESC`,
      [liveSessionId]
    );
    return res.rows;
  }

  async getLatestJoinEventForUser(liveSessionId: string, userId: string) {
    const res = await query(
      `SELECT join_event_id, live_session_id, user_id, decision, reason, attendance_status, created_at
       FROM live_session_join_events WHERE live_session_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [liveSessionId, userId]
    );
    return res.rows[0] || null;
  }
}
