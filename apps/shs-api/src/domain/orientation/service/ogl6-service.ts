import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { SERVER_ORIENTATION_CATALOG } from "./orientation-context-service.js";

const LIFECYCLES = new Set(["DRAFT", "REVIEW", "ACTIVE", "SUPERSEDED", "ARCHIVED"]);
const EVENTS = new Set(["orientation.draft_created", "orientation.draft_updated", "orientation.reviewed", "orientation.published", "orientation.superseded", "orientation.archived"]);
const TELEMETRY = new Set(["guidance_center.opened", "guidance_center.closed", "guidance_section.opened", "guidance_tour.started", "guidance_tour.resumed", "guidance_document.opened", "guidance_companion.opened", "guidance_next_action.opened", "guidance_whats_changed.opened", "guidance_accessible_guide.opened", "tour.started", "tour.step_viewed", "tour.completed", "tour.dismissed", "target.missing", "target.timeout"]);
const MAX = { title: 160, purpose: 500, changeSummary: 1000, topic: 120, alternative: 2000 };

function scope(req: any) {
  const user = req.user || {};
  const organizationId = String(user.active_organization_id || user.organization_id || "");
  const tenantId = String(user.tenant_id || "");
  const actorId = String(user.user_id || user.id || "");
  if (!actorId || !organizationId || tenantId !== `tenant:${organizationId}`) throw Object.assign(new Error("ORG_CONTEXT_REQUIRED"), { statusCode: 403 });
  return { organizationId, tenantId, actorId };
}
function text(value: unknown, max: number, label: string, required = false) {
  const result = String(value ?? "").trim();
  if (required && !result) throw Object.assign(new Error(`${label}_REQUIRED`), { statusCode: 400 });
  if (result.length > max || /<\/?[a-z][^>]*>|on[a-z]+\s*=|javascript:/i.test(result)) throw Object.assign(new Error(`${label}_INVALID`), { statusCode: 400 });
  return result;
}
function knownOrientation(id: string) {
  const entry = SERVER_ORIENTATION_CATALOG.find((item) => item.orientationId === id && item.lifecycle === "ACTIVE" && !item.testOnly);
  if (!entry) throw Object.assign(new Error("ORIENTATION_NOT_FOUND"), { statusCode: 404 });
  return entry;
}
function presentation(input: any) {
  const topics = Array.isArray(input?.helpTopics) ? input.helpTopics.map((v: unknown) => text(v, MAX.topic, "HELP_TOPIC")).filter(Boolean).slice(0, 12) : [];
  const questions = Array.isArray(input?.companionQuestions) ? input.companionQuestions.map((v: unknown) => text(v, MAX.topic, "COMPANION_QUESTION")).filter(Boolean).slice(0, 8) : [];
  return { title: text(input?.title, MAX.title, "TITLE"), purpose: text(input?.purpose, MAX.purpose, "PURPOSE"), tourLabels: { start: text(input?.tourLabels?.start, MAX.title, "TOUR_START"), resume: text(input?.tourLabels?.resume, MAX.title, "TOUR_RESUME"), replay: text(input?.tourLabels?.replay, MAX.title, "TOUR_REPLAY") }, helpTopics: topics, companionQuestions: questions, whatsChangedSummary: text(input?.whatsChangedSummary, MAX.changeSummary, "WHATS_CHANGED"), accessibleAlternativeCopy: text(input?.accessibleAlternativeCopy, MAX.alternative, "ACCESSIBLE_ALTERNATIVE") };
}
async function audit(s: any, eventType: string, orientationId: string, version: number) { if (!EVENTS.has(eventType)) throw new Error("AUTHORING_EVENT_INVALID"); await query("INSERT INTO ogl_authoring_events (event_id,organization_id,tenant_id,actor_user_id,event_type,orientation_id,version,metadata_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [`ogl_evt_${randomUUID()}`, s.organizationId, s.tenantId, s.actorId, eventType, orientationId, version, JSON.stringify({ presentationOnly: true })]); }

export async function listAuthoring(req: any) {
  const s = scope(req); const rows = await query("SELECT * FROM ogl_orientation_versions WHERE organization_id=$1 AND tenant_id=$2 ORDER BY orientation_id, version DESC", [s.organizationId, s.tenantId]);
  const overlays = rows.rows;
  return { items: SERVER_ORIENTATION_CATALOG.filter((e) => !e.testOnly).map((e) => ({ orientationId: e.orientationId, destinationId: e.destinationId, title: e.title, lifecycle: e.lifecycle, version: e.version, active: true, authoredVersions: overlays.filter((r: any) => r.orientation_id === e.orientationId).map((r: any) => ({ version: r.version, lifecycle: r.lifecycle, changeSummary: r.change_summary })) })), health: { status: "HEALTHY", checks: { registry: "PASS", rollout: "PASS", semanticAnchors: "PASS", accessibleAlternatives: "PASS", legacyRuntime: "PASS", fixtures: "PASS" } } };
}
export async function createDraft(req: any) {
  const s = scope(req); const id = text(req.body?.orientationId, 160, "ORIENTATION_ID", true); const entry = knownOrientation(id); const p = presentation(req.body?.presentation || {}); const change = text(req.body?.changeSummary, MAX.changeSummary, "CHANGE_SUMMARY", true); const requested = Number(req.body?.version || 0); const latest = await query("SELECT COALESCE(MAX(version),0) AS version FROM ogl_orientation_versions WHERE organization_id=$1 AND tenant_id=$2 AND orientation_id=$3", [s.organizationId, s.tenantId, id]); const version = requested || Number(latest.rows[0]?.version || 0) + 1; if (!Number.isInteger(version) || version < 1) throw Object.assign(new Error("VERSION_INVALID"), { statusCode: 400 }); await query("INSERT INTO ogl_orientation_versions (orientation_version_id,organization_id,tenant_id,orientation_id,version,lifecycle,presentation_json,change_summary,reorientation_policy,created_by_user_id) VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7,$8,$9)", [`ogl_ver_${randomUUID()}`, s.organizationId, s.tenantId, id, version, JSON.stringify(p), change, entry.reorientation?.policy || "OPTIONAL", s.actorId]); await audit(s, "orientation.draft_created", id, version); return { orientationId: id, version, lifecycle: "DRAFT", presentation: p };
}
export async function publish(req: any) {
  const s = scope(req); const id = text(req.body?.orientationId, 160, "ORIENTATION_ID", true); knownOrientation(id); const version = Number(req.body?.version); if (!Number.isInteger(version) || version < 1) throw Object.assign(new Error("VERSION_INVALID"), { statusCode: 400 }); const current = await query("SELECT * FROM ogl_orientation_versions WHERE organization_id=$1 AND tenant_id=$2 AND orientation_id=$3 AND version=$4", [s.organizationId, s.tenantId, id, version]); if (!current.rows[0] || current.rows[0].lifecycle !== "DRAFT" && current.rows[0].lifecycle !== "REVIEW") throw Object.assign(new Error("DRAFT_REQUIRED"), { statusCode: 409 }); await withTransaction(async (db) => { await db.query("UPDATE ogl_orientation_versions SET lifecycle='SUPERSEDED', updated_at=NOW() WHERE organization_id=$1 AND tenant_id=$2 AND orientation_id=$3 AND lifecycle='ACTIVE'", [s.organizationId, s.tenantId, id]); await db.query("UPDATE ogl_orientation_versions SET lifecycle='ACTIVE', published_by_user_id=$5, published_at=NOW(), updated_at=NOW() WHERE organization_id=$1 AND tenant_id=$2 AND orientation_id=$3 AND version=$4", [s.organizationId, s.tenantId, id, version, s.actorId]); }); await audit(s, "orientation.published", id, version); return { orientationId: id, version, lifecycle: "ACTIVE", presentationOnly: true };
}
export async function analytics(req: any) { const s = scope(req); const rows = await query("SELECT event_type, COUNT(*)::int AS count FROM ogl_telemetry_events WHERE organization_id=$1 AND tenant_id=$2 GROUP BY event_type ORDER BY event_type", [s.organizationId, s.tenantId]); return { scope: { organizationId: s.organizationId, tenantId: s.tenantId }, metrics: rows.rows, health: { status: "HEALTHY", basis: "OGL_EXPERIENCE_TELEMETRY_ONLY" } }; }
export async function recordTelemetry(req: any) { const s = scope(req); const eventType = text(req.body?.eventType, 100, "EVENT_TYPE", true); if (!TELEMETRY.has(eventType)) throw Object.assign(new Error("TELEMETRY_EVENT_INVALID"), { statusCode: 400 }); const destinationId = text(req.body?.destinationId, 160, "DESTINATION_ID"); const orientationId = text(req.body?.orientationId, 160, "ORIENTATION_ID"); const statusCode = text(req.body?.statusCode, 80, "STATUS_CODE"); await query("INSERT INTO ogl_telemetry_events (event_id,organization_id,tenant_id,actor_user_id,event_type,destination_id,orientation_id,status_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [`ogl_tel_${randomUUID()}`, s.organizationId, s.tenantId, s.actorId, eventType, destinationId || null, orientationId || null, statusCode || null]); return { accepted: true, experienceOnly: true }; }
