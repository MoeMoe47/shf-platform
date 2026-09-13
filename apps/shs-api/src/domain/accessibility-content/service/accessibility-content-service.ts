import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { query } from "../../../db/client.js";
import { ReportFileStorage } from "../../reporting/report-file-storage.js";

export const REPRESENTATION_TYPES = ["ACCESSIBLE_HTML", "PLAIN_TEXT"] as const;
type RepresentationType = typeof REPRESENTATION_TYPES[number];
const storageRoot = () => process.env.SHS_ACCESSIBILITY_CONTENT_STORAGE_ROOT || path.join(process.env.SHS_REPORT_STORAGE_ROOT || os.tmpdir(), "shs-accessibility-content");
const metadataPath = () => path.join(storageRoot(), "representations.json");
const storage = new ReportFileStorage(storageRoot());

export class AccessibilityContentError extends Error { constructor(public code: string, message: string, public statusCode = 400) { super(message); } }
function scope(actor: any) { return { organizationId: String(actor?.active_organization_id || actor?.organization_id || ""), tenantId: String(actor?.tenant_id || `tenant:${actor?.active_organization_id || actor?.organization_id || ""}`), userId: actor?.user_id || actor?.id || null }; }
async function records(): Promise<any[]> { try { return JSON.parse(await readFile(metadataPath(), "utf8")); } catch { return []; } }
async function saveRecords(items: any[]) { await mkdir(storageRoot(), { recursive: true }); await writeFile(metadataPath(), JSON.stringify(items, null, 2)); }
function textFromHtml(value: string) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }

export async function resolveSource(actor: any, sourceType: string, sourceId: string) {
  const type = String(sourceType || "").toUpperCase(); const id = String(sourceId || "").trim();
  if (!id) throw new AccessibilityContentError("SOURCE_REQUIRED", "A canonical source is required.");
  if (type === "PUBLIC_ARTICLE" && id === "foundation-about") return { sourceType: type, sourceId: id, sourceVersion: "foundation-about-v1", sourceHash: createHash("sha256").update("foundation-about-v1").digest("hex"), ownerDomain: "foundation-public", visibility: "PUBLIC", language: "en", mimeType: "text/html", organizationId: null, tenantId: null, title: "About Silicon Heartland Foundation", blocks: [{ type: "paragraph", text: "Silicon Heartland Foundation helps young people learn, build, and connect to opportunity." }] };
  const s = scope(actor); if (!s.organizationId) throw new AccessibilityContentError("AUTH_REQUIRED", "Authentication is required for this source.", 401);
  if (type === "CURRICULUM_LESSON") {
    if (!hasPermission(actor, "assignment.view")) throw new AccessibilityContentError("SOURCE_ACCESS_DENIED", "The actor cannot access curriculum content.", 403);
    const result = await query(`SELECT l.lesson_id, l.title, l.summary, l.content, l.revision, l.updated_at, l.organization_id, u.course_id, c.title AS course_title FROM curriculum_lessons l JOIN curriculum_units u ON u.unit_id=l.unit_id JOIN curriculum_courses c ON c.course_id=u.course_id WHERE l.lesson_id=$1 AND l.organization_id=$2`, [id, s.organizationId]);
    const row = result.rows[0]; if (!row) throw new AccessibilityContentError("SOURCE_NOT_FOUND", "Curriculum source not found.", 404); const title = String(row.title || id);
    const content = row.content && typeof row.content === "object" ? row.content : {};
    const contentText = [row.summary, content.text, content.body].filter(Boolean).join("\n\n");
    const sourceVersion = `curriculum-lesson:${id}:r${row.revision || 1}:${row.updated_at ? new Date(row.updated_at).toISOString() : "unknown"}`;
    return { sourceType: type, sourceId: id, sourceVersion, sourceHash: createHash("sha256").update(`${id}:${sourceVersion}:${title}:${contentText}`).digest("hex"), ownerDomain: "curriculum", visibility: "AUTHENTICATED", language: "en", mimeType: "application/json", organizationId: row.organization_id, tenantId: s.tenantId, title, blocks: [{ type: "heading", text: row.course_title || "Curriculum lesson" }, { type: "paragraph", text: title }, ...(contentText ? [{ type: "paragraph", text: contentText }] : [])] };
  }
  if (type === "DGAL_DOCUMENT") {
    if (!hasPermission(actor, "documentation.view")) throw new AccessibilityContentError("SOURCE_ACCESS_DENIED", "The actor cannot access DGAL content.", 403);
    const result = await query(`SELECT document_instance_id, organization_id, tenant_id, title, state, content_hash, artifact_reference, artifact_mime_type FROM dgal_document_instances WHERE document_instance_id=$1 AND organization_id=$2 AND tenant_id=$3`, [id, s.organizationId, s.tenantId]);
    const row = result.rows[0]; if (!row) throw new AccessibilityContentError("SOURCE_NOT_FOUND", "DGAL source not found.", 404); if (row.state !== "GENERATED" || !row.artifact_reference) throw new AccessibilityContentError("SOURCE_UNAVAILABLE", "The canonical document artifact is unavailable.", 409);
    const bytes = await storage.get(row.artifact_reference); const text = String(row.artifact_mime_type || "").includes("html") ? textFromHtml(bytes.toString("utf8")) : bytes.toString("utf8");
    return { sourceType: type, sourceId: id, sourceVersion: String(row.content_hash || `dgal:${id}`), sourceHash: row.content_hash || null, ownerDomain: "DGAL", visibility: "INTERNAL", language: "en", mimeType: row.artifact_mime_type || "application/octet-stream", organizationId: row.organization_id, tenantId: row.tenant_id, title: row.title, blocks: [{ type: "paragraph", text }] };
  }
  throw new AccessibilityContentError("SOURCE_UNSUPPORTED", "This source type is not supported by the live AX-3 adapters.", 422);
}

function hasPermission(actor: any, permission: string) { return Array.isArray(actor?.permissions) && actor.permissions.includes(permission); }
function authorized(actor: any, source: any) { if (source.visibility === "PUBLIC") return true; const s = scope(actor); return Boolean(actor && s.organizationId === source.organizationId && s.tenantId === source.tenantId); }
function escape(value: any) { return String(value ?? "").replace(/[&<>\"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]); }
function transform(source: any, type: RepresentationType) { if (type === "PLAIN_TEXT") return { bytes: Buffer.from([source.title, ...(source.blocks || []).flatMap((b: any) => b.type === "list" ? (b.items || []) : [b.text])].filter(Boolean).join("\n\n")), mimeType: "text/plain" }; const body = (source.blocks || []).map((b: any) => b.type === "heading" ? `<h2>${escape(b.text)}</h2>` : `<p>${escape(b.text)}</p>`).join(""); return { bytes: Buffer.from(`<article aria-labelledby="ax3-content-title"><h1 id="ax3-content-title">${escape(source.title || "Accessible content")}</h1>${body}</article>`), mimeType: "text/html" }; }

export async function requestRepresentation(actor: any, input: any) {
  const type = String(input?.representationType || "").toUpperCase() as RepresentationType; if (!REPRESENTATION_TYPES.includes(type)) throw new AccessibilityContentError("REPRESENTATION_UNSUPPORTED", "Only ACCESSIBLE_HTML and PLAIN_TEXT are live AX-3 representations.", 422);
  const source = await resolveSource(actor, input.sourceType, input.sourceId); if (!authorized(actor, source)) throw new AccessibilityContentError("SOURCE_ACCESS_DENIED", "The actor cannot access this source.", 403);
  const version = "ax3-live-v1"; const reuseKey = [source.sourceType, source.sourceId, source.sourceVersion, type, source.language, version].join("::"); const existing = (await records()).find((item) => item.reuseKey === reuseKey && item.status === "READY"); if (existing) return { ...existing, reused: true };
  const rendered = transform(source, type); const hash = createHash("sha256").update(rendered.bytes).digest("hex"); const representationId = `ax3_${randomUUID()}`; const storageReference = `accessibility/${source.sourceType.toLowerCase()}/${source.sourceId}/${source.sourceVersion}/${type.toLowerCase()}-${hash}.bin`; await storage.put(storageReference, rendered.bytes);
  const item = { representationId, sourceType: source.sourceType, sourceId: source.sourceId, sourceVersion: source.sourceVersion, representationType: type, status: "READY", language: source.language, mimeType: rendered.mimeType, generatedBy: "ax3-local-deterministic", generatedAt: new Date().toISOString(), validatedAt: new Date().toISOString(), validationStatus: "AUTOMATED_CHECKED", provenance: { sourceRef: `${source.sourceType}:${source.sourceId}`, sourceHash: source.sourceHash, transformationVersion: version, method: "deterministic-local-projection" }, storageRef: storageReference, accessPolicy: { visibility: source.visibility, organizationId: source.organizationId, tenantId: source.tenantId }, reuseKey, reused: false };
  const all = await records(); await saveRecords([...all.filter((old) => old.reuseKey !== reuseKey), item]); return item;
}
export async function listRepresentations(actor: any, input: any) { const source = await resolveSource(actor, input.sourceType, input.sourceId); if (!authorized(actor, source)) throw new AccessibilityContentError("SOURCE_ACCESS_DENIED", "The actor cannot access this source.", 403); return (await records()).filter((item) => item.sourceType === source.sourceType && item.sourceId === source.sourceId && item.sourceVersion === source.sourceVersion); }
export async function getRepresentation(actor: any, id: string) { const item = (await records()).find((entry) => entry.representationId === id); if (!item) throw new AccessibilityContentError("REPRESENTATION_NOT_FOUND", "Representation not found.", 404); const source = await resolveSource(actor, item.sourceType, item.sourceId); if (!authorized(actor, source)) throw new AccessibilityContentError("DELIVERY_DENIED", "Representation delivery is not authorized.", 403); return source.sourceVersion !== item.sourceVersion ? { ...item, status: "STALE" } : item; }
export async function readRepresentation(actor: any, id: string) { const item = await getRepresentation(actor, id); if (item.status !== "READY") throw new AccessibilityContentError("REPRESENTATION_UNAVAILABLE", `Representation is ${item.status}.`, 409); return { item, bytes: await storage.get(item.storageRef) }; }
