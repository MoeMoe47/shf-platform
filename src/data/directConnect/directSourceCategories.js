export const DIRECT_SOURCE_APPROVED_CATEGORIES = [
  {
    category_id: "client_supplied_document",
    label: "Client Supplied Document",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Client-provided document reference for SHS internal verification review.",
  },
  {
    category_id: "partner_attestation",
    label: "Partner Attestation",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Partner-supplied attestation or signed confirmation reference.",
  },
  {
    category_id: "internal_shs_operational_record",
    label: "Internal SHS Operational Record",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Internal SHS production, ClientOps, QA, or launch record.",
  },
  {
    category_id: "internal_shs_report",
    label: "Internal SHS Report",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Internal report draft or report-readiness record.",
  },
  {
    category_id: "public_agency_record",
    label: "Public Agency Record",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Public agency record reference captured manually for verification review.",
  },
  {
    category_id: "public_dataset_reference",
    label: "Public Dataset Reference",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Public dataset citation or record locator.",
  },
  {
    category_id: "manual_review_record",
    label: "Manual Review Record",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Operator-created review note with source owner and evidence reference.",
  },
  {
    category_id: "system_export_reference",
    label: "System Export Reference",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Manual reference to a system export already supplied to SHS.",
  },
  {
    category_id: "audit_review_record",
    label: "Audit Review Record",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Internal audit or trace review reference.",
  },
  {
    category_id: "governance_review_record",
    label: "Governance Review Record",
    status: "approved_local",
    live_connection_enabled: false,
    credential_required: false,
    description: "Governance review record connected to approval or readiness pathways.",
  },
];

export const DIRECT_SOURCE_DEFERRED_CATEGORIES = [
  "bank_account_connection",
  "financial_account_aggregation",
  "payment_processor_connection",
  "payroll_connection",
  "EHR_connection",
  "live_case_management_connection",
  "live_government_api_connection",
  "private_system_scraping",
].map((category_id) => ({
  category_id,
  status: "deferred",
  live_connection_enabled: false,
  credential_required: false,
  description: "Deferred source type. Batch 2 does not enable live access, credentials, scraping, or external APIs.",
}));

export function getDirectSourceApprovedCategories() {
  return DIRECT_SOURCE_APPROVED_CATEGORIES.map((category) => ({ ...category }));
}

export function getDirectSourceDeferredCategories() {
  return DIRECT_SOURCE_DEFERRED_CATEGORIES.map((category) => ({ ...category }));
}
