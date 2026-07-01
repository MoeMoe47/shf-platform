export const DIRECT_CONNECT_LAYER_META = {
  layerName: "SHS Direct Connect Layer V1",
  version: "batch-2-data-model",
  status: "local_mock_registry",
  parentLayer: "SHS Integration Fabric",
  description:
    "Local-first connector registry and mock readiness data for SHS Direct Connect without live integrations, credentials, OAuth, or external sync.",
  v1Mode: "mock-data-first",
  liveIntegrationPolicy: "No live external integrations in V1.",
  credentialPolicy: "No credential storage in V1.",
  publicImpactPolicy:
    "Direct Connect does not bypass SHF approval. Financial data must never become public impact data by default.",
  reportUsePolicy: "Report use requires approval and visible source trust metadata.",
  lastUpdated: "2026-06-26",
  ownerSurface: "Future SHS Admin Ops Direct Connect surface",
};

export const DIRECT_CONNECT_STATUS_STATES = [
  { id: "not_configured", label: "Not Configured", description: "No connector setup has started.", severity: "neutral" },
  { id: "available", label: "Available", description: "Connector is listed for future setup.", severity: "info" },
  { id: "draft", label: "Draft", description: "Connector setup is in draft review.", severity: "info" },
  { id: "pending_review", label: "Pending Review", description: "Connector needs operator or governance review.", severity: "warning" },
  { id: "connected_mock", label: "Connected Mock", description: "Mock or local import data is available.", severity: "success" },
  { id: "import_ready", label: "Import Ready", description: "Local import is ready for mapping or approval.", severity: "success" },
  { id: "needs_mapping", label: "Needs Mapping", description: "Source fields need canonical mapping review.", severity: "warning" },
  { id: "needs_approval", label: "Needs Approval", description: "Source use needs approval before report or public use.", severity: "warning" },
  { id: "approved_internal", label: "Approved Internal", description: "Approved for internal SHS use only.", severity: "success" },
  { id: "approved_report_source", label: "Approved Report Source", description: "Approved for report trust-panel use.", severity: "success" },
  { id: "rejected", label: "Rejected", description: "Source use was rejected for the requested purpose.", severity: "critical" },
  { id: "disabled", label: "Disabled", description: "Connector is disabled or deferred.", severity: "neutral" },
  { id: "error", label: "Error", description: "Connector has an error state that blocks use.", severity: "critical" },
];

export const DIRECT_CONNECT_SOURCE_CATEGORIES = [
  { id: "file_import", label: "File Import", description: "CSV or local file import source.", financialRiskLevel: "medium", publicImpactDefault: "blocked_until_approved" },
  { id: "website_analytics", label: "Website Analytics", description: "Website traffic and conversion metrics.", financialRiskLevel: "low", publicImpactDefault: "blocked_until_approved" },
  { id: "crm", label: "CRM", description: "Lead, opportunity, and client lifecycle records.", financialRiskLevel: "medium", publicImpactDefault: "blocked_until_approved" },
  { id: "payments", label: "Payments", description: "Mock/import-only payment processor summaries.", financialRiskLevel: "high", publicImpactDefault: "blocked_financial" },
  { id: "accounting", label: "Accounting", description: "Mock/import-only accounting summaries.", financialRiskLevel: "high", publicImpactDefault: "blocked_financial" },
  { id: "banking_future", label: "Banking Future", description: "Placeholder only for future banking review.", financialRiskLevel: "critical", publicImpactDefault: "blocked_financial" },
  { id: "client_os", label: "Client OS", description: "Client operating-system records.", financialRiskLevel: "medium", publicImpactDefault: "blocked_until_approved" },
  { id: "shs_internal", label: "SHS Internal", description: "Internal SHS operational readiness records.", financialRiskLevel: "medium", publicImpactDefault: "private_internal" },
  { id: "shf_approval", label: "SHF Approval", description: "Approval boundary status, not a bypass.", financialRiskLevel: "low", publicImpactDefault: "approval_boundary_only" },
  { id: "manual_entry", label: "Manual Entry", description: "Operator-entered records.", financialRiskLevel: "medium", publicImpactDefault: "blocked_until_approved" },
];

export const DIRECT_CONNECT_TRUST_RULES = [
  "External data is not trusted by default.",
  "Connected data is private by default.",
  "Report use requires approval.",
  "Public SHF use requires SHF Data Approval Gateway approval.",
  "Financial data must never become public impact data by default.",
  "Mock connections must be labeled clearly.",
  "Every sync/import must create an audit event.",
  "Every report binding must show source and approval status.",
  "No credential storage in V1.",
  "Direct Connect does not bypass SHF approval.",
  "no credential storage in V1",
];

export const directConnectConnectorSources = [
  {
    id: "src_csv_file_import",
    name: "CSV File Import",
    category: "file_import",
    providerType: "local_file",
    description: "Local CSV intake for client, project, and report seed data.",
    connectionMethod: "manual_upload_future",
    liveIntegrationStatus: "not_live",
    v1Mode: "mock_import_only",
    supportsMock: true,
    supportsCsvImport: true,
    supportsApiFuture: false,
    containsFinancialData: false,
    containsPersonalData: true,
    allowedDestinations: ["ClientOps", "Reports", "Tracking + Intelligence"],
    deferredLiveFeatures: ["upload UI", "file validation service", "database persistence"],
    trustNotes: "CSV rows remain private until mapped, reviewed, and approved.",
  },
  {
    id: "src_website_analytics_mock",
    name: "Website Analytics Mock",
    category: "website_analytics",
    providerType: "analytics_mock",
    description: "Mock website traffic, conversion, and inquiry metrics.",
    connectionMethod: "mock_dataset",
    liveIntegrationStatus: "not_live",
    v1Mode: "mock_only",
    supportsMock: true,
    supportsCsvImport: true,
    supportsApiFuture: true,
    containsFinancialData: false,
    containsPersonalData: false,
    allowedDestinations: ["Reports", "ClientOps", "Command Center"],
    deferredLiveFeatures: ["analytics API review", "consent review", "tracking policy"],
    trustNotes: "Mock analytics can support internal readiness and report examples only.",
  },
  {
    id: "src_crm_mock",
    name: "CRM Mock",
    category: "crm",
    providerType: "crm_mock",
    description: "Mock lead, opportunity, and client lifecycle records.",
    connectionMethod: "mock_dataset",
    liveIntegrationStatus: "not_live",
    v1Mode: "mock_only",
    supportsMock: true,
    supportsCsvImport: true,
    supportsApiFuture: true,
    containsFinancialData: false,
    containsPersonalData: true,
    allowedDestinations: ["ClientOps", "Reports", "Tracking + Intelligence"],
    deferredLiveFeatures: ["CRM API review", "field permissions", "PII handling"],
    trustNotes: "CRM data is private client/workflow data until approved for specific report use.",
  },
  {
    id: "src_payment_processor_mock",
    name: "Payment Processor Mock",
    category: "payments",
    providerType: "payments_mock",
    description: "Mock/import-only payment summaries without live Stripe or Square integration.",
    connectionMethod: "mock_or_csv_import",
    liveIntegrationStatus: "not_live",
    v1Mode: "mock_import_only",
    supportsMock: true,
    supportsCsvImport: true,
    supportsApiFuture: true,
    containsFinancialData: true,
    containsPersonalData: true,
    allowedDestinations: ["Internal Reports", "ClientOps"],
    deferredLiveFeatures: ["Stripe review", "Square review", "security review", "permission model", "data retention"],
    trustNotes: "Payment data is financial and blocked from public impact by default.",
  },
  {
    id: "src_accounting_mock",
    name: "Accounting Mock",
    category: "accounting",
    providerType: "accounting_mock",
    description: "Mock/import-only accounting summaries without live QuickBooks integration.",
    connectionMethod: "mock_or_csv_import",
    liveIntegrationStatus: "not_live",
    v1Mode: "mock_import_only",
    supportsMock: true,
    supportsCsvImport: true,
    supportsApiFuture: true,
    containsFinancialData: true,
    containsPersonalData: false,
    allowedDestinations: ["Internal Reports", "ClientOps"],
    deferredLiveFeatures: ["QuickBooks review", "chart-of-accounts mapping", "security review", "permission model", "data retention"],
    trustNotes: "Accounting data is financial and can only support internal/report readiness after approval.",
  },
  {
    id: "src_banking_future_placeholder",
    name: "Banking Future Placeholder",
    category: "banking_future",
    providerType: "banking_placeholder",
    description: "Architecture placeholder for possible future banking review; no live banking integration exists in V1.",
    connectionMethod: "none_v1",
    liveIntegrationStatus: "deferred",
    v1Mode: "placeholder_only",
    supportsMock: false,
    supportsCsvImport: false,
    supportsApiFuture: true,
    containsFinancialData: true,
    containsPersonalData: true,
    allowedDestinations: [],
    deferredLiveFeatures: ["Plaid", "Finicity", "OAuth", "consent", "security review", "credential vault", "data retention", "permission requirements"],
    trustNotes: "No live banking integration in V1. Public impact is blocked by default and this source remains disabled/deferred.",
  },
  {
    id: "src_client_os_mock",
    name: "Client OS Mock",
    category: "client_os",
    providerType: "client_ops_mock",
    description: "Mock client operations records for support tier, version, and lifecycle state.",
    connectionMethod: "mock_dataset",
    liveIntegrationStatus: "not_live",
    v1Mode: "mock_only",
    supportsMock: true,
    supportsCsvImport: true,
    supportsApiFuture: false,
    containsFinancialData: false,
    containsPersonalData: true,
    allowedDestinations: ["ClientOps", "Reports", "Command Center"],
    deferredLiveFeatures: ["durable ClientOps persistence", "permissions", "version ledger binding"],
    trustNotes: "Client OS records remain internal unless specific report fields are approved.",
  },
  {
    id: "src_shs_internal_ops",
    name: "SHS Internal Ops",
    category: "shs_internal",
    providerType: "internal_mock",
    description: "Internal SHS readiness, QA, launch, and support operations signals.",
    connectionMethod: "local_dataset",
    liveIntegrationStatus: "internal_only",
    v1Mode: "local_mock",
    supportsMock: true,
    supportsCsvImport: false,
    supportsApiFuture: false,
    containsFinancialData: false,
    containsPersonalData: false,
    allowedDestinations: ["ClientOps", "Tracking + Intelligence", "Command Center"],
    deferredLiveFeatures: ["durable ops ledger", "owner assignment policy"],
    trustNotes: "Internal ops records are not public SHF impact data.",
  },
  {
    id: "src_shf_approval_gateway",
    name: "SHF Approval Gateway",
    category: "shf_approval",
    providerType: "approval_boundary",
    description: "Boundary source that records approval posture; it does not approve public impact data by itself.",
    connectionMethod: "approval_status_mock",
    liveIntegrationStatus: "not_live",
    v1Mode: "boundary_mock",
    supportsMock: true,
    supportsCsvImport: false,
    supportsApiFuture: true,
    containsFinancialData: false,
    containsPersonalData: false,
    allowedDestinations: ["SHF Data Approval Gateway", "Reports", "Command Center"],
    deferredLiveFeatures: ["formal approval workflow", "signed public approval evidence", "audit export"],
    trustNotes: "Direct Connect does not bypass SHF approval; this source represents the boundary only.",
  },
  {
    id: "src_manual_entry",
    name: "Manual Entry",
    category: "manual_entry",
    providerType: "operator_entry",
    description: "Operator-entered connector notes and source records.",
    connectionMethod: "manual_entry_future",
    liveIntegrationStatus: "not_live",
    v1Mode: "mock_manual",
    supportsMock: true,
    supportsCsvImport: false,
    supportsApiFuture: false,
    containsFinancialData: false,
    containsPersonalData: true,
    allowedDestinations: ["ClientOps", "Reports"],
    deferredLiveFeatures: ["manual entry UI", "review workflow", "operator attribution"],
    trustNotes: "Manual entries require source notes and approval before report use.",
  },
];

export const directConnectConnections = [
  {
    id: "conn_ccs_csv_import",
    sourceId: "src_csv_file_import",
    clientId: "client_central_care",
    clientName: "Central Care Services",
    status: "import_ready",
    environment: "local_mock",
    connectionLabel: "Central Care Services CSV Import",
    lastSyncAt: "2026-06-24T14:10:00.000Z",
    approvalStatus: "approved_internal",
    reportEligible: true,
    publicImpactEligible: false,
    credentialMode: "none_local_file_only",
    notes: "Local CSV sample is ready for internal report and ClientOps mapping.",
  },
  {
    id: "conn_ccs_website_analytics",
    sourceId: "src_website_analytics_mock",
    clientId: "client_central_care",
    clientName: "Central Care Services",
    status: "connected_mock",
    environment: "local_mock",
    connectionLabel: "Central Care Services Website Analytics Mock",
    lastSyncAt: "2026-06-24T15:20:00.000Z",
    approvalStatus: "approved_report_source",
    reportEligible: true,
    publicImpactEligible: false,
    credentialMode: "mock_data_only",
    notes: "Mock analytics can appear in report trust panels as sample data.",
  },
  {
    id: "conn_ccs_crm",
    sourceId: "src_crm_mock",
    clientId: "client_central_care",
    clientName: "Central Care Services",
    status: "needs_mapping",
    environment: "local_mock",
    connectionLabel: "Central Care Services CRM Mock",
    lastSyncAt: "2026-06-24T16:05:00.000Z",
    approvalStatus: "needs_review",
    reportEligible: false,
    publicImpactEligible: false,
    credentialMode: "mock_data_only",
    notes: "Lead lifecycle fields need canonical mapping before report use.",
  },
  {
    id: "conn_ccs_accounting",
    sourceId: "src_accounting_mock",
    clientId: "client_central_care",
    clientName: "Central Care Services",
    status: "needs_approval",
    environment: "local_mock",
    connectionLabel: "Central Care Services Accounting Mock",
    lastSyncAt: "2026-06-24T16:40:00.000Z",
    approvalStatus: "blocked_financial_public",
    reportEligible: true,
    publicImpactEligible: false,
    credentialMode: "mock_import_only",
    notes: "Financial summary can support internal reporting only; public impact is blocked.",
  },
  {
    id: "conn_ccs_banking_future",
    sourceId: "src_banking_future_placeholder",
    clientId: "client_central_care",
    clientName: "Central Care Services",
    status: "disabled",
    environment: "placeholder",
    connectionLabel: "Central Care Services Banking Future Placeholder",
    lastSyncAt: null,
    approvalStatus: "deferred",
    reportEligible: false,
    publicImpactEligible: false,
    credentialMode: "none_placeholder_only",
    notes: "Disabled placeholder. No live banking, bank login, OAuth, or credentials in V1.",
  },
  {
    id: "conn_shs_internal_ops",
    sourceId: "src_shs_internal_ops",
    clientId: "client_shs_internal",
    clientName: "SHS Internal Ops",
    status: "approved_internal",
    environment: "local_mock",
    connectionLabel: "SHS Internal Ops connection",
    lastSyncAt: "2026-06-25T10:00:00.000Z",
    approvalStatus: "approved_internal",
    reportEligible: true,
    publicImpactEligible: false,
    credentialMode: "local_internal_only",
    notes: "Internal ops readiness can support ClientOps and Tracking + Intelligence readiness.",
  },
  {
    id: "conn_shf_approval_gateway",
    sourceId: "src_shf_approval_gateway",
    clientId: "client_central_care",
    clientName: "Central Care Services",
    status: "pending_review",
    environment: "local_mock",
    connectionLabel: "SHF Approval Gateway boundary connection",
    lastSyncAt: "2026-06-25T11:15:00.000Z",
    approvalStatus: "shf_approval_required",
    reportEligible: false,
    publicImpactEligible: true,
    credentialMode: "approval_boundary_only",
    notes: "Represents a non-financial public approval boundary check, not a Direct Connect bypass.",
  },
  {
    id: "conn_ccs_payment_processor",
    sourceId: "src_payment_processor_mock",
    clientId: "client_central_care",
    clientName: "Central Care Services",
    status: "rejected",
    environment: "local_mock",
    connectionLabel: "Central Care Services Payment Processor Mock",
    lastSyncAt: "2026-06-25T12:30:00.000Z",
    approvalStatus: "blocked_financial_public",
    reportEligible: false,
    publicImpactEligible: false,
    credentialMode: "mock_import_only",
    notes: "Rejected for public impact use because payment data is financial.",
  },
];

export const directConnectFieldMappings = [
  { id: "map_ccs_csv_client_name", connectionId: "conn_ccs_csv_import", sourceField: "client_name", targetField: "client.name", targetDomain: "client_profile", required: true, mappingStatus: "approved", transformRule: "trim_string", notes: "Maps imported client name to profile." },
  { id: "map_ccs_csv_project_status", connectionId: "conn_ccs_csv_import", sourceField: "project_status", targetField: "project.status", targetDomain: "project_records", required: true, mappingStatus: "approved", transformRule: "normalize_status", notes: "Maps project readiness state." },
  { id: "map_ccs_web_sessions", connectionId: "conn_ccs_website_analytics", sourceField: "sessions", targetField: "report.metrics.website_sessions", targetDomain: "report_metrics", required: true, mappingStatus: "approved", transformRule: "integer_count", notes: "Website analytics field maps to report metric." },
  { id: "map_ccs_web_demo_requests", connectionId: "conn_ccs_website_analytics", sourceField: "demo_requests", targetField: "report.metrics.demo_requests", targetDomain: "report_metrics", required: false, mappingStatus: "approved", transformRule: "integer_count", notes: "Conversion metric for report trust panel." },
  { id: "map_ccs_crm_lead_stage", connectionId: "conn_ccs_crm", sourceField: "lead_stage", targetField: "sales.lifecycle_stage", targetDomain: "sales_lifecycle", required: true, mappingStatus: "needs_review", transformRule: "map_stage_taxonomy", notes: "CRM lifecycle values need review." },
  { id: "map_ccs_crm_followup", connectionId: "conn_ccs_crm", sourceField: "next_followup", targetField: "clientops.next_action_date", targetDomain: "client_lifecycle", required: false, mappingStatus: "needs_review", transformRule: "date_iso", notes: "Follow-up date maps to ClientOps." },
  { id: "map_ccs_accounting_revenue", connectionId: "conn_ccs_accounting", sourceField: "monthly_revenue", targetField: "internal_report.financial_summary.revenue", targetDomain: "internal_financial_summary", required: true, mappingStatus: "approved_internal_only", transformRule: "currency_usd", notes: "Internal report only; public impact blocked." },
  { id: "map_shs_ops_readiness", connectionId: "conn_shs_internal_ops", sourceField: "launch_readiness", targetField: "tracking_intelligence.readiness_score", targetDomain: "tracking_intelligence", required: true, mappingStatus: "approved", transformRule: "percentage", notes: "Internal readiness signal." },
  { id: "map_shf_public_approval", connectionId: "conn_shf_approval_gateway", sourceField: "public_approval_status", targetField: "shf_gateway.public_approval_status", targetDomain: "public_approval_status", required: true, mappingStatus: "boundary_check_only", transformRule: "approval_status", notes: "Maps approval status only; does not approve Direct Connect data." },
];

export const directConnectSyncRuns = [
  { id: "sync_ccs_csv_success", connectionId: "conn_ccs_csv_import", runType: "mock_import", status: "success", startedAt: "2026-06-24T14:00:00.000Z", completedAt: "2026-06-24T14:10:00.000Z", recordsReceived: 48, recordsAccepted: 48, recordsRejected: 0, errorCount: 0, approvalRequired: false, auditEventId: "audit_ccs_csv_import_completed", notes: "Successful mock CSV import." },
  { id: "sync_ccs_crm_needs_mapping", connectionId: "conn_ccs_crm", runType: "mock_import", status: "needs_mapping", startedAt: "2026-06-24T15:55:00.000Z", completedAt: "2026-06-24T16:05:00.000Z", recordsReceived: 32, recordsAccepted: 24, recordsRejected: 8, errorCount: 0, approvalRequired: true, auditEventId: "audit_ccs_crm_mapping_required", notes: "CRM fields need mapping review." },
  { id: "sync_ccs_accounting_needs_approval", connectionId: "conn_ccs_accounting", runType: "mock_import", status: "needs_approval", startedAt: "2026-06-24T16:30:00.000Z", completedAt: "2026-06-24T16:40:00.000Z", recordsReceived: 12, recordsAccepted: 12, recordsRejected: 0, errorCount: 0, approvalRequired: true, auditEventId: "audit_ccs_accounting_approval_required", notes: "Accounting summary requires approval and remains internal." },
  { id: "sync_ccs_payment_blocked_public", connectionId: "conn_ccs_payment_processor", runType: "mock_import", status: "rejected", startedAt: "2026-06-25T12:10:00.000Z", completedAt: "2026-06-25T12:30:00.000Z", recordsReceived: 20, recordsAccepted: 0, recordsRejected: 20, errorCount: 0, approvalRequired: true, auditEventId: "audit_financial_public_impact_blocked", notes: "Rejected/blocked financial public impact attempt." },
  { id: "sync_ccs_banking_deferred", connectionId: "conn_ccs_banking_future", runType: "placeholder", status: "disabled", startedAt: null, completedAt: null, recordsReceived: 0, recordsAccepted: 0, recordsRejected: 0, errorCount: 0, approvalRequired: true, auditEventId: "audit_banking_placeholder_deferred", notes: "Disabled/deferred banking placeholder; no sync executed." },
];

export const directConnectAuditEvents = [
  { id: "audit_connector_registered", connectionId: "conn_ccs_csv_import", eventType: "connector_registered", actor: "SHS Operator", occurredAt: "2026-06-24T13:50:00.000Z", severity: "info", message: "CSV connector registered for Central Care Services.", governanceTag: "connector_registry", relatedReportBindingId: null, publicImpactBoundaryChecked: false },
  { id: "audit_ccs_csv_import_completed", connectionId: "conn_ccs_csv_import", eventType: "mock_import_completed", actor: "SHS Operator", occurredAt: "2026-06-24T14:10:00.000Z", severity: "info", message: "Mock CSV import completed.", governanceTag: "import_audit", relatedReportBindingId: "bind_premium_report_csv", publicImpactBoundaryChecked: false },
  { id: "audit_ccs_crm_mapping_required", connectionId: "conn_ccs_crm", eventType: "mapping_required", actor: "Mapping Review", occurredAt: "2026-06-24T16:05:00.000Z", severity: "warning", message: "CRM lifecycle fields require mapping review.", governanceTag: "field_mapping", relatedReportBindingId: null, publicImpactBoundaryChecked: false },
  { id: "audit_ccs_accounting_approval_required", connectionId: "conn_ccs_accounting", eventType: "approval_required", actor: "Governance Review", occurredAt: "2026-06-24T16:40:00.000Z", severity: "warning", message: "Accounting mock requires approval and remains internal.", governanceTag: "financial_approval", relatedReportBindingId: "bind_accounting_internal", publicImpactBoundaryChecked: true },
  { id: "audit_report_binding_approved", connectionId: "conn_ccs_website_analytics", eventType: "report_binding_approved", actor: "Report Owner", occurredAt: "2026-06-24T17:00:00.000Z", severity: "info", message: "Website analytics mock approved for report trust panel.", governanceTag: "report_source_binding", relatedReportBindingId: "bind_premium_report_analytics", publicImpactBoundaryChecked: false },
  { id: "audit_financial_public_impact_blocked", connectionId: "conn_ccs_payment_processor", eventType: "financial_public_impact_blocked", actor: "SHF Boundary Review", occurredAt: "2026-06-25T12:30:00.000Z", severity: "critical", message: "Financial public impact use blocked.", governanceTag: "shf_boundary", relatedReportBindingId: "bind_public_impact_blocked", publicImpactBoundaryChecked: true },
  { id: "audit_shf_boundary_checked", connectionId: "conn_shf_approval_gateway", eventType: "shf_boundary_checked", actor: "SHF Approval Gateway", occurredAt: "2026-06-25T11:15:00.000Z", severity: "info", message: "SHF approval boundary checked; Direct Connect did not approve public impact data.", governanceTag: "shf_approval_gateway", relatedReportBindingId: null, publicImpactBoundaryChecked: true },
  { id: "audit_banking_placeholder_deferred", connectionId: "conn_ccs_banking_future", eventType: "banking_placeholder_deferred", actor: "Architecture Review", occurredAt: "2026-06-25T09:30:00.000Z", severity: "warning", message: "Banking placeholder remains disabled/deferred.", governanceTag: "deferred_banking", relatedReportBindingId: null, publicImpactBoundaryChecked: true },
];

export const directConnectApprovalStatuses = [
  { id: "approval_ccs_csv_internal", connectionId: "conn_ccs_csv_import", status: "approved_internal_use", reviewer: "SHS Operator", reviewedAt: "2026-06-24T14:20:00.000Z", allowedUse: ["ClientOps", "internal reports"], deniedUse: ["public impact"], publicImpactEligible: false, financialDataPublicBlocked: false, notes: "Approved internal use." },
  { id: "approval_ccs_analytics_report", connectionId: "conn_ccs_website_analytics", status: "approved_report_source", reviewer: "Report Owner", reviewedAt: "2026-06-24T17:00:00.000Z", allowedUse: ["premium report trust panel", "monthly review"], deniedUse: ["public impact"], publicImpactEligible: false, financialDataPublicBlocked: false, notes: "Approved report source." },
  { id: "approval_ccs_crm_review", connectionId: "conn_ccs_crm", status: "needs_review", reviewer: "Mapping Review", reviewedAt: null, allowedUse: [], deniedUse: ["report source", "public impact"], publicImpactEligible: false, financialDataPublicBlocked: false, notes: "SHF approval required only after mapping and source review." },
  { id: "approval_ccs_accounting_blocked", connectionId: "conn_ccs_accounting", status: "blocked_financial_public_impact", reviewer: "Governance Review", reviewedAt: "2026-06-24T16:45:00.000Z", allowedUse: ["internal financial summary"], deniedUse: ["public impact"], publicImpactEligible: false, financialDataPublicBlocked: true, notes: "Blocked financial public impact." },
  { id: "approval_ccs_payment_rejected", connectionId: "conn_ccs_payment_processor", status: "rejected_public_impact_use", reviewer: "SHF Boundary Review", reviewedAt: "2026-06-25T12:30:00.000Z", allowedUse: [], deniedUse: ["public impact", "report trust panel"], publicImpactEligible: false, financialDataPublicBlocked: true, notes: "Rejected public impact use for financial payment data." },
  { id: "approval_shf_gateway_required", connectionId: "conn_shf_approval_gateway", status: "shf_approval_required", reviewer: "SHF Approval Gateway", reviewedAt: "2026-06-25T11:15:00.000Z", allowedUse: ["boundary status display"], deniedUse: ["automatic public approval"], publicImpactEligible: true, financialDataPublicBlocked: false, notes: "Boundary status only. Direct Connect does not approve public SHF impact data by itself." },
  { id: "approval_banking_deferred", connectionId: "conn_ccs_banking_future", status: "deferred", reviewer: "Architecture Review", reviewedAt: "2026-06-25T09:30:00.000Z", allowedUse: [], deniedUse: ["sync", "reporting", "public impact"], publicImpactEligible: false, financialDataPublicBlocked: true, notes: "Banking future placeholder remains deferred and disabled." },
  { id: "approval_shs_ops_internal", connectionId: "conn_shs_internal_ops", status: "approved_internal_use", reviewer: "SHS Operator", reviewedAt: "2026-06-25T10:10:00.000Z", allowedUse: ["ClientOps", "Tracking + Intelligence"], deniedUse: ["public impact"], publicImpactEligible: false, financialDataPublicBlocked: false, notes: "Approved internal operations use." },
];

export const directConnectReportSourceBindings = [
  { id: "bind_premium_report_csv", reportId: "report_premium_shs_v1", reportName: "Premium SHS Report", connectionId: "conn_ccs_csv_import", sourceId: "src_csv_file_import", bindingStatus: "approved_internal", visibleInReportTrustPanel: true, approvalStatus: "approved_internal_use", lastVerifiedAt: "2026-06-24T14:20:00.000Z", dataUse: "client profile and project records", notes: "Premium SHS report source binding." },
  { id: "bind_clientops_monthly_review", reportId: "report_clientops_monthly_review", reportName: "ClientOps Monthly Review", connectionId: "conn_shs_internal_ops", sourceId: "src_shs_internal_ops", bindingStatus: "approved_internal", visibleInReportTrustPanel: true, approvalStatus: "approved_internal_use", lastVerifiedAt: "2026-06-25T10:10:00.000Z", dataUse: "maintenance and readiness summary", notes: "ClientOps monthly review source binding." },
  { id: "bind_premium_report_analytics", reportId: "report_premium_shs_v1", reportName: "Premium SHS Report", connectionId: "conn_ccs_website_analytics", sourceId: "src_website_analytics_mock", bindingStatus: "approved_report_source", visibleInReportTrustPanel: true, approvalStatus: "approved_report_source", lastVerifiedAt: "2026-06-24T17:00:00.000Z", dataUse: "website metric trust panel", notes: "Report trust panel visible binding." },
  { id: "bind_accounting_internal", reportId: "report_internal_financial_summary", reportName: "Internal Financial Summary", connectionId: "conn_ccs_accounting", sourceId: "src_accounting_mock", bindingStatus: "internal_only", visibleInReportTrustPanel: false, approvalStatus: "blocked_financial_public_impact", lastVerifiedAt: "2026-06-24T16:45:00.000Z", dataUse: "internal-only financial summary", notes: "Accounting mock internal-only binding." },
  { id: "bind_public_impact_blocked", reportId: "report_shf_public_impact", reportName: "SHF Public Impact Candidate", connectionId: "conn_ccs_payment_processor", sourceId: "src_payment_processor_mock", bindingStatus: "blocked", visibleInReportTrustPanel: false, approvalStatus: "rejected_public_impact_use", lastVerifiedAt: "2026-06-25T12:30:00.000Z", dataUse: "blocked public impact attempt", notes: "Blocked public impact binding for financial payment data." },
];

const copyRecord = (record) => (record ? { ...record } : null);
const copyRecords = (records) => records.map((record) => ({ ...record }));

export function getDirectConnectConnectorSources() {
  return copyRecords(directConnectConnectorSources);
}

export function getDirectConnectSourceById(sourceId) {
  return copyRecord(directConnectConnectorSources.find((source) => source.id === sourceId));
}

export function getDirectConnectSourcesByCategory(category) {
  return copyRecords(directConnectConnectorSources.filter((source) => source.category === category));
}

export function getDirectConnectConnections() {
  return copyRecords(directConnectConnections);
}

export function getDirectConnectConnectionById(connectionId) {
  return copyRecord(directConnectConnections.find((connection) => connection.id === connectionId));
}

export function getDirectConnectConnectionsByClientId(clientId) {
  return copyRecords(directConnectConnections.filter((connection) => connection.clientId === clientId));
}

export function getDirectConnectConnectionsByStatus(status) {
  return copyRecords(directConnectConnections.filter((connection) => connection.status === status));
}

export function getDirectConnectMappingsByConnectionId(connectionId) {
  return copyRecords(directConnectFieldMappings.filter((mapping) => mapping.connectionId === connectionId));
}

export function getDirectConnectSyncRunsByConnectionId(connectionId) {
  return copyRecords(directConnectSyncRuns.filter((run) => run.connectionId === connectionId));
}

export function getDirectConnectAuditEventsByConnectionId(connectionId) {
  return copyRecords(directConnectAuditEvents.filter((event) => event.connectionId === connectionId));
}

export function getDirectConnectApprovalByConnectionId(connectionId) {
  return copyRecord(directConnectApprovalStatuses.find((approval) => approval.connectionId === connectionId));
}

export function getDirectConnectReportBindings() {
  return copyRecords(directConnectReportSourceBindings);
}

export function getDirectConnectReportBindingsByConnectionId(connectionId) {
  return copyRecords(directConnectReportSourceBindings.filter((binding) => binding.connectionId === connectionId));
}

export function isDirectConnectStatusValid(status) {
  return DIRECT_CONNECT_STATUS_STATES.some((state) => state.id === status);
}

export function isDirectConnectSourceCategoryValid(category) {
  return DIRECT_CONNECT_SOURCE_CATEGORIES.some((sourceCategory) => sourceCategory.id === category);
}

export function isDirectConnectConnectionReportEligible(connection) {
  if (!connection || typeof connection !== "object") return false;
  return connection.reportEligible === true && ["approved_internal", "approved_report_source", "connected_mock", "import_ready"].includes(connection.status);
}

export function isDirectConnectConnectionPublicImpactEligible(connection) {
  if (!connection || typeof connection !== "object") return false;
  const source = directConnectConnectorSources.find((item) => item.id === connection.sourceId);
  const approval = directConnectApprovalStatuses.find((item) => item.connectionId === connection.id);
  if (!source || source.containsFinancialData) return false;
  return connection.publicImpactEligible === true && approval?.publicImpactEligible === true && approval?.status === "shf_approval_required";
}

export function getDirectConnectReportEligibleConnections() {
  return copyRecords(directConnectConnections.filter(isDirectConnectConnectionReportEligible));
}

export function getDirectConnectPublicImpactEligibleConnections() {
  return copyRecords(directConnectConnections.filter(isDirectConnectConnectionPublicImpactEligible));
}

export function getDirectConnectBlockedFinancialPublicImpactConnections() {
  return copyRecords(
    directConnectConnections.filter((connection) => {
      const source = directConnectConnectorSources.find((item) => item.id === connection.sourceId);
      const approval = directConnectApprovalStatuses.find((item) => item.connectionId === connection.id);
      return source?.containsFinancialData === true && (connection.publicImpactEligible !== true || approval?.financialDataPublicBlocked === true);
    }),
  );
}

export function summarizeDirectConnectReadiness() {
  return {
    totalSources: directConnectConnectorSources.length,
    totalConnections: directConnectConnections.length,
    reportEligibleConnections: getDirectConnectReportEligibleConnections().length,
    publicImpactEligibleConnections: getDirectConnectPublicImpactEligibleConnections().length,
    blockedFinancialPublicImpactConnections: getDirectConnectBlockedFinancialPublicImpactConnections().length,
    connectionsNeedingMapping: directConnectConnections.filter((connection) => connection.status === "needs_mapping").length,
    connectionsNeedingApproval: directConnectConnections.filter((connection) => connection.status === "needs_approval" || connection.approvalStatus === "needs_review").length,
    errorConnections: directConnectConnections.filter((connection) => connection.status === "error").length,
    mockConnectedConnections: directConnectConnections.filter((connection) => connection.status === "connected_mock").length,
    deferredLiveSources: directConnectConnectorSources.filter((source) => source.liveIntegrationStatus === "deferred").length,
  };
}
