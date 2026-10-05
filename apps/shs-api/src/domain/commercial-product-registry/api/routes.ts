import { fail, ok } from "../../../api/response-envelope.js";
import {
  BUYER_TYPES,
  COMMERCIAL_FAMILIES,
  COMMERCIAL_FORMS,
  ENTITY_CLASSIFICATIONS,
  FUNDING_RELATIONSHIP_STATUSES,
  PRODUCT_LIFECYCLE_STATES,
  READINESS_STATES,
  REVIEW_GATE_TYPES,
  SELLABILITY_STATUSES,
  type CommercialProductGovernanceCapability,
} from "../model/commercial-product-registry-contract.js";
import { CommercialProductRegistryService, CommercialProductRegistryServiceError } from "../service/commercial-product-registry-service.js";

const BASE_PATH = "/commercial-products";
const MAX_PAGE_SIZE = 100;
const SORTS: Record<string, (item: any) => unknown> = {
  name: (item) => item.name || item.display_name || "",
  family: (item) => item.family || item.commercial_family || "",
  readiness: (item) => item.readiness || "",
  sellability: (item) => item.sellability || "",
  last_verified_at: (item) => item.lastVerifiedAt || item.last_verified_at || "",
};

const GATE_CAPABILITIES: Partial<Record<string, CommercialProductGovernanceCapability>> = {
  COMMERCIAL_READINESS: "commercial_product.review_readiness",
  LEGAL: "commercial_product.review_legal",
  REGULATORY: "commercial_product.review_regulatory",
  PRICING: "commercial_product.review_pricing",
  MARGIN: "commercial_product.review_margin",
  COMMISSION: "commercial_product.review_commission",
  PARTNER: "commercial_product.review_sponsorship",
};

function error(res: any, status: number, code: string, message: string) {
  return res.status(status).json(fail(code, message));
}

function requireCapability(capability: CommercialProductGovernanceCapability) {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) return error(res, 401, "UNAUTHENTICATED", "Authentication required.");
    if (user.org_context_error) return error(res, 403, "FORBIDDEN", "Valid active organization context is required.");
    if (!user.active_organization_id || !user.tenant_id) return error(res, 403, "FORBIDDEN", "Valid active organization context is required.");
    if (!Array.isArray(user.permissions) || !user.permissions.includes(capability)) {
      return error(res, 403, "FORBIDDEN", `Missing permission: ${capability}`);
    }
    return next();
  };
}

function actor(req: any) {
  return {
    ...req.user,
    capabilities: Array.isArray(req.user?.permissions) ? req.user.permissions : [],
  };
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function optionalEnum(value: unknown, allowed: readonly string[], label: string) {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  if (!allowed.includes(normalized)) throw Object.assign(new Error(`${label} is invalid.`), { code: "INVALID_INPUT" });
  return normalized;
}

function parsePage(query: any) {
  const page = Math.max(1, Number.parseInt(String(query?.page || "1"), 10) || 1);
  const requested = Number.parseInt(String(query?.page_size || query?.pageSize || "25"), 10) || 25;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  return { page, pageSize };
}

function applyFilters(items: any[], query: any) {
  const search = String(query?.search || "").trim().toLowerCase();
  const family = optionalEnum(query?.family ?? query?.commercial_family, COMMERCIAL_FAMILIES, "family");
  const readiness = optionalEnum(query?.readiness, READINESS_STATES, "readiness");
  const sellability = optionalEnum(query?.sellability, SELLABILITY_STATUSES, "sellability");
  const buyerType = optionalEnum(query?.buyer_type ?? query?.buyerType, BUYER_TYPES, "buyer_type");
  const commercialForm = optionalEnum(query?.commercial_form ?? query?.commercialForm, COMMERCIAL_FORMS, "commercial_form");
  const sellingEntity = optionalEnum(query?.selling_entity ?? query?.sellingEntity, ENTITY_CLASSIFICATIONS, "selling_entity");
  const deliveryEntity = optionalEnum(query?.delivery_entity ?? query?.deliveryEntity, ENTITY_CLASSIFICATIONS, "delivery_entity");
  const fundingRelationship = optionalEnum(query?.funding_relationship ?? query?.fundingRelationship, FUNDING_RELATIONSHIP_STATUSES, "funding_relationship");
  return items.filter((item) => {
    if (search) {
      const haystack = [item.name, item.shortDescription, item.commercialProductId].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (family && item.family !== family) return false;
    if (readiness && item.readiness !== readiness) return false;
    if (sellability && item.sellability !== sellability) return false;
    if (buyerType && !item.buyerFit?.includes(buyerType)) return false;
    if (commercialForm && !item.commercialForms?.includes(commercialForm)) return false;
    if (sellingEntity && item.sellingEntity !== sellingEntity) return false;
    if (deliveryEntity && item.deliveryEntity !== deliveryEntity) return false;
    if (fundingRelationship && item.fundingRelationship !== fundingRelationship) return false;
    return true;
  });
}

function sortAndPage(items: any[], query: any) {
  const { page, pageSize } = parsePage(query);
  const sort = String(query?.sort || "name").trim();
  if (!SORTS[sort]) throw Object.assign(new Error("sort is invalid."), { code: "INVALID_INPUT" });
  const direction = String(query?.direction || "asc").toLowerCase();
  if (!["asc", "desc"].includes(direction)) throw Object.assign(new Error("direction is invalid."), { code: "INVALID_INPUT" });
  const sorted = [...items].sort((a, b) => {
    const av = String(SORTS[sort](a) ?? "");
    const bv = String(SORTS[sort](b) ?? "");
    return direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  const offset = (page - 1) * pageSize;
  return { page, pageSize, total: sorted.length, items: sorted.slice(offset, offset + pageSize), sort, direction };
}

function mapServiceError(err: any) {
  const raw = err?.code || "";
  if (raw === "COMMERCIAL_PRODUCT_NOT_FOUND") return { status: 404, code: "NOT_FOUND" };
  if (raw === "SERVER_DERIVED_FIELD_FORBIDDEN" || raw === "GOVERNED_STATE_CHANGE_REQUIRED") return { status: 400, code: "INVALID_INPUT" };
  if (raw === "COMMERCIAL_PRODUCT_CAPABILITY_REQUIRED") return { status: 403, code: "FORBIDDEN" };
  if (raw.includes("TRANSITION_REJECTED")) return { status: 400, code: "INVALID_TRANSITION" };
  if (raw.includes("GATE")) return { status: 400, code: raw.includes("AUTHORITY") ? "AUTHORITY_REQUIRED" : "INVALID_GATE" };
  if (raw.includes("DUPLICATE_ACTIVE") || raw.includes("DUPLICATE")) return { status: 409, code: raw.includes("RELATIONSHIP") ? "DUPLICATE_RELATIONSHIP" : "CONFLICT" };
  if (raw.includes("SELF_RELATION") || raw.includes("RELATIONSHIP")) return { status: 400, code: "INVALID_RELATIONSHIP" };
  if (raw.includes("AUTHORITY_REQUIRED") || raw.includes("PROVENANCE")) return { status: 400, code: "AUTHORITY_REQUIRED" };
  if (raw.includes("STALE")) return { status: 409, code: "STALE_RECORD" };
  if (raw.includes("NOT_CONNECTED")) return { status: 503, code: "REGISTRY_NOT_CONNECTED" };
  if (raw.includes("FORBIDDEN")) return { status: 403, code: "FORBIDDEN" };
  if (raw) return { status: err?.statusCode || 400, code: "INVALID_INPUT" };
  return { status: 500, code: "INTERNAL_ERROR" };
}

function handleError(err: any, res: any, next: any) {
  if (err instanceof CommercialProductRegistryServiceError || err?.code === "INVALID_INPUT" || err?.code) {
    const mapped = mapServiceError(err);
    return error(res, mapped.status, mapped.code, err?.message || mapped.code);
  }
  return next(err);
}

async function requireProduct(routeService: CommercialProductRegistryService, id: string, req: any, res: any) {
  const product = await routeService.getProductById(id, actor(req));
  if (!product) {
    error(res, 404, "NOT_FOUND", "Commercial product not found.");
    return null;
  }
  return product;
}

export function registerCommercialProductRegistryRoutes(app: any, routeService = new CommercialProductRegistryService()) {
  app.get(BASE_PATH, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try {
      const projection = await routeService.projectSalesProductReadModel(actor(req));
      const filtered = applyFilters(projection.items, req.query || {});
      return res.json(ok({ ...sortAndPage(filtered, req.query || {}), status: projection.status }));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/sales-read-model`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try {
      const projection = await routeService.projectSalesProductReadModel(actor(req));
      const filtered = applyFilters(projection.items, req.query || {});
      return res.json(ok({ ...sortAndPage(filtered, req.query || {}), status: projection.status }));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/summary`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try {
      const projection = await routeService.projectSalesProductReadModel(actor(req));
      return res.json(ok(projection.summary));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/distributions`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try {
      const projection = await routeService.projectSalesProductReadModel(actor(req));
      return res.json(ok(projection.distributions));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/slug/:slug`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try {
      const product = await routeService.getProductBySlug(String(req.params.slug), actor(req));
      if (!product) return error(res, 404, "NOT_FOUND", "Commercial product not found.");
      return res.json(ok(product));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/:id`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try {
      const detail = await routeService.getProductDetail(String(req.params.id), actor(req));
      if (!detail) return error(res, 404, "NOT_FOUND", "Commercial product not found.");
      return res.json(ok(detail));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.post(BASE_PATH, requireCapability("commercial_product.create"), async (req: any, res: any, next: any) => {
    try {
      const product = await routeService.createProduct(req.body || {}, actor(req));
      return res.status(201).json(ok(product));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.patch(`${BASE_PATH}/:id`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const product = await routeService.updateDescriptiveMetadata(String(req.params.id), req.body || {}, actor(req));
      if (!product) return error(res, 404, "NOT_FOUND", "Commercial product not found.");
      return res.json(ok(product));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.post(`${BASE_PATH}/:id/lifecycle`, async (req: any, res: any, next: any) => {
    try {
      const toState = optionalEnum(req.body?.toState ?? req.body?.to_state ?? req.body?.lifecycleState, PRODUCT_LIFECYCLE_STATES, "toState") as any;
      const capability: CommercialProductGovernanceCapability = toState === "RETIRED" ? "commercial_product.retire" : "commercial_product.transition_lifecycle";
      return requireCapability(capability)(req, res, async () => {
        try {
          const product = await routeService.transitionLifecycle(String(req.params.id), toState, req.body || {}, actor(req));
          return res.json(ok(product));
        } catch (err) {
          return handleError(err, res, next);
        }
      });
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.post(`${BASE_PATH}/:id/readiness-review`, requireCapability("commercial_product.review_readiness"), async (req: any, res: any, next: any) => {
    try {
      const product = await routeService.reviewReadiness(String(req.params.id), req.body || {}, actor(req));
      if (!product) return error(res, 404, "NOT_FOUND", "Commercial product not found.");
      return res.json(ok(product));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.post(`${BASE_PATH}/:id/sellability-review`, requireCapability("commercial_product.review_sellability"), async (req: any, res: any, next: any) => {
    try {
      const product = await routeService.reviewSellability(String(req.params.id), req.body || {}, actor(req));
      if (!product) return error(res, 404, "NOT_FOUND", "Commercial product not found.");
      return res.json(ok(product));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/:id/source-authorities`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try {
      if (!await requireProduct(routeService, String(req.params.id), req, res)) return;
      return res.json(ok({ items: await routeService.listSourceAuthorities(String(req.params.id)) }));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.post(`${BASE_PATH}/:id/source-authorities`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      return res.status(201).json(ok(await routeService.addSourceAuthority(String(req.params.id), req.body || {}, actor(req))));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.patch(`${BASE_PATH}/:id/source-authorities/:sourceReferenceId`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await routeService.updateSourceAuthority(String(req.params.id), { ...(req.body || {}), sourceReferenceId: req.params.sourceReferenceId }, actor(req))));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.post(`${BASE_PATH}/:id/source-authorities/:sourceReferenceId/deactivate`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.deactivateSourceAuthority(String(req.params.id), String(req.params.sourceReferenceId), req.body || {}, actor(req));
      if (!item) return error(res, 404, "NOT_FOUND", "Source authority reference not found.");
      return res.json(ok(item));
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/:id/buyers`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await routeService.listBuyers(String(req.params.id)) })); }
    catch (err) { return handleError(err, res, next); }
  });

  app.post(`${BASE_PATH}/:id/buyers`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const buyerType = optionalEnum(req.body?.buyerType ?? req.body?.buyer_type, BUYER_TYPES, "buyerType") as any;
      return res.status(201).json(ok(await routeService.addBuyerCompatibility(String(req.params.id), buyerType, req.body || {}, actor(req))));
    } catch (err) { return handleError(err, res, next); }
  });

  app.delete(`${BASE_PATH}/:id/buyers/:buyerType`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const buyerType = optionalEnum(req.params.buyerType, BUYER_TYPES, "buyerType") as any;
      return res.json(ok(await routeService.removeBuyerCompatibility(String(req.params.id), buyerType, req.body || {}, actor(req))));
    } catch (err) { return handleError(err, res, next); }
  });

  app.get(`${BASE_PATH}/:id/commercial-forms`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await routeService.listCommercialForms(String(req.params.id)) })); }
    catch (err) { return handleError(err, res, next); }
  });

  app.post(`${BASE_PATH}/:id/commercial-forms`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const form = optionalEnum(req.body?.commercialForm ?? req.body?.commercial_form, COMMERCIAL_FORMS, "commercialForm") as any;
      return res.status(201).json(ok(await routeService.addCommercialForm(String(req.params.id), form, req.body || {}, actor(req))));
    } catch (err) { return handleError(err, res, next); }
  });

  app.delete(`${BASE_PATH}/:id/commercial-forms/:commercialForm`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const form = optionalEnum(req.params.commercialForm, COMMERCIAL_FORMS, "commercialForm") as any;
      return res.json(ok(await routeService.removeCommercialForm(String(req.params.id), form, req.body || {}, actor(req))));
    } catch (err) { return handleError(err, res, next); }
  });

  app.get(`${BASE_PATH}/:id/review-gates`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await routeService.listReviewGates(String(req.params.id)) })); }
    catch (err) { return handleError(err, res, next); }
  });

  app.post(`${BASE_PATH}/:id/review-gates/:gateType`, async (req: any, res: any, next: any) => {
    try {
      const gateType = optionalEnum(req.params.gateType, REVIEW_GATE_TYPES, "gateType");
      const capability = GATE_CAPABILITIES[gateType];
      if (!capability) return error(res, 403, "FORBIDDEN", `${gateType} gate is not exposed without a dedicated capability.`);
      return requireCapability(capability)(req, res, async () => {
        try {
          return res.json(ok(await routeService.manageReviewGate(String(req.params.id), { ...(req.body || {}), gateType }, actor(req))));
        } catch (err) {
          return handleError(err, res, next);
        }
      });
    } catch (err) {
      return handleError(err, res, next);
    }
  });

  app.get(`${BASE_PATH}/:id/funding-relationships`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await routeService.listFundingRelationships(String(req.params.id)) })); }
    catch (err) { return handleError(err, res, next); }
  });

  app.post(`${BASE_PATH}/:id/funding-relationships`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await routeService.manageFundingRelationship(String(req.params.id), req.body || {}, actor(req)))); }
    catch (err) { return handleError(err, res, next); }
  });

  app.get(`${BASE_PATH}/:id/entitlement-references`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await routeService.listEntitlements(String(req.params.id)) })); }
    catch (err) { return handleError(err, res, next); }
  });

  app.post(`${BASE_PATH}/:id/entitlement-references`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await routeService.addEntitlementReference(String(req.params.id), req.body || {}, actor(req)))); }
    catch (err) { return handleError(err, res, next); }
  });

  app.delete(`${BASE_PATH}/:id/entitlement-references/:requirement/:entitlementId`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const requirement = optionalEnum(req.params.requirement, ["REQUIRED", "OPTIONAL"], "requirement") as any;
      return res.json(ok(await routeService.removeEntitlementReference(String(req.params.id), String(req.params.entitlementId), requirement, req.body || {}, actor(req))));
    } catch (err) { return handleError(err, res, next); }
  });

  app.get(`${BASE_PATH}/:id/relationships`, requireCapability("commercial_product.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await routeService.listRelationships(String(req.params.id)) })); }
    catch (err) { return handleError(err, res, next); }
  });

  app.post(`${BASE_PATH}/:id/relationships`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await routeService.addProductRelationship({ ...(req.body || {}), sourceProductId: req.body?.sourceProductId || req.params.id }, actor(req)))); }
    catch (err) { return handleError(err, res, next); }
  });

  app.post(`${BASE_PATH}/:id/relationships/:relationshipId/deactivate`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.deactivateProductRelationship(String(req.params.id), String(req.params.relationshipId), req.body || {}, actor(req));
      if (!item) return error(res, 404, "NOT_FOUND", "Product relationship not found.");
      return res.json(ok(item));
    } catch (err) { return handleError(err, res, next); }
  });

  app.patch(`${BASE_PATH}/:id/regulated-program`, requireCapability("commercial_product.review_regulatory"), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await routeService.updateRegulatedProgramMetadata(String(req.params.id), req.body || {}, actor(req)))); }
    catch (err) { return handleError(err, res, next); }
  });

  app.patch(`${BASE_PATH}/:id/implementation-support`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await routeService.updateImplementationSupportMetadata(String(req.params.id), req.body || {}, actor(req)))); }
    catch (err) { return handleError(err, res, next); }
  });

  app.patch(`${BASE_PATH}/:id/renewal-expansion`, requireCapability("commercial_product.edit"), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await routeService.updateRenewalExpansionMetadata(String(req.params.id), req.body || {}, actor(req)))); }
    catch (err) { return handleError(err, res, next); }
  });

  app.patch(`${BASE_PATH}/:id/social-selling`, requireCapability("commercial_product.review_sponsorship"), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await routeService.updateSocialSellingMetadata(String(req.params.id), req.body || {}, actor(req)))); }
    catch (err) { return handleError(err, res, next); }
  });

  app.patch(`${BASE_PATH}/:id/governance-state`, async (req: any, res: any, next: any) => {
    const payload = req.body || {};
    const capability: CommercialProductGovernanceCapability =
      payload.marginStatus || payload.margin_status ? "commercial_product.review_margin"
        : payload.commissionEligibleStatus || payload.commission_eligible_status ? "commercial_product.review_commission"
        : "commercial_product.review_pricing";
    return requireCapability(capability)(req, res, async () => {
      try { return res.json(ok(await routeService.updateGovernanceState(String(req.params.id), payload, actor(req)))); }
      catch (err) { return handleError(err, res, next); }
    });
  });
}
