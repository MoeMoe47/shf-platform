import {
  BUYER_TYPES,
  COMMERCIAL_FAMILIES,
  COMMERCIAL_FORMS,
  FUNDING_CATEGORIES,
  FUNDING_RELATIONSHIP_STATUSES,
  GOVERNED_DECISION_STATUSES,
  PRODUCT_LIFECYCLE_STATES,
  PRODUCT_TYPES,
  READINESS_STATES,
  REVIEW_GATE_STATUSES,
  REVIEW_GATE_TYPES,
  SELLABILITY_STATUSES,
  SOURCE_AUTHORITY_STATUSES,
  SOURCE_AUTHORITY_TYPES,
  validateProductIdentityContract,
  validateSourceAuthorityReference,
} from "../model/commercial-product-registry-contract.js";

const AUDIT_REF = "docs/sales/commercial-catalog-audit/commercial-candidate-inventory.json";
const DESIGN_REF = "docs/sales/commercial-product-registry-design/initial-32-candidate-design-mapping.json";
const REGULATED_FAMILIES = new Set(["HEALTHCARE_WORKFORCE", "FIRE_PUBLIC_SAFETY", "AVIATION", "APPRENTICESHIP_WBL"]);
const GATE_KEYS: Record<string, string> = {
  commercial_readiness: "COMMERCIAL_READINESS", legal: "LEGAL", tax: "TAX", regulatory: "REGULATORY",
  procurement: "PROCUREMENT", funding: "FUNDING", delivery_capacity: "DELIVERY_CAPACITY",
  evidence_readiness: "EVIDENCE", support_readiness: "SUPPORT", pricing_readiness: "PRICING",
  margin_readiness: "MARGIN", entitlement_readiness: "ENTITLEMENT", partner_readiness: "PARTNER",
};
const PRODUCT_TYPE_CROSSWALK: Record<string, string> = {
  SOFTWARE_LICENSE: "LICENSE",
  ACCESS_LICENSE: "LICENSE",
  PROGRAM_PACKAGE: "PROGRAM",
  PROGRAM_CONCEPTS: "PROGRAM",
  ADVISORY_SERVICE: "PROFESSIONAL_SERVICE",
};
const BUYER_CROSSWALK: Record<string, string> = {
  "K-12 schools": "K12_SCHOOL", schools: "K12_SCHOOL", "school districts": "SCHOOL_DISTRICT",
  "career-tech organizations": "CAREER_TECH", "youth programs": "YOUTH_PROGRAM", "after-school providers": "AFTER_SCHOOL_PROVIDER",
  "summer programs": "SUMMER_PROGRAM", "data center operators": "DATA_CENTER_OPERATOR", employers: "EMPLOYER",
  "workforce boards": "WORKFORCE_BOARD", "American Job Centers": "AMERICAN_JOB_CENTER", "training providers": "TRAINING_PROVIDER",
  hospitals: "HOSPITAL", "nursing facilities": "NURSING_FACILITY", "healthcare employers": "HEALTHCARE_EMPLOYER",
  "fire departments": "FIRE_DEPARTMENT", "public-safety agencies": "PUBLIC_SAFETY_AGENCY", municipalities: "MUNICIPALITY",
  utilities: "UTILITY", contractors: "CONTRACTOR", "apprenticeship sponsors": "APPRENTICESHIP_SPONSOR",
  libraries: "LIBRARY", colleges: "COLLEGE", educators: "TRAINING_PROVIDER",
  foundations: "FOUNDATION",
  philanthropy: "PHILANTHROPY", nonprofits: "NONPROFIT", "community organizations": "COMMUNITY_ORGANIZATION",
  "credit unions": "CREDIT_UNION", banks: "BANK", counties: "COUNTY", "state agencies": "STATE_AGENCY",
  enterprises: "ENTERPRISE", "private schools": "PRIVATE_SCHOOL", unions: "UNION",
  "logistics employers": "LOGISTICS_EMPLOYER", "public safety agencies": "PUBLIC_SAFETY_AGENCY",
};

type InventoryCandidate = Record<string, any> & { id: string; name: string; family: string };
type DesignCandidate = Record<string, any> & { audit_candidate_id: string; commercial_product_id: string };

function sourceType(source: Record<string, any>) {
  const text = `${source.source_authority_type} ${source.source_repository} ${(source.source_paths || []).join(" ")}`.toLowerCase();
  if (/curriculum|lesson|course/.test(text)) return "CURRICULUM";
  if (/career|pathway|opportunit/.test(text)) return "CAREER_REGISTRY";
  if (/service.catalog/.test(text)) return "SERVICE_CATALOG";
  if (/entitlement/.test(text)) return "ENTITLEMENTS";
  if (/funding|grant|incentive/.test(text)) return "FUNDING";
  if (/credential/.test(text)) return "CREDENTIALS";
  if (/reporting/.test(text)) return "REPORTING";
  if (/evidence|verification/.test(text)) return "EVIDENCE";
  if (/contract/.test(text)) return "CONTRACTS";
  return "OTHER_GOVERNED_AUTHORITY";
}

function buyerCode(value: string) {
  if ((BUYER_TYPES as readonly string[]).includes(value)) return value;
  return BUYER_CROSSWALK[value];
}

function canonicalProductType(value: string) {
  if ((PRODUCT_TYPES as readonly string[]).includes(value)) return value;
  return PRODUCT_TYPE_CROSSWALK[value] || "UNKNOWN";
}

function mapEntity(value: string) {
  if (["SHF", "SHS", "PARTNER", "JOINT_STRUCTURE_REVIEW_REQUIRED", "UNKNOWN"].includes(value)) return value;
  if (/JOINT|REQUIRES_LEGAL_REVIEW/.test(value)) return "JOINT_STRUCTURE_REVIEW_REQUIRED";
  return "UNKNOWN";
}

function gateRequirements(candidate: DesignCandidate) {
  const gates = Object.entries(candidate.review_gates || {}).map(([rawType, status]) => ({
    gate_type: GATE_KEYS[rawType] || rawType.toUpperCase(),
    status: String(status),
    reference: `${DESIGN_REF}#${candidate.audit_candidate_id}`,
    reason: `Status preserved from Design-2 mapping (${status}); onboarding does not assert approval.`,
  }));
  return gates;
}

function hasOnlyNonAuthoritativeSource(candidate: InventoryCandidate) {
  const evidence = `${candidate.source_authority} ${(candidate.source_paths || []).join(" ")}`.toLowerCase();
  return /store seed\/demo|front-end demo|fixture data|shf v1 audit docs/.test(evidence);
}

function fundingMetadata(inventory: InventoryCandidate, design: DesignCandidate) {
  const raw = String(inventory.funding_relationship || "").toUpperCase();
  const mappingStatus = String(design.funding_relationship_status || "").toUpperCase();
  const status = (FUNDING_RELATIONSHIP_STATUSES as readonly string[]).includes(mappingStatus)
    ? mappingStatus
    : (FUNDING_RELATIONSHIP_STATUSES as readonly string[]).includes(raw) ? raw : "REVIEW_REQUIRED";
  const categoryValue = raw === "COMMERCIAL_SHS_REVENUE" ? "SHS_COMMERCIAL_REVENUE" : raw;
  const category = (FUNDING_CATEGORIES as readonly string[]).includes(categoryValue) ? categoryValue : null;
  return { status, categories: category ? [category] : [], source_value: inventory.funding_relationship || null };
}

export function buildCommercialProductOnboardingManifest(inventory: any, designMapping: any) {
  const inventoryCandidates = new Map<string, InventoryCandidate>((inventory.candidates || []).map((c: InventoryCandidate) => [c.id, c]));
  const designCandidates = new Map<string, DesignCandidate>((designMapping.candidates || []).map((c: DesignCandidate) => [c.audit_candidate_id, c]));
  const ids = new Set([...inventoryCandidates.keys(), ...designCandidates.keys()]);
  const candidates = [...ids].sort().map((candidateId) => {
    const audited = inventoryCandidates.get(candidateId);
    const design = designCandidates.get(candidateId);
    if (!audited || !design) throw new Error(`CANDIDATE_MAPPING_MISSING:${candidateId}`);
    const rawSources = design.source_authorities || [];
    const sourceAuthorities = rawSources.flatMap((source: Record<string, any>) => {
      const status = String(source.source_status || audited.found_status || "UNKNOWN");
      if (!(SOURCE_AUTHORITY_STATUSES as readonly string[]).includes(status) || status === "NOT_FOUND" || hasOnlyNonAuthoritativeSource(audited)) return [];
      return (source.source_paths || audited.source_paths || []).filter((ref: string) => !/^keyword scan:/i.test(ref)).map((sourceRecordId: string) => ({
        source_authority_type: sourceType(source),
        source_authority_id: null,
        source_domain: source.source_authority_type || audited.source_authority || null,
        source_record_id: sourceRecordId,
        source_version: null,
        source_status: status,
        source_last_verified_at: null,
        source_provenance: [source.source_provenance || audited.evidence_notes || `Audited source mapping for ${candidateId}.`, `${AUDIT_REF}#${candidateId}`],
      }));
    });
    const mappedType = canonicalProductType(design.product_type);
    const family = String(design.commercial_family || audited.family);
    const rawForms: string[] = design.commercial_forms || [];
    const commercialForms = [...new Set(rawForms.filter((x) => (COMMERCIAL_FORMS as readonly string[]).includes(x)))];
    const unmappedForms = [...new Set(rawForms.filter((x) => !(COMMERCIAL_FORMS as readonly string[]).includes(x)))];
    const buyerTypes = [...new Set((design.buyer_types || []).map(buyerCode).filter(Boolean))];
    const unmappedBuyerTypes = [...new Set((design.buyer_types || []).filter((x: string) => !buyerCode(x)))];
    const sourceLifecycle = String(design.lifecycle_state || "DISCOVERED");
    let lifecycle = sourceLifecycle;
    const readiness = String(audited.readiness || design.readiness || "UNKNOWN");
    const sellability = String(audited.sellability_status || design.sellability_status || "NEEDS_REVIEW");
    const missingSource = sourceAuthorities.length === 0;
    const contractIssues: string[] = [];
    if (!(COMMERCIAL_FAMILIES as readonly string[]).includes(family)) contractIssues.push(`unsupported_family:${family}`);
    if (!(PRODUCT_TYPES as readonly string[]).includes(mappedType)) contractIssues.push(`unsupported_product_type:${mappedType}`);
    if (!(READINESS_STATES as readonly string[]).includes(readiness)) contractIssues.push(`unsupported_readiness:${readiness}`);
    if (!(SELLABILITY_STATUSES as readonly string[]).includes(sellability)) contractIssues.push(`unsupported_sellability:${sellability}`);
    if (unmappedBuyerTypes.length) contractIssues.push(`unmapped_buyer_types:${unmappedBuyerTypes.join(",")}`);
    const canonicalName = String(design.canonical_name || audited.name).trim();
    const slug = String(design.slug || "").trim();
    const proposedId = String(design.commercial_product_id || "").trim();
    if (!canonicalName || !slug || !proposedId) contractIssues.push("product_identity_incomplete");
    const sourceForSellability = sourceAuthorities[0];
    const readinessSource = sourceAuthorities.length ? sourceAuthorities : [];
    const readinessReason = String(audited.evidence_notes || audited.notes || "Readiness preserved from audited candidate classification.");
    const sellabilityReason = String(audited.notes || audited.evidence_notes || "Sellability preserved from audited candidate classification.");
    const reviews = new Set<string>();
    for (const [raw, mapped] of Object.entries(GATE_KEYS)) {
      const gateValue = design.review_gates?.[raw];
      if (gateValue === "PENDING" || gateValue === "BLOCKED") {
        if (mapped === "COMMERCIAL_READINESS") reviews.add("COMMERCIAL_READINESS_REVIEW_REQUIRED");
        else if (mapped === "LEGAL") reviews.add("LEGAL_REVIEW_REQUIRED");
        else if (mapped === "REGULATORY") reviews.add("REGULATORY_REVIEW_REQUIRED");
        else if (mapped === "PRICING") reviews.add("PRICING_REVIEW_REQUIRED");
        else if (mapped === "MARGIN") reviews.add("MARGIN_REVIEW_REQUIRED");
        else if (mapped === "ENTITLEMENT") reviews.add("ENTITLEMENT_REVIEW_REQUIRED");
        else if (mapped === "FUNDING") reviews.add("FUNDING_REVIEW_REQUIRED");
        else if (mapped === "PARTNER") reviews.add("PARTNER_REVIEW_REQUIRED");
        else if (mapped === "DELIVERY_CAPACITY") reviews.add("DELIVERY_CAPACITY_REVIEW_REQUIRED");
        else if (mapped === "EVIDENCE") reviews.add("EVIDENCE_REVIEW_REQUIRED");
        else if (mapped === "SUPPORT") reviews.add("SUPPORT_REVIEW_REQUIRED");
      }
    }
    if (unmappedForms.length) reviews.add("COMMERCIAL_FORM_MAPPING_REVIEW_REQUIRED");
    if (mappedType === "UNKNOWN") reviews.add("PRODUCT_TYPE_REVIEW_REQUIRED");
    if (REGULATED_FAMILIES.has(family)) reviews.add("REGULATORY_REVIEW_REQUIRED");
    if (mapEntity(design.selling_entity) === "JOINT_STRUCTURE_REVIEW_REQUIRED") reviews.add("PARTNER_REVIEW_REQUIRED");
    if (missingSource) reviews.add("SOURCE_AUTHORITY_MISSING");
    const funding = fundingMetadata(audited, design);
    if (!funding.categories.length && funding.status !== "NOT_FOUND") reviews.add("FUNDING_REVIEW_REQUIRED");
    const entityReviewFlags = [
      ["legal", "LEGAL_REVIEW_REQUIRED"], ["tax", "TAX_REVIEW_REQUIRED"], ["regulatory", "REGULATORY_REVIEW_REQUIRED"],
      ["procurement", "PROCUREMENT_REVIEW_REQUIRED"], ["funding", "FUNDING_REVIEW_REQUIRED"],
    ].filter(([key]) => ["PENDING", "BLOCKED"].includes(String(design.review_gates?.[key]))).map(([, flag]) => flag);
    if (reviews.size || sourceLifecycle === "PILOT_READY") lifecycle = "REVIEW";
    if (!(PRODUCT_LIFECYCLE_STATES as readonly string[]).includes(lifecycle)) contractIssues.push(`unsupported_lifecycle:${lifecycle}`);
    let disposition = "READY_TO_REGISTER";
    if (contractIssues.length) disposition = "CONTRACT_INVALID";
    else if (missingSource) disposition = "SOURCE_AUTHORITY_MISSING";
    else if (reviews.size || lifecycle === "REVIEW") disposition = "REVIEW_REQUIRED";
    const auditRefs = [`${AUDIT_REF}#${candidateId}`, `${DESIGN_REF}#${candidateId}`];
    const relationships = (design.product_relationships || []).map((r: Record<string, any>) => ({
      target_candidate_id: r.target_candidate_id,
      relationship_type: r.relationship_type,
      direction: r.direction,
      status: r.status || "UNKNOWN",
      provenance: r.provenance || auditRefs,
    }));
    return {
      candidate_id: candidateId,
      candidate_name: audited.name,
      proposed_commercial_product_id: proposedId,
      canonical_name: canonicalName,
      display_name: String(design.display_name || audited.name),
      slug,
      family,
      subfamily: design.subfamily || null,
      product_type: mappedType,
      source_product_type: design.product_type,
      lifecycle,
      readiness,
      readiness_reason: readinessReason,
      readiness_source: readinessSource,
      sellability,
      sellability_reason: sellabilityReason,
      sellability_source: sourceForSellability || null,
      selling_entity: mapEntity(design.selling_entity || audited.selling_entity || "UNKNOWN"),
      delivery_entity: mapEntity(design.delivery_entity || audited.delivery_entity || "UNKNOWN"),
      partner_required: mapEntity(design.delivery_entity || audited.delivery_entity || "UNKNOWN") === "PARTNER" || mapEntity(design.selling_entity || audited.selling_entity || "UNKNOWN") === "JOINT_STRUCTURE_REVIEW_REQUIRED",
      joint_structure_required: mapEntity(design.selling_entity || audited.selling_entity || "UNKNOWN") === "JOINT_STRUCTURE_REVIEW_REQUIRED",
      entity_review_flags: entityReviewFlags,
      entity_mapping_note: design.selling_entity && mapEntity(design.selling_entity) !== design.selling_entity ? `Mapped '${design.selling_entity}' to JOINT_STRUCTURE_REVIEW_REQUIRED.` : null,
      source_authorities: sourceAuthorities,
      buyer_types: buyerTypes,
      unmapped_buyer_types: unmappedBuyerTypes,
      commercial_forms: commercialForms,
      unmapped_commercial_forms: unmappedForms,
      funding_relationships: [funding],
      entitlement_refs: design.entitlement_refs || [],
      product_relationships: relationships,
      regulated_metadata: {
        program_types: [],
        regulatory_authority: null,
        external_training_authority_required: REGULATED_FAMILIES.has(family) || (audited.regulatory_flags || []).includes("REGULATORY_REVIEW") ? "PENDING" : "UNKNOWN",
        credential_authority: null,
        partner_required: mapEntity(design.delivery_entity || audited.delivery_entity || "UNKNOWN") === "PARTNER" || mapEntity(design.selling_entity || audited.selling_entity || "UNKNOWN") === "JOINT_STRUCTURE_REVIEW_REQUIRED",
        scope_limitations: [...(audited.regulatory_flags || [])],
        sales_language_restrictions: REGULATED_FAMILIES.has(family) ? ["No credential, licensure, or external certification claim without authority evidence."] : [],
      },
      pricing_metadata: { pricing_status: design.pricing_status === "UNKNOWN" ? "NOT_DEFINED" : design.pricing_status || "NOT_DEFINED", source_status: design.pricing_status || "UNKNOWN", pricing_model: null, pricing_authority: null, pricing_reference: null },
      margin_metadata: { margin_status: design.margin_status || "UNKNOWN", commercial_viability_status: "UNKNOWN", cost_model_reference: null, gross_margin_class: null, minimum_margin_policy: null },
      commission_metadata: { commission_eligible_status: design.commission_eligible_status || "UNKNOWN", commission_policy_reference: null, leadership_override_eligible: "UNKNOWN", renewal_commission_eligible: "UNKNOWN", expansion_commission_eligible: "UNKNOWN" },
      implementation_metadata: { implementation_required: "UNKNOWN", implementation_tier: "UNKNOWN", implementation_owner: null },
      support_metadata: { support_required: "UNKNOWN", support_tier: "UNKNOWN", managed_service_available: "UNKNOWN", sla_status: "UNKNOWN", training_required: "UNKNOWN", professional_development_available: "UNKNOWN" },
      renewal_metadata: { renewal_model: design.renewal_model || "UNKNOWN", renewal_term: null, renewal_window: null },
      expansion_paths: design.expansion_paths || [],
      source_expansion_status: design.expansion_status || "UNKNOWN",
      review_requirements: [...reviews].sort(),
      review_gates: gateRequirements(design),
      blockers: [...(design.blockers || [])],
      missing_authority: missingSource ? [{ authority: audited.source_authority || "UNKNOWN", references: audited.source_paths || [], reason: audited.evidence_notes || audited.notes || "No credible governed source authority was found." }] : [],
      unblock_conditions: missingSource ? ["Provide a governed source authority and canonical source record; demo, fixture, keyword scan, or audit-gap evidence alone is insufficient."] : [],
      contract_validation_issues: contractIssues,
      onboarding_disposition: disposition,
      registration_allowed: disposition === "READY_TO_REGISTER" || disposition === "REVIEW_REQUIRED",
      onboarding_reason: disposition === "READY_TO_REGISTER"
        ? "Minimum identity, contract vocabulary, lifecycle/readiness/sellability state, entity state, and source reference are present. Registration does not imply sale approval."
        : disposition === "REVIEW_REQUIRED"
          ? "Minimum record identity and source evidence are sufficient for registration in REVIEW. Required authorities or governance decisions remain unresolved; registration is not approval."
        : disposition === "SOURCE_AUTHORITY_MISSING"
          ? "No credible governed source authority is available; audit discovery alone cannot create a canonical product record."
          : "The candidate mapping does not satisfy the canonical 3A contract and must be reconciled before registration.",
      source_audit_refs: auditRefs,
      version: 1,
    };
  });
  const canonicalNames = new Map<string, string>();
  for (const candidate of candidates) {
    const key = candidate.canonical_name.toLowerCase();
    const previous = canonicalNames.get(key);
    if (previous) {
      candidate.onboarding_disposition = "REJECTED_DUPLICATE";
      candidate.registration_allowed = false;
      candidate.onboarding_reason = `Canonical name duplicates ${previous}.`;
    } else canonicalNames.set(key, candidate.candidate_id);
  }
  const productIds = new Map<string, string>();
  for (const candidate of candidates) {
    const previous = productIds.get(candidate.proposed_commercial_product_id);
    if (previous) {
      candidate.onboarding_disposition = "REJECTED_DUPLICATE";
      candidate.registration_allowed = false;
      candidate.onboarding_reason = `Product identity duplicates ${previous}.`;
    } else productIds.set(candidate.proposed_commercial_product_id, candidate.candidate_id);
  }
  return {
    manifest_id: "SHU-COMMERCIAL-PRODUCT-REGISTRY-4A",
    generated_from: { audit: AUDIT_REF, design_mapping: DESIGN_REF },
    registry_contract: "apps/shs-api/src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts",
    generated_at: "2026-10-05",
    default_mode: "DRY_RUN",
    production_execution_performed: false,
    candidates,
  };
}

export function validateOnboardingCandidate(candidate: any) {
  const errors: string[] = [];
  try {
    validateProductIdentityContract({
      commercialProductId: candidate.proposed_commercial_product_id,
      canonicalName: candidate.canonical_name,
      displayName: candidate.display_name,
      slug: candidate.slug,
      commercialFamily: candidate.family,
      productType: candidate.product_type,
      version: candidate.version,
      status: "ACTIVE",
    });
  } catch (error: any) { errors.push(error.message); }
  for (const [field, values] of [["lifecycle", PRODUCT_LIFECYCLE_STATES], ["readiness", READINESS_STATES], ["sellability", SELLABILITY_STATUSES]] as const) {
    if (!(values as readonly string[]).includes(candidate[field])) errors.push(`UNSUPPORTED_${field.toUpperCase()}:${candidate[field]}`);
  }
  for (const source of candidate.source_authorities || []) {
    try {
      validateSourceAuthorityReference({
        sourceAuthorityType: source.source_authority_type,
        sourceAuthorityId: source.source_authority_id || undefined,
        sourceDomain: source.source_domain || undefined,
        sourceRecordId: source.source_record_id,
        sourceVersion: source.source_version || undefined,
        sourceStatus: source.source_status,
        sourceProvenance: source.source_provenance,
      });
    } catch (error: any) { errors.push(error.message); }
  }
  for (const value of candidate.buyer_types || []) if (!(BUYER_TYPES as readonly string[]).includes(value)) errors.push(`UNSUPPORTED_BUYER_TYPE:${value}`);
  for (const value of candidate.commercial_forms || []) if (!(COMMERCIAL_FORMS as readonly string[]).includes(value)) errors.push(`UNSUPPORTED_COMMERCIAL_FORM:${value}`);
  for (const gate of candidate.review_gates || []) {
    if (!(REVIEW_GATE_TYPES as readonly string[]).includes(gate.gate_type)) errors.push(`UNSUPPORTED_GATE_TYPE:${gate.gate_type}`);
    if (!(REVIEW_GATE_STATUSES as readonly string[]).includes(gate.status)) errors.push(`UNSUPPORTED_GATE_STATUS:${gate.status}`);
  }
  for (const funding of candidate.funding_relationships || []) {
    if (!(FUNDING_RELATIONSHIP_STATUSES as readonly string[]).includes(funding.status)) errors.push(`UNSUPPORTED_FUNDING_STATUS:${funding.status}`);
    for (const category of funding.categories || []) if (!(FUNDING_CATEGORIES as readonly string[]).includes(category)) errors.push(`UNSUPPORTED_FUNDING_CATEGORY:${category}`);
    if ("eligibilityStatus" in funding || "eligible" in funding || "customerEligibility" in funding) errors.push("FUNDING_ELIGIBILITY_NOT_REGISTRY_AUTHORITY");
  }
  if (candidate.source_authorities?.length === 0) errors.push("SOURCE_AUTHORITY_REQUIRED");
  if (!candidate.readiness_reason || !candidate.sellability_reason || !candidate.sellability_source) errors.push("GOVERNED_STATE_PROVENANCE_REQUIRED");
  return errors;
}

export async function runOnboarding({ manifest, service, actor, mode = "DRY_RUN" }: {
  manifest: any; service: any; actor: Record<string, any>; mode?: "DRY_RUN" | "APPLY";
}) {
  const results = [];
  const duplicateIds = new Set<string>();
  for (const candidate of manifest.candidates) {
    const validationErrors = validateOnboardingCandidate(candidate);
    const duplicate = duplicateIds.has(candidate.proposed_commercial_product_id);
    duplicateIds.add(candidate.proposed_commercial_product_id);
    if (duplicate) {
      results.push({ candidate_id: candidate.candidate_id, disposition: "REJECTED_DUPLICATE", validation_errors: ["DUPLICATE_PRODUCT_ID"], inserted: false });
      continue;
    }
    if (!candidate.registration_allowed) {
      results.push({ candidate_id: candidate.candidate_id, disposition: candidate.onboarding_disposition, validation_errors: validationErrors, inserted: false, reason: candidate.onboarding_reason });
      continue;
    }
    if (validationErrors.length) {
      results.push({ candidate_id: candidate.candidate_id, disposition: "CONTRACT_INVALID", validation_errors: validationErrors, inserted: false });
      continue;
    }
    const existingDetail = await service.getProductDetail(candidate.proposed_commercial_product_id, actor);
    const existing = existingDetail?.product;
    if (existing) {
      const identical = existing.canonical_name === candidate.canonical_name && existing.display_name === candidate.display_name &&
        existing.slug === candidate.slug && existing.commercial_family === candidate.family && existing.product_type === candidate.product_type &&
        existing.lifecycle_state === candidate.lifecycle && existing.readiness === candidate.readiness && existing.readiness_reason === candidate.readiness_reason &&
        existing.sellability === candidate.sellability && existing.sellability_reason === candidate.sellability_reason &&
        existing.selling_entity === candidate.selling_entity && existing.delivery_entity === candidate.delivery_entity &&
        JSON.stringify(existing.entity_review_flags || []) === JSON.stringify(candidate.entity_review_flags || []);
      if (!identical) {
        results.push({ candidate_id: candidate.candidate_id, disposition: "CONFLICT", inserted: false, reason: "Existing product identity or governed state differs from manifest." });
        continue;
      }
    }
    if (mode === "DRY_RUN") {
      results.push({ candidate_id: candidate.candidate_id, disposition: existing ? "ALREADY_REGISTERED" : candidate.onboarding_disposition, inserted: false, dry_run: true });
      continue;
    }
    const product = existing || await service.createProduct({
      commercialProductId: candidate.proposed_commercial_product_id,
      canonicalName: candidate.canonical_name,
      displayName: candidate.display_name,
      slug: candidate.slug,
      commercialFamily: candidate.family,
      subfamily: candidate.subfamily || undefined,
      productType: candidate.product_type,
      lifecycleState: candidate.lifecycle,
      readiness: candidate.readiness,
      readinessReason: candidate.readiness_reason,
      readinessAuthority: candidate.readiness_source[0]?.source_domain || "commercial-catalog-audit",
      sellability: candidate.sellability,
      sellabilityReason: candidate.sellability_reason,
      sellabilityAuthority: candidate.sellability_source?.source_domain || "commercial-catalog-audit",
      sellingEntity: candidate.selling_entity,
      deliveryEntity: candidate.delivery_entity,
      partnerRequired: candidate.partner_required,
      jointStructureRequired: candidate.joint_structure_required,
      entityReviewFlags: candidate.entity_review_flags,
      sourceAuthorities: candidate.source_authorities,
      buyerCompatibility: candidate.buyer_types,
      commercialForms: candidate.commercial_forms,
      sourceChannel: "commercial-product-registry-4a-onboarding",
      correlationId: `cpr_4a_${candidate.candidate_id}`,
    }, actor);
    const detail = existingDetail || await service.getProductDetail(product.commercial_product_id, actor);
    const sourceKeys = new Set((detail.sourceAuthorities || []).map((s: any) => `${s.source_authority_type}|${s.source_domain || ""}|${s.source_record_id}|${s.source_status}`));
    for (const source of candidate.source_authorities || []) {
      const key = `${source.source_authority_type}|${source.source_domain || ""}|${source.source_record_id}|${source.source_status}`;
      if (!sourceKeys.has(key)) await service.addSourceAuthority(product.commercial_product_id, source, actor);
    }
    const buyers = new Set((detail.buyers || []).map((b: any) => b.buyer_type));
    for (const buyer of candidate.buyer_types || []) if (!buyers.has(buyer)) await service.addBuyerCompatibility(product.commercial_product_id, buyer, {}, actor);
    const forms = new Set((detail.commercialForms || []).map((f: any) => f.commercial_form));
    for (const form of candidate.commercial_forms || []) if (!forms.has(form)) await service.addCommercialForm(product.commercial_product_id, form, {}, actor);
    const existingGates = new Map((detail.reviewGates || []).map((g: any) => [g.gate_type, g]));
    for (const gate of candidate.review_gates || []) {
      const stored = existingGates.get(gate.gate_type) as any;
      if (stored && stored.status !== gate.status) throw Object.assign(new Error(`ONBOARDING_GATE_CONFLICT:${gate.gate_type}`), { code: "CONFLICT" });
      if (stored) continue;
      await service.manageReviewGate(product.commercial_product_id, {
        gateType: gate.gate_type,
        status: gate.status,
        reference: gate.reference,
        reason: gate.reason,
        reviewedAt: null,
        sourceChannel: "commercial-product-registry-4a-onboarding",
        correlationId: `cpr_4a_${candidate.candidate_id}`,
      }, actor);
    }
    const fundingRows = new Map((detail.fundingRelationships || []).map((f: any) => [f.funding_category, f]));
    for (const funding of candidate.funding_relationships || []) {
      for (const category of funding.categories || []) {
        const stored = fundingRows.get(category) as any;
        if (stored && stored.funding_relationship_status !== funding.status) throw Object.assign(new Error(`ONBOARDING_FUNDING_CONFLICT:${category}`), { code: "CONFLICT" });
        if (!stored) await service.manageFundingRelationship(product.commercial_product_id, {
          status: funding.status,
          category,
          limitations: ["Product compatibility metadata only; no applicant screening or award determination."],
          provenance: candidate.source_audit_refs,
          sourceChannel: "commercial-product-registry-4a-onboarding",
          correlationId: `cpr_4a_${candidate.candidate_id}`,
        }, actor);
      }
    }
    if (!detail.regulatedProgram && (candidate.regulated_metadata?.external_training_authority_required !== "UNKNOWN" || candidate.regulated_metadata?.partner_required)) {
      await service.updateRegulatedProgramMetadata(product.commercial_product_id, candidate.regulated_metadata, actor);
    }
    if (!detail.implementationSupport) await service.updateImplementationSupportMetadata(product.commercial_product_id, {
      ...candidate.implementation_metadata, ...candidate.support_metadata,
    }, actor);
    if (!detail.renewalExpansion) await service.updateRenewalExpansionMetadata(product.commercial_product_id, {
      ...candidate.renewal_metadata,
      expansionPaths: candidate.expansion_paths,
    }, actor);
    if (!detail.governanceState) await service.updateGovernanceState(product.commercial_product_id, {
      pricingStatus: candidate.pricing_metadata.pricing_status,
      marginStatus: candidate.margin_metadata.margin_status,
      commercialViabilityStatus: candidate.margin_metadata.commercial_viability_status,
      commissionEligibleStatus: candidate.commission_metadata.commission_eligible_status,
      leadershipOverrideEligible: candidate.commission_metadata.leadership_override_eligible,
      renewalCommissionEligible: candidate.commission_metadata.renewal_commission_eligible,
      expansionCommissionEligible: candidate.commission_metadata.expansion_commission_eligible,
      revenueClassifications: [],
    }, actor);
    results.push({ candidate_id: candidate.candidate_id, disposition: existing ? "RECONCILED_EXISTING" : "REGISTERED", inserted: !existing, commercial_product_id: product.commercial_product_id });
  }
  return { mode, results };
}

export const ONBOARDING_CONTRACT_ENUMS = {
  COMMERCIAL_FAMILIES, PRODUCT_TYPES, PRODUCT_LIFECYCLE_STATES, READINESS_STATES, SELLABILITY_STATUSES,
  COMMERCIAL_FORMS, BUYER_TYPES, SOURCE_AUTHORITY_TYPES, SOURCE_AUTHORITY_STATUSES, REVIEW_GATE_TYPES,
  REVIEW_GATE_STATUSES, FUNDING_RELATIONSHIP_STATUSES, FUNDING_CATEGORIES, GOVERNED_DECISION_STATUSES,
};
