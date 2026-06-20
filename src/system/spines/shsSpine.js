export const SHS_SPINE_DEFINITION = Object.freeze({
  id: "shs_spine",
  name: "SHS Spine",
  role: "Operational, private, client, and business source spine for SHS activity.",
  owns: Object.freeze([
    "client activity",
    "project activity",
    "ClientOps records",
    "Production Ops records",
    "Sales Ops records",
    "Website Studio activity",
    "WebMaker activity",
    "BuilderHub activity",
    "reports workflow",
    "maintenance",
    "tickets",
    "service delivery",
    "QA notes",
    "upgrade opportunities",
  ]),
  doesNotOwn: Object.freeze([
    "public SHF impact publication",
    "public approval",
    "Truth Spine verification",
    "Oracle rulings",
    "SHF Impact Data Spine mutation",
  ]),
});

export const SHF_SPINE_DEFINITION = Object.freeze({
  id: "shf_spine",
  name: "SHF Spine",
  role: "Nonprofit, foundation, and public-approved impact spine for governed SHF impact data.",
  owns: Object.freeze([
    "approved aggregate impact counts",
    "approved county impact metrics",
    "approved program outcomes",
    "approved public stories",
    "approved public report metadata",
    "approved public map records",
  ]),
  doesNotOwn: Object.freeze([
    "raw SHS client data",
    "private SHS operational records",
    "internal SHS notes",
    "billing or support state",
    "unverified operational data",
  ]),
});

export const SHS_TO_SHF_DATA_FLOW_RULES = Object.freeze([
  "SHS Spine is upstream operational source context.",
  "SHF Spine is downstream governed/public impact context.",
  "SHS data may cross only through Source Registry, Data Federation, Data Aggregator, Data Normalization, Evidence Package, Data Verification, Truth Spine, Oracle, Data Approval, Security / Privacy, Data Ownership / IP, Readiness Gate, Public Approval, and Data Approval Gateway as applicable.",
  "Private or client-specific SHS data must remain in SHS unless explicitly approved, de-identified or aggregated, and public-approved.",
  "This advisory file cannot mark records public-approved, mutate SHF Impact Data Spine, or publish reports.",
]);

export const SHS_PRIVATE_DATA_CATEGORIES = Object.freeze([
  "client_private_data",
  "internal_business_data",
  "support_ticket",
  "maintenance_detail",
  "billing_payment_support_status",
  "private_operational_note",
  "private_qa_note",
  "internal_sales_note",
  "client_specific_business_metric",
  "raw_form_submission",
  "unverified_operational_data",
  "pii_sensitive_data",
  "ownership_privacy_blocked_data",
]);

export const SHS_CLIENTOPS_SPINE_METADATA = Object.freeze({
  sourceId: "shs_clientops_center",
  sourceSurface: "ClientOps",
  sourceRole: "SHS_SPINE_SOURCE",
  dataClassification: "PRIVATE_OPERATIONAL",
  defaultPublicImpactCandidate: false,
  reportCandidate: true,
  publicImpactCandidateRule: "Only after Source Registry, governance review, Truth Spine, approval gates, and Data Approval Gateway.",
  allowedOutboundBoundary: "Adapter/Batch Import/Source Registry and downstream governance only.",
  blockedFrom: Object.freeze([
    "direct SHF public surfaces",
    "direct SHF Impact Data Spine mutation",
    "direct public approval",
    "direct public report publishing",
  ]),
  categories: Object.freeze([
    "client_private",
    "operational",
    "support_ticket",
    "maintenance",
    "project_health",
    "version_history",
    "upgrade_opportunity",
    "monthly_review",
    "handoff_file",
    "report_candidate",
  ]),
});

export const SHS_PRODUCTION_OPS_SPINE_METADATA = Object.freeze({
  sourceId: "shs_production_ops",
  sourceSurface: "Production Ops",
  sourceRole: "SHS_SPINE_SOURCE",
  dataClassification: "PRIVATE_OPERATIONAL",
  lifecycleClassification: "PRE_LAUNCH_OPERATIONAL",
  defaultPublicImpactCandidate: false,
  reportCandidate: true,
  clientOpsHandoffCandidate: true,
  clientOpsHandoffRule: "Only after QA/delivery readiness and launch handoff review.",
  publicImpactCandidateRule: "Only after Source Registry, governance review, Truth Spine, approval gates, and Data Approval Gateway.",
  allowedOutboundBoundary: "ClientOps handoff or Adapter/Batch Import/Source Registry and downstream governance only.",
  blockedFrom: Object.freeze([
    "direct SHF public surfaces",
    "direct SHF Impact Data Spine mutation",
    "direct public approval",
    "direct public report publishing",
  ]),
  categories: Object.freeze([
    "pre_launch_operational",
    "client_private",
    "sales_handoff",
    "project_scope",
    "build_packet",
    "brand_profile",
    "page_intent",
    "layout_blueprint",
    "visual_treatment",
    "asset_governance",
    "data_binding",
    "mock_review",
    "screenshot_qa",
    "qa_delivery",
    "launch_handoff",
    "clientops_handoff_candidate",
    "report_candidate",
  ]),
});

export const SHS_TO_SHF_ALLOWED_PUBLIC_CATEGORIES = Object.freeze([
  "approved_aggregate_impact_count",
  "approved_county_impact_metric",
  "approved_program_outcome",
  "approved_workforce_outcome",
  "approved_youth_education_outcome",
  "approved_public_story",
  "approved_non_sensitive_service_category",
  "approved_public_report_metadata",
  "approved_public_map_record",
]);

function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function hasBlockingReview(record = {}) {
  return Boolean(
    record.securityPrivacyBlocked ||
      record.privacyBlocked ||
      record.ownershipBlocked ||
      record.hasPii ||
      record.hasSensitiveData ||
      record.privateClientData
  );
}

export function isShsPrivateOperationalCategory(category) {
  return SHS_PRIVATE_DATA_CATEGORIES.includes(normalizeCategory(category));
}

export function isEligibleForShfSpineTransfer(record = {}) {
  const category = normalizeCategory(record.category || record.recordCategory || record.dataCategory);
  const approvedCategory = SHS_TO_SHF_ALLOWED_PUBLIC_CATEGORIES.includes(category);

  return Boolean(
    approvedCategory &&
      record.publicApproved === true &&
      record.dataApprovalGatewayApproved === true &&
      record.truthStatus === "verified" &&
      !hasBlockingReview(record)
  );
}

export function getShsToShfTransferWarnings(record = {}) {
  const warnings = [];
  const category = normalizeCategory(record.category || record.recordCategory || record.dataCategory);

  if (isShsPrivateOperationalCategory(category)) warnings.push("private_shs_operational_category");
  if (!SHS_TO_SHF_ALLOWED_PUBLIC_CATEGORIES.includes(category)) warnings.push("category_not_allowed_for_shf_spine");
  if (record.publicApproved !== true) warnings.push("missing_public_approval");
  if (record.dataApprovalGatewayApproved !== true) warnings.push("missing_data_approval_gateway_approval");
  if (record.truthStatus !== "verified") warnings.push("missing_truth_spine_verification");
  if (hasBlockingReview(record)) warnings.push("security_privacy_or_ownership_blocker");

  return warnings;
}
