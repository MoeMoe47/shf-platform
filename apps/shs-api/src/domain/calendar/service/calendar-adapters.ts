// SHF Ecosystem Phase 9 — Calendar source adapters.
//
// Each adapter: reads one canonical source via its own already-entitled
// service function, checks that domain's own view permission explicitly
// (several of these list functions — Assignments, Live Learning —
// perform only role-based branching and rely on their HTTP route's own
// requirePermission() middleware for the permission check itself; since
// this Projection Service aggregates six domains behind one route rather
// than one route per domain, each adapter re-asserts its own domain's
// permission directly, exactly mirroring what that domain's own route
// already requires), and maps the result into the normalized
// CalendarEventProjection contract. An actor lacking a given domain's
// view permission gets an empty list for that domain — an honest
// reflection of real entitlement boundaries (e.g. an instructor
// legitimately has no Project/Credential self-service view today), never
// an error.
//
// No adapter ever writes source truth, infers completion from dates, or
// invents a schedule the source domain doesn't already have.
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isStudentOnly } from "../../shared/audience-eligibility.js";
import { CalendarEventProjection, createProjectionId } from "../model/calendar-event.js";

import * as assignmentService from "../../assignments/service/assignment-service.js";
import * as liveLearningService from "../../live-learning/service/live-learning-service.js";
import * as careerEventService from "../../career-events/service/career-event-service.js";
import { toStudentFacingCareerEvent } from "../../career-events/model/career-event.js";
import * as opportunityService from "../../opportunities/service/opportunity-service.js";
import { toStudentFacingOpportunity } from "../../opportunities/model/opportunity.js";
import { ProjectService } from "../../projects/project-service.js";
import * as credentialService from "../../credentials/service/credential-service.js";

const projectService = new ProjectService();

export interface CalendarActor {
  user_id: string;
  organization_id: string;
  active_organization_id?: string;
  tenant_id?: string;
  roles: string[];
  permissions: string[];
}

function normalizedStatus(raw: string, confirmedValues: string[], cancelledValues: string[] = []): "confirmed" | "cancelled" | "tentative" {
  const upper = String(raw || "").toUpperCase();
  if (cancelledValues.map((v) => v.toUpperCase()).includes(upper)) return "cancelled";
  if (confirmedValues.map((v) => v.toUpperCase()).includes(upper)) return "confirmed";
  return "tentative";
}

export async function assignmentAdapter(actor: CalendarActor): Promise<CalendarEventProjection[]> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW)) return [];
  const items = await assignmentService.listForUser({ user_id: actor.user_id, organization_id: actor.organization_id, roles: actor.roles } as any);
  return items
    .filter((a: any) => a?.dueAt)
    .map((a: any): CalendarEventProjection => ({
      id: createProjectionId("assignment", a.id),
      sourceDomain: "assignment",
      sourceRecordId: a.id,
      type: "ASSIGNMENT_DUE",
      title: a.title,
      description: a.description || "",
      startsAt: a.dueAt,
      endsAt: null,
      dueAt: a.dueAt,
      allDay: false,
      sourceStatus: a.status,
      status: normalizedStatus(a.status, ["published"]),
      priority: "medium",
      actionUrl: "/curriculum/asl/assignments",
      pathwayRelevant: null,
      metadata: { assignmentId: a.id },
    }));
}

export async function liveLearningAdapter(actor: CalendarActor): Promise<CalendarEventProjection[]> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_VIEW)) return [];
  const items = await liveLearningService.listSessionsForActor({
    organizationId: actor.organization_id,
    actor: actor as any,
  } as any);
  return items
    .filter((s: any) => s?.startsAt && s.status !== "cancelled")
    .map((s: any): CalendarEventProjection => ({
      id: createProjectionId("live-learning", s.id),
      sourceDomain: "live-learning",
      sourceRecordId: s.id,
      type: "LIVE_SESSION",
      title: s.title,
      description: s.lessonId ? `Learning session for lesson ${s.lessonId}.` : "Scheduled Curriculum live learning session.",
      startsAt: s.startsAt,
      endsAt: s.endsAt || null,
      dueAt: null,
      allDay: false,
      sourceStatus: s.status,
      status: normalizedStatus(s.status, ["scheduled", "confirmed"]),
      priority: null,
      actionUrl: "/curriculum/live-sessions",
      pathwayRelevant: null,
      metadata: { liveSessionId: s.id, provider: s.provider },
    }));
}

export async function careerEventAdapter(actor: CalendarActor): Promise<CalendarEventProjection[]> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.CAREER_EVENT_VIEW)) return [];
  const raw = await careerEventService.listCareerEventsForActor(actor as any);
  const items = isStudentOnly(actor.roles) ? raw.map(toStudentFacingCareerEvent) : raw;
  return (items as any[])
    .filter((e) => e?.startsAt && e.status !== "CANCELLED")
    .map((e): CalendarEventProjection => ({
      id: createProjectionId("career-event", e.id),
      sourceDomain: "career-event",
      sourceRecordId: e.id,
      type: "CAREER_EVENT",
      title: e.title,
      description: e.description || "",
      startsAt: e.startsAt,
      endsAt: e.endsAt || null,
      dueAt: null,
      allDay: false,
      sourceStatus: e.status,
      status: normalizedStatus(e.status, ["PUBLISHED"]),
      priority: null,
      actionUrl: "/coach",
      pathwayRelevant: e.pathwayRelevant ?? null,
      metadata: {
        careerEventId: e.id,
        eventType: e.eventType,
        deliveryMode: e.deliveryMode,
        location: e.location,
        careerId: e.careerId ?? null,
        careerFamilyId: e.careerFamilyId ?? null,
      },
    }));
}

export async function opportunityAdapter(actor: CalendarActor): Promise<CalendarEventProjection[]> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.OPPORTUNITY_VIEW)) return [];
  const raw = await opportunityService.listOpportunitiesForActor(actor as any);
  const items = isStudentOnly(actor.roles) ? raw.map(toStudentFacingOpportunity) : raw;
  return (items as any[])
    .filter((o) => o?.applicationDeadline)
    .map((o): CalendarEventProjection => ({
      id: createProjectionId("opportunity", `${o.id}:deadline`),
      sourceDomain: "opportunity",
      sourceRecordId: o.id,
      type: "OPPORTUNITY_DEADLINE",
      title: o.title,
      description: o.description || "",
      startsAt: o.applicationDeadline,
      endsAt: null,
      dueAt: o.applicationDeadline,
      allDay: true,
      sourceStatus: o.status,
      status: normalizedStatus(o.status, ["OPEN"]),
      priority: "medium",
      actionUrl: o.actionRoute || null,
      pathwayRelevant: o.pathwayRelevant ?? null,
      metadata: { opportunityId: o.id, opportunityType: o.opportunityType, actionUrl: o.actionUrl, careerId: o.careerId ?? null, careerFamilyId: o.careerFamilyId ?? null },
    }));
}

export async function projectAdapter(actor: CalendarActor): Promise<CalendarEventProjection[]> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.PROJECT_VIEW)) return [];
  const items = await projectService.listScheduleForActor(actor as any);
  const events: CalendarEventProjection[] = [];
  for (const p of items as any[]) {
    const isCapstone = p.projectType === "CAPSTONE";
    const sourceStatus = normalizedStatus(p.status, ["ACTIVE"]);
    if (p.startsAt) {
      events.push({
        id: createProjectionId("project", `${p.id}:start`),
        sourceDomain: "project", sourceRecordId: p.id, type: "PROJECT_START",
        title: `${p.title} starts`, description: "", startsAt: p.startsAt, endsAt: null, dueAt: null,
        allDay: false, sourceStatus: p.status, status: sourceStatus, priority: null, actionUrl: null,
        pathwayRelevant: null, metadata: { projectId: p.id, projectType: p.projectType, projection: "start" },
      });
    }
    if (p.dueAt) {
      events.push({
        id: createProjectionId("project", `${p.id}:due`),
        sourceDomain: "project", sourceRecordId: p.id, type: "PROJECT_DUE",
        title: isCapstone ? `${p.title} due` : p.title, description: "", startsAt: p.dueAt, endsAt: null, dueAt: p.dueAt,
        allDay: false, sourceStatus: p.status, status: sourceStatus, priority: "medium", actionUrl: null,
        pathwayRelevant: null, metadata: { projectId: p.id, projectType: p.projectType, projection: "due" },
      });
    }
    if (p.presentationAt) {
      events.push({
        id: createProjectionId("project", `${p.id}:presentation`),
        sourceDomain: "project", sourceRecordId: p.id, type: "PROJECT_PRESENTATION",
        title: `${p.title} presentation`, description: "", startsAt: p.presentationAt, endsAt: null, dueAt: null,
        allDay: false, sourceStatus: p.status, status: sourceStatus, priority: null, actionUrl: null,
        pathwayRelevant: null, metadata: { projectId: p.id, projectType: p.projectType, projection: "presentation" },
      });
    }
  }
  return events;
}

export async function credentialAdapter(actor: CalendarActor): Promise<CalendarEventProjection[]> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW)) return [];
  const items = await credentialService.listCredentialsForActor(actor as any);
  const events: CalendarEventProjection[] = [];
  for (const c of items as any[]) {
    if (c.lifecycle === "REVOKED") continue;
    if (c.renewalDueAt) {
      events.push({
        id: createProjectionId("credential", `${c.id}:renewal`),
        sourceDomain: "credential", sourceRecordId: c.id, type: "CREDENTIAL_RENEWAL",
        title: `${c.definition.name} renewal due`, description: "", startsAt: c.renewalDueAt, endsAt: null, dueAt: c.renewalDueAt,
        allDay: true, sourceStatus: c.status, status: "confirmed", priority: "medium", actionUrl: null,
        pathwayRelevant: null, metadata: { learnerCredentialId: c.id, credentialDefinitionId: c.definition.id, projection: "renewal" },
      });
    }
    if (c.expiresAt) {
      events.push({
        id: createProjectionId("credential", `${c.id}:expiration`),
        sourceDomain: "credential", sourceRecordId: c.id, type: "CREDENTIAL_EXPIRATION",
        title: `${c.definition.name} expires`, description: "", startsAt: c.expiresAt, endsAt: null, dueAt: c.expiresAt,
        allDay: true, sourceStatus: c.status, status: c.lifecycle === "EXPIRED" ? "cancelled" : "confirmed", priority: null, actionUrl: null,
        pathwayRelevant: null, metadata: { learnerCredentialId: c.id, credentialDefinitionId: c.definition.id, projection: "expiration" },
      });
    }
  }
  return events;
}
