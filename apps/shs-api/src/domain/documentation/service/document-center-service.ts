import { query } from "../../../db/client.js";
import { DgalRepository } from "../repo/dgal-repo.js";
import { DgalService } from "./dgal-service.js";

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId, userId };
}

const labels: Record<string, string> = { REQUIRED_NOW: "Action required", WAITING_ON_YOU: "Waiting on you", WAITING_ON_SOMEONE_ELSE: "Waiting for reviewer", BLOCKED: "Needs attention", COMPLETED: "Complete", REFERENCE: "Reference", OPTIONAL: "Optional", ARCHIVED: "Archived" };
function safeTarget(target: any) { const route = typeof target?.route === "string" ? target.route : ""; return route.startsWith("/") && !route.startsWith("//") ? { route, action: target.action || "OPEN" } : null; }
function itemTarget(kind: string, id: string, action = "OPEN") { return { route: `/documentation/items/${encodeURIComponent(`${kind}:${id}`)}`, action }; }

export function buildDocumentCenterItems(input: { guidance?: any[]; requirements?: any[]; documents?: any[]; packets?: any[]; acknowledgments?: any[]; manualSignatures?: any[]; signatures?: any[] }) {
  const items: any[] = [];
  for (const item of input.requirements || []) items.push({ id: `requirement:${item.requirementId}`, kind: "REQUIREMENT", title: item.title, service: item.serviceKey || null, owner: "YOU", status: item.required ? "Action required" : "Reference", category: item.required ? "REQUIRED_NOW" : "REFERENCE", required: item.required, source: item.sourceDomain, version: item.versionReference, actionTarget: safeTarget(item.actionReference ? { route: item.actionReference, action: "OPEN" } : null), sourceReferences: item.sources || [item.sourceReference] });
  for (const item of input.guidance || []) items.push({ id: `guidance:${item.guidanceId}`, kind: "GUIDANCE", title: item.title, service: item.serviceKey || null, owner: item.waitingOn || (item.actorResponsibility === "YOU" ? "YOU" : "REFERENCE"), status: labels[item.category] || item.category, category: item.category, required: item.required !== false, source: item.sourceDomain, actionTarget: safeTarget(item.actionTarget), returnTarget: safeTarget(item.returnTarget), sourceReferences: item.sourceReferences || [item.sourceId].filter(Boolean) });
  for (const item of input.documents || []) {
    const archived = item.state === "ARCHIVED";
    const superseded = item.state === "SUPERSEDED";
    items.push({ id: `document:${item.document_instance_id}`, kind: "DOCUMENT", title: item.title, service: item.service_key || null, owner: archived || superseded ? "REFERENCE" : "YOU", status: archived ? "Archived" : superseded ? "Superseded" : item.state === "GENERATED" ? "Complete" : labels[item.state] || item.state, category: archived ? "ARCHIVED" : superseded ? "REFERENCE" : item.state === "GENERATED" ? "COMPLETED" : item.state, required: item.required === true, source: item.owning_domain, version: item.template_version_id, classification: item.classification, actionTarget: itemTarget("document", item.document_instance_id, archived || superseded ? "REVIEW" : "OPEN") });
  }
  for (const item of input.packets || []) {
    const archived = item.state === "ARCHIVED";
    const incomplete = ["PENDING", "PARTIAL", "FAILED"].includes(item.state);
    items.push({ id: `packet:${item.packet_instance_id}`, kind: "PACKET", title: item.title, service: item.service_key || null, owner: incomplete ? "YOU" : "REFERENCE", status: archived ? "Archived" : item.state === "GENERATED" ? "Complete" : item.state === "PARTIAL" ? "Needs attention" : item.state, category: archived ? "ARCHIVED" : item.state === "GENERATED" ? "COMPLETED" : incomplete ? "BLOCKED" : item.state, required: item.required === true, source: item.owning_domain, actionTarget: itemTarget("packet", item.packet_instance_id, archived ? "REVIEW" : "OPEN") });
  }
  for (const item of input.acknowledgments || []) items.push({ id: `acknowledgment:${item.acknowledgment_id}`, kind: "ACKNOWLEDGMENT", title: "Acknowledgment recorded", service: item.service_key || null, owner: "COMPLETED", status: item.status === "ACKNOWLEDGED" ? "Complete" : labels[item.status] || item.status, category: item.status === "ACKNOWLEDGED" ? "COMPLETED" : "BLOCKED", required: true, source: item.owning_domain, version: item.template_version_id, actionTarget: null });
  for (const item of input.manualSignatures || []) items.push({ id: `manual:${item.manual_signature_id}`, kind: "MANUAL_SIGNATURE", title: item.verification_status === "VERIFIED" ? "Manual signature verified" : "Manual signature", service: item.service_key || null, owner: item.verification_status === "UPLOADED" ? "AUTHORIZED_VERIFIER" : "YOU", status: item.verification_status === "VERIFIED" ? "Complete" : item.verification_status === "UPLOADED" ? "Waiting for reviewer" : item.verification_status === "REJECTED" ? "Needs correction" : "Action required", category: item.verification_status === "VERIFIED" ? "COMPLETED" : item.verification_status === "UPLOADED" ? "WAITING_ON_SOMEONE_ELSE" : item.verification_status === "REJECTED" ? "BLOCKED" : "REQUIRED_NOW", required: item.required === true, source: item.owning_domain, actionTarget: itemTarget("manual", item.manual_signature_id, "VIEW_STATUS") });
  for (const item of input.signatures || []) items.push({ id: `signature:${item.signature_request_id}`, kind: "ELECTRONIC_SIGNATURE", title: item.status === "SIGNED" ? "Electronic signature complete" : "Electronic signature", service: item.service_key || null, owner: item.status === "SENT" ? "SIGNER" : item.status === "SIGNED" ? "COMPLETED" : "AUTHORIZED_REQUESTER", status: item.status === "SIGNED" ? "Complete" : item.status === "VIEWED" ? "Waiting for signer" : item.status === "DECLINED" || item.status === "EXPIRED" || item.status === "FAILED" ? "Needs attention" : "Action required", category: item.status === "SIGNED" ? "COMPLETED" : item.status === "VIEWED" ? "WAITING_ON_SOMEONE_ELSE" : item.status === "DECLINED" || item.status === "EXPIRED" || item.status === "FAILED" ? "BLOCKED" : "REQUIRED_NOW", required: item.required === true, source: item.owning_domain, version: item.template_version_id, actionTarget: item.status === "SIGNED" ? null : itemTarget("signature", item.signature_request_id, "OPEN") });
  return items.sort((a, b) => (a.category === "COMPLETED" ? 1 : 0) - (b.category === "COMPLETED" ? 1 : 0) || String(a.title).localeCompare(String(b.title)));
}

export class DocumentCenterService {
  constructor(private readonly db: any = { query }) {}
  async list(actor: any, filters: any = {}) {
    const s = scope(actor); const service = filters.service ? String(filters.service) : null;
    const params = [s.organizationId, s.tenantId, service];
    const where = "organization_id=$1 AND tenant_id=$2 AND ($3::text IS NULL OR service_key=$3)";
    const [documents, packets, acknowledgments, manual, signatures] = await Promise.all([
      this.db.query(`SELECT * FROM dgal_document_instances WHERE ${where} ORDER BY created_at DESC LIMIT 100`, params),
      this.db.query(`SELECT * FROM dgal_packet_instances WHERE ${where} ORDER BY created_at DESC LIMIT 100`, params),
      this.db.query(`SELECT * FROM documentation_acknowledgments WHERE organization_id=$1 AND tenant_id=$2 AND ($3::text IS NULL OR service_key=$3) ORDER BY created_at DESC LIMIT 100`, params),
      this.db.query(`SELECT m.*, d.service_key FROM documentation_manual_signature_records m JOIN dgal_document_instances d ON d.document_instance_id=m.document_instance_id WHERE m.organization_id=$1 AND m.tenant_id=$2 AND ($3::text IS NULL OR d.service_key=$3) ORDER BY m.created_at DESC LIMIT 100`, params),
      this.db.query(`SELECT s.*, d.service_key FROM documentation_signature_requests s JOIN dgal_document_instances d ON d.document_instance_id=s.document_instance_id WHERE s.organization_id=$1 AND s.tenant_id=$2 AND ($3::text IS NULL OR d.service_key=$3) ORDER BY s.created_at DESC LIMIT 100`, params),
    ]);
    let requirementStatus = "RESOLVED"; let requirements: any[] = [];
    try { const resolution = await new DgalService(new DgalRepository(this.db)).resolveDocumentationRequirements(actor, { serviceKey: service || undefined }); requirementStatus = resolution.status; requirements = resolution.status === "RESOLVED" ? resolution.requirements : []; } catch { requirementStatus = "UNKNOWN"; }
    const items = buildDocumentCenterItems({ requirements, documents: documents.rows, packets: packets.rows, acknowledgments: acknowledgments.rows, manualSignatures: manual.rows, signatures: signatures.rows });
    const status = requirementStatus === "UNKNOWN" ? (items.length ? "PARTIAL" : "SOURCE_UNAVAILABLE") : !items.length ? requirementStatus : "RESOLVED";
    const statusFilter = filters.status ? String(filters.status).toUpperCase() : null;
    const filteredItems = statusFilter ? items.filter((item) => item.category === statusFilter || String(item.status || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_") === statusFilter) : items;
    return { status, requirementStatus, items: filteredItems, totalItemCount: items.length, filters: { service: service || null, status: statusFilter } };
  }
  async get(actor: any, id: string) { const result = await this.list(actor); return result.items.find((item) => item.id === id) || null; }
}
