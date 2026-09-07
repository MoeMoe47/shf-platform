export const GPA_ACTION_CLASSES = ["READ", "WRITE", "ACTION"] as const;
export const GPA_CLASSIFICATIONS = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED", "HIGHLY_RESTRICTED"] as const;
export const GPA_INTEGRATION_MODES = ["API", "WEBHOOK", "SFTP", "SECURE_FILE", "CSV", "XLSX", "JSON", "DATABASE_READ", "EVENT_STREAM", "DOCUMENT_INGESTION"] as const;
export const GPA_PURPOSES = [
  "PROGRAM_MONITORING", "CLAIM_VERIFICATION", "PAYMENT_VALIDATION", "AUDIT",
  "COMPLIANCE_REVIEW", "PROVIDER_ASSURANCE", "PERFORMANCE_REPORTING", "PUBLIC_REPORTING", "INVESTIGATION",
] as const;

export type GpaActionClass = typeof GPA_ACTION_CLASSES[number];
export type GpaClassification = typeof GPA_CLASSIFICATIONS[number];

export const GPA_SOURCE_SCOPE_CODES = {
  SOURCE_NOT_FOUND: "GPA_SOURCE_SYSTEM_NOT_FOUND",
  POLICY_NOT_FOUND: "GPA_DATA_USE_POLICY_NOT_FOUND",
  PURPOSE_NOT_FOUND: "GPA_PURPOSE_NOT_FOUND",
  JURISDICTION_NOT_FOUND: "GPA_JURISDICTION_NOT_FOUND",
  POLICY_INACTIVE: "GPA_DATA_USE_POLICY_INACTIVE",
  PURPOSE_DENIED: "GPA_PURPOSE_DENIED",
  ACTION_DENIED: "GPA_ACTION_DENIED",
  DATA_DOMAIN_DENIED: "GPA_DATA_DOMAIN_DENIED",
  RECORD_TYPE_DENIED: "GPA_RECORD_TYPE_DENIED",
  FIELD_DENIED: "GPA_FIELD_DENIED",
  CLASSIFICATION_DENIED: "GPA_CLASSIFICATION_DENIED",
  JURISDICTION_DENIED: "GPA_JURISDICTION_DENIED",
  LEGAL_BASIS_REQUIRED: "GPA_LEGAL_BASIS_REQUIRED",
  AGREEMENT_REQUIRED: "GPA_AGREEMENT_REQUIRED",
  AGENT_AUTHORITY_DENIED: "GPA_AGENT_AUTHORITY_DENIED",
  SOURCE_SCOPE_REQUIRED: "GPA_SOURCE_SCOPE_REQUIRED",
} as const;

const CLASSIFICATION_RANK: Record<string, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  SENSITIVE: 2,
  RESTRICTED: 3,
  HIGHLY_RESTRICTED: 4,
};

export function classificationRank(value: string): number {
  return CLASSIFICATION_RANK[String(value || "").toUpperCase()] ?? Number.POSITIVE_INFINITY;
}

export function normalizeClassification(value: string | undefined): GpaClassification {
  const normalized = String(value || "INTERNAL").toUpperCase();
  if (normalized === "SENSITIVE") return "CONFIDENTIAL";
  if (!GPA_CLASSIFICATIONS.includes(normalized as GpaClassification)) throw new Error(GPA_SOURCE_SCOPE_CODES.CLASSIFICATION_DENIED);
  return normalized as GpaClassification;
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function policyAllows(policy: any, key: string, requested: string): boolean {
  const values = asStringList(policy?.[key]);
  return values.length === 0 || values.includes(requested);
}

export function fieldsAllowed(policy: any, requestedFields: string[]): boolean {
  const allowed = asStringList(policy?.allowed_fields);
  return allowed.length === 0 || requestedFields.every((field) => allowed.includes(field));
}
