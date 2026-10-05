import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fail, ok } from "../../../api/response-envelope.js";
import { COMMERCIAL_FAMILIES, REVIEW_GATE_TYPES } from "../model/commercial-product-registry-contract.js";
import { CommercialProductReviewError, CommercialProductReviewService } from "./commercial-product-review-service.js";
import { buildReviewPackets } from "./review-packet-generator.js";
import { REVIEW_GATE_POLICY, SOURCE_RESOLUTION_STATUSES } from "./review-contract.js";

const BASE_PATH = "/commercial-product-reviews";
const MAX_PAGE_SIZE = 100;
const REVIEW_STATES = ["REVIEW_PENDING", "REVIEW_PARTIALLY_RESOLVED", "REVIEW_RESOLVED"] as const;
const QUEUE_SORTS = ["candidate_name", "family", "source_status", "review_status", "production_onboarding_eligibility"] as const;
const DECISION_FIELDS = {
  gateType: "gateType", gate_type: "gateType",
  decisionStatus: "decisionStatus", decision_status: "decisionStatus",
  decisionReason: "decisionReason", decision_reason: "decisionReason",
  authorityType: "authorityType", authority_type: "authorityType",
  authorityReference: "authorityReference", authority_reference: "authorityReference",
  evidenceReferences: "evidenceReferences", evidence_references: "evidenceReferences",
  reviewedAt: "reviewedAt", reviewed_at: "reviewedAt",
  effectiveAt: "effectiveAt", effective_at: "effectiveAt",
  expiresAt: "expiresAt", expires_at: "expiresAt",
  staleAt: "staleAt", stale_at: "staleAt",
  supersedesDecisionId: "supersedesDecisionId", supersedes_decision_id: "supersedesDecisionId",
  reviewDecisionId: "reviewDecisionId", review_decision_id: "reviewDecisionId",
  expectedVersion: "expectedVersion", expected_version: "expectedVersion",
} as const;
const SOURCE_FIELDS = {
  resolutionStatus: "resolutionStatus", resolution_status: "resolutionStatus",
  authorityDomain: "authorityDomain", authority_domain: "authorityDomain",
  authorityReference: "authorityReference", authority_reference: "authorityReference",
  authorityVersion: "authorityVersion", authority_version: "authorityVersion",
  evidenceReference: "evidenceReference", evidence_reference: "evidenceReference",
  resolvedAt: "resolvedAt", resolved_at: "resolvedAt",
  resolutionReason: "resolutionReason", resolution_reason: "resolutionReason",
  remainingRequirements: "remainingRequirements", remaining_requirements: "remainingRequirements",
  supersedesResolutionId: "supersedesResolutionId", supersedes_resolution_id: "supersedesResolutionId",
  sourceResolutionId: "sourceResolutionId", source_resolution_id: "sourceResolutionId",
  expectedVersion: "expectedVersion", expected_version: "expectedVersion",
} as const;
type ReviewService = Pick<CommercialProductReviewService, "recordDecision" | "recordSourceResolution" | "getPacket" | "listQueue" | "listDecisionHistoryPage" | "listSourceResolutionHistoryPage" | "reassess">;

function sendError(res: any, status: number, code: string, message: string) {
  return res.status(status).json(fail(code, message));
}

function mapError(error: any) {
  const code = String(error?.code || "");
  if (error instanceof CommercialProductReviewError) {
    const mappedCode = code.includes("NOT_FOUND") ? "NOT_FOUND"
      : code.includes("CAPABILITY") || code.includes("HUMAN_ACTOR") || code.includes("ACTOR_CONTEXT") ? "FORBIDDEN"
        : code.includes("AUTHORITY_REQUIRED") ? "AUTHORITY_REQUIRED"
          : code.includes("EVIDENCE") ? "EVIDENCE_REQUIRED"
            : code.includes("AUTHORITY_TYPE") ? "INVALID_AUTHORITY_TYPE"
              : code.includes("STATUS") ? "INVALID_STATUS"
                : code.includes("GATE") ? "INVALID_GATE"
                  : code.includes("SUPERSESSION") ? "SUPERSESSION_CONFLICT"
                    : code.includes("SOURCE") ? "SOURCE_NOT_RESOLVABLE"
                      : "INVALID_INPUT";
    return { status: error.statusCode, code: mappedCode, message: error.message };
  }
  if (code.includes("NOT_FOUND")) return { status: 404, code: "NOT_FOUND", message: error.message };
  if (code.includes("CAPABILITY") || code.includes("HUMAN_ACTOR")) return { status: 403, code: "FORBIDDEN", message: error.message };
  if (code.includes("SUPERSESSION") || error?.code === "23505") return { status: 409, code: "SUPERSESSION_CONFLICT", message: error.message };
  if (code.includes("AUTHORITY_REQUIRED")) return { status: 400, code: "AUTHORITY_REQUIRED", message: error.message };
  if (code.includes("EVIDENCE")) return { status: 400, code: "EVIDENCE_REQUIRED", message: error.message };
  if (code.includes("AUTHORITY_TYPE")) return { status: 400, code: "INVALID_AUTHORITY_TYPE", message: error.message };
  if (code.includes("STATUS")) return { status: 400, code: "INVALID_STATUS", message: error.message };
  if (code.includes("GATE")) return { status: 400, code: "INVALID_GATE", message: error.message };
  if (code.startsWith("SOURCE_RESOLUTION") || code.startsWith("SOURCE_")) return { status: 400, code: "SOURCE_NOT_RESOLVABLE", message: error.message };
  if (code.includes("INPUT_FIELD") || code.includes("FUNDING_ELIGIBILITY")) return { status: 400, code: "INVALID_INPUT", message: error.message };
  if (code.includes("REASON_REQUIRED")) return { status: 400, code: "INVALID_INPUT", message: error.message };
  if (code === "REVIEW_INPUT_INVALID") return { status: 400, code: "INVALID_INPUT", message: error.message };
  if (code.startsWith("REVIEW_") || code.startsWith("SOURCE_RESOLUTION_")) return { status: 400, code: "INVALID_INPUT", message: error.message };
  return { status: 500, code: "INTERNAL_ERROR", message: "Review operation could not be completed." };
}

function handleError(error: any, res: any, next: any) {
  if (error instanceof CommercialProductReviewError || error?.code) {
    const mapped = mapError(error);
    return sendError(res, mapped.status, mapped.code, mapped.message || mapped.code);
  }
  return next(error);
}

function requireCapability(capability: string) {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
    if (user.org_context_error || !user.active_organization_id || !user.tenant_id) return sendError(res, 403, "FORBIDDEN", "Valid active organization context is required.");
    if (!Array.isArray(user.permissions) || !user.permissions.includes(capability)) return sendError(res, 403, "FORBIDDEN", `Missing permission: ${capability}`);
    return next();
  };
}

function actor(req: any) {
  return { ...req.user, capabilities: Array.isArray(req.user?.permissions) ? req.user.permissions : [] };
}

function pageOptions(query: any) {
  const page = Number.parseInt(String(query.page || "1"), 10);
  const pageSize = Number.parseInt(String(query.page_size || query.pageSize || "25"), 10);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw Object.assign(new Error("Pagination is outside supported bounds."), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
  }
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

function enumFilter(value: unknown, values: readonly string[], name: string) {
  if (value === undefined || value === "") return undefined;
  const normalized = String(value).trim().toUpperCase();
  if (!values.includes(normalized)) throw Object.assign(new Error(`${name} is invalid.`), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
  return normalized;
}

function normalizeBody(body: any, fields: Readonly<Record<string, string>>) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw Object.assign(new Error("Request body must be an object."), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
  const unexpected = Object.keys(body).filter((key) => !(key in fields));
  if (unexpected.length) throw Object.assign(new Error(`Unsupported request fields: ${unexpected.join(", ")}`), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const target = fields[key];
    if (target in normalized) throw Object.assign(new Error(`Duplicate aliases supplied for ${target}.`), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
    normalized[target] = value;
  }
  return normalized;
}

function sortQueue(items: any[], query: any) {
  const sort = String(query.sort || "candidate_name");
  if (!(QUEUE_SORTS as readonly string[]).includes(sort)) throw Object.assign(new Error("sort is invalid."), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
  const direction = String(query.direction || "asc").toLowerCase();
  if (!(["asc", "desc"] as string[]).includes(direction)) throw Object.assign(new Error("direction is invalid."), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
  return [...items].sort((a, b) => {
    const left = String(a[sort] ?? "");
    const right = String(b[sort] ?? "");
    const compared = left.localeCompare(right, undefined, { numeric: true });
    return direction === "asc" ? compared : -compared;
  });
}

async function loadReviewService() {
  const readJson = async (relativePath: string) => JSON.parse(await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8"));
  const [reviewManifest, onboardingManifest] = await Promise.all([
    readJson("../../../../../../docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"),
    readJson("../../../../../../docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"),
  ]);
  const generatedAt = reviewManifest.reviewed_at || new Date().toISOString();
  const packets = buildReviewPackets(reviewManifest, onboardingManifest, generatedAt);
  return new CommercialProductReviewService(
    new Map(packets.map((packet: any) => [packet.candidate_id, packet.commercial_product_id])),
    new Map(packets.map((packet: any) => [packet.candidate_id, packet])),
  );
}

export function registerCommercialProductReviewRoutes(app: any, serviceProvider: ReviewService | (() => Promise<ReviewService>) = loadReviewService) {
  let cachedService: Promise<ReviewService> | undefined;
  const getService = () => {
    if (typeof serviceProvider !== "function") return Promise.resolve(serviceProvider);
    cachedService ||= serviceProvider();
    return cachedService;
  };
  const read = requireCapability("commercial_product.read");

  app.get(BASE_PATH, read, async (req: any, res: any, next: any) => {
    try {
      const { page, pageSize } = pageOptions(req.query || {});
      const query = req.query || {};
      const gateType = enumFilter(query.gate_type, REVIEW_GATE_TYPES, "gate_type");
      const reviewStatus = enumFilter(query.review_status, REVIEW_STATES, "review_status");
      const sourceStatus = enumFilter(query.source_status, ["SOURCE_RESOLVED", "SOURCE_UNRESOLVED", ...SOURCE_RESOLUTION_STATUSES], "source_status");
      const family = enumFilter(query.family, COMMERCIAL_FAMILIES, "family");
      const blocked = query.blocked === undefined ? undefined : String(query.blocked).toLowerCase();
      const stale = query.stale === undefined ? undefined : String(query.stale).toLowerCase();
      const eligible = query.production_onboarding_eligibility === undefined ? undefined : String(query.production_onboarding_eligibility).toLowerCase();
      for (const [name, value] of [["blocked", blocked], ["stale", stale], ["production_onboarding_eligibility", eligible]] as const) {
        if (value !== undefined && value !== "true" && value !== "false") throw Object.assign(new Error(`${name} must be true or false.`), { code: "REVIEW_INPUT_INVALID", statusCode: 400 });
      }
      const all = await (await getService()).listQueue(actor(req));
      let filtered = all.filter((item: any) => (!family || item.family === family)
        && (!reviewStatus || item.review_status === reviewStatus)
        && (!sourceStatus || item.source_status === sourceStatus)
        && (!query.candidate_id || item.candidate_id === String(query.candidate_id))
        && (!query.commercial_product_id || item.commercial_product_id === String(query.commercial_product_id))
        && (blocked === undefined || Boolean(item.blocking_gates.length) === (blocked === "true"))
        && (stale === undefined || Boolean(item.stale_gates.length || item.source_status === "SOURCE_STALE") === (stale === "true"))
        && (eligible === undefined || item.production_onboarding_eligibility === (eligible === "true"))
        && (!gateType || item.remaining_required_gates.includes(gateType) || item.blocking_gates.includes(gateType) || item.stale_gates.includes(gateType)));
      filtered = sortQueue(filtered, query);
      const offset = (page - 1) * pageSize;
      return res.json(ok({ items: filtered.slice(offset, offset + pageSize), total: filtered.length, page, page_size: pageSize, sort: query.sort || "candidate_name", direction: query.direction || "asc" }));
    } catch (error) { return handleError(error, res, next); }
  });

  app.get(`${BASE_PATH}/:candidateId/packet`, read, async (req: any, res: any, next: any) => {
    try { return res.json(ok(await (await getService()).getPacket(String(req.params.candidateId), actor(req)))); }
    catch (error) { return handleError(error, res, next); }
  });

  app.get(`${BASE_PATH}/:candidateId/decisions`, read, async (req: any, res: any, next: any) => {
    try {
      const gateType = enumFilter(req.query?.gate_type, REVIEW_GATE_TYPES, "gate_type");
      const options = pageOptions(req.query || {});
      const result = await (await getService()).listDecisionHistoryPage(String(req.params.candidateId), actor(req), { gateType, limit: options.limit, offset: options.offset });
      return res.json(ok({ ...result, page: options.page, page_size: options.pageSize }));
    } catch (error) { return handleError(error, res, next); }
  });

  app.post(`${BASE_PATH}/:candidateId/decisions`, async (req: any, res: any, next: any) => {
    try {
      if (!req.user) return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      if (req.user.org_context_error || !req.user.active_organization_id || !req.user.tenant_id) return sendError(res, 403, "FORBIDDEN", "Valid active organization context is required.");
      const body = normalizeBody(req.body || {}, DECISION_FIELDS);
      const gateType = enumFilter(body.gateType, REVIEW_GATE_TYPES, "gate_type");
      if (!gateType) return sendError(res, 400, "INVALID_GATE", "gate_type is required.");
      const capability = REVIEW_GATE_POLICY[gateType as keyof typeof REVIEW_GATE_POLICY].capability;
      return requireCapability(capability)(req, res, async () => {
        try {
          const result = await (await getService()).recordDecision({ ...body, gateType, candidateId: String(req.params.candidateId) }, actor(req));
          return res.status(201).json(ok(result));
        } catch (error) { return handleError(error, res, next); }
      });
    } catch (error) { return handleError(error, res, next); }
  });

  app.get(`${BASE_PATH}/:candidateId/source-resolutions`, read, async (req: any, res: any, next: any) => {
    try {
      const options = pageOptions(req.query || {});
      const result = await (await getService()).listSourceResolutionHistoryPage(String(req.params.candidateId), actor(req), { limit: options.limit, offset: options.offset });
      return res.json(ok({ ...result, page: options.page, page_size: options.pageSize }));
    } catch (error) { return handleError(error, res, next); }
  });

  app.post(`${BASE_PATH}/:candidateId/source-resolutions`, requireCapability("commercial_product.review_source_authority"), async (req: any, res: any, next: any) => {
    try {
      const body = req.body || {};
      const normalized = normalizeBody(body, SOURCE_FIELDS);
      const result = await (await getService()).recordSourceResolution({ ...normalized, candidateId: String(req.params.candidateId) }, actor(req));
      return res.status(201).json(ok(result));
    } catch (error) { return handleError(error, res, next); }
  });

  app.get(`${BASE_PATH}/:candidateId/reassessment`, read, async (req: any, res: any, next: any) => {
    try { return res.json(ok(await (await getService()).reassess(String(req.params.candidateId), actor(req)))); }
    catch (error) { return handleError(error, res, next); }
  });
}
