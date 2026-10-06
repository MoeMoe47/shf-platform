import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fail, ok } from "../../../api/response-envelope.js";
import { buildReviewPackets } from "./review-packet-generator.js";
import { CommercialProductReviewerAssignmentService, ReviewerAssignmentError } from "./reviewer-assignment-service.js";

const BASE_PATH = "/commercial-product-reviewer-assignments";
const MAX_PAGE_SIZE = 100;

function sendError(res: any, status: number, code: string, message: string) {
  return res.status(status).json(fail(code, message));
}

function requireCapability(capability: string) {
  return (req: any, res: any, next: any) => {
    if (!req.user) return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
    if (req.user.org_context_error || !req.user.active_organization_id || req.user.tenant_id !== `tenant:${req.user.active_organization_id}`) {
      return sendError(res, 403, "FORBIDDEN", "Valid active organization membership is required.");
    }
    if (!Array.isArray(req.user.permissions) || !req.user.permissions.includes(capability)) return sendError(res, 403, "FORBIDDEN", `Missing permission: ${capability}`);
    return next();
  };
}

function actor(req: any) {
  return { ...req.user, capabilities: Array.isArray(req.user?.permissions) ? req.user.permissions : [] };
}

function pagination(query: any) {
  const page = Number.parseInt(String(query.page || "1"), 10);
  const pageSize = Number.parseInt(String(query.page_size || "25"), 10);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new ReviewerAssignmentError("ASSIGNMENT_PAGINATION_INVALID", "Pagination is outside the supported bounds.");
  }
  return { page, page_size: pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

function mapError(error: any) {
  if (error instanceof ReviewerAssignmentError) {
    const code = error.code.includes("NOT_FOUND") ? "NOT_FOUND"
      : error.code.includes("FORBIDDEN") || error.code.includes("MEMBERSHIP_REQUIRED") ? "FORBIDDEN"
        : error.code.includes("CONFLICT") || error.code.includes("DUPLICATE") ? "CONFLICT"
          : error.code.includes("TIME") ? "INVALID_TIME_WINDOW"
            : error.code.includes("GATE") ? "INVALID_GATE"
              : "INVALID_INPUT";
    return { status: error.statusCode, code, message: error.message };
  }
  if (error?.code === "23505") return { status: 409, code: "CONFLICT", message: "A conflicting active assignment already exists." };
  return null;
}

async function loadAssignmentService() {
  const readJson = async (relativePath: string) => JSON.parse(await readFile(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8"));
  const [reviewManifest, onboardingManifest] = await Promise.all([
    readJson("../../../../../../docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"),
    readJson("../../../../../../docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"),
  ]);
  const packets = buildReviewPackets(reviewManifest, onboardingManifest, reviewManifest.reviewed_at);
  return new CommercialProductReviewerAssignmentService(new Map(packets.map((packet: any) => [packet.candidate_id, packet.commercial_product_id])));
}

export function registerCommercialProductReviewerAssignmentRoutes(app: any, serviceProvider: CommercialProductReviewerAssignmentService | (() => Promise<CommercialProductReviewerAssignmentService>) = loadAssignmentService) {
  let cached: Promise<CommercialProductReviewerAssignmentService> | undefined;
  const getService = () => {
    if (typeof serviceProvider !== "function") return Promise.resolve(serviceProvider);
    cached ||= serviceProvider();
    return cached;
  };
  const manage = requireCapability("commercial_product.review_assignment.manage");

  app.get(`${BASE_PATH}/mine`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await (await getService()).listMyAssignments(actor(req)) })); }
    catch (error) { const mapped = mapError(error); return mapped ? sendError(res, mapped.status, mapped.code, mapped.message) : next(error); }
  });

  app.get(BASE_PATH, manage, async (req: any, res: any, next: any) => {
    try {
      const page = pagination(req.query || {});
      const result = await (await getService()).listAssignments(actor(req), page);
      return res.json(ok({ ...result, page: page.page, page_size: page.page_size }));
    } catch (error) { const mapped = mapError(error); return mapped ? sendError(res, mapped.status, mapped.code, mapped.message) : next(error); }
  });

  app.post(BASE_PATH, manage, async (req: any, res: any, next: any) => {
    try {
      const assignment = await (await getService()).createAssignment(req.body || {}, actor(req));
      return res.status(201).json(ok(assignment));
    } catch (error) { const mapped = mapError(error); return mapped ? sendError(res, mapped.status, mapped.code, mapped.message) : next(error); }
  });

  app.get(`${BASE_PATH}/:assignmentId`, manage, async (req: any, res: any, next: any) => {
    try { return res.json(ok(await (await getService()).getAssignment(String(req.params.assignmentId), actor(req)))); }
    catch (error) { const mapped = mapError(error); return mapped ? sendError(res, mapped.status, mapped.code, mapped.message) : next(error); }
  });

  app.post(`${BASE_PATH}/:assignmentId/revoke`, manage, async (req: any, res: any, next: any) => {
    try {
      const body = req.body || {};
      if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "reason")) {
        return sendError(res, 400, "INVALID_INPUT", "Only a revocation reason may be supplied.");
      }
      return res.json(ok(await (await getService()).revokeAssignment(String(req.params.assignmentId), body.reason, actor(req))));
    } catch (error) { const mapped = mapError(error); return mapped ? sendError(res, mapped.status, mapped.code, mapped.message) : next(error); }
  });
}
