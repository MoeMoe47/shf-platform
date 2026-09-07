export const PRODUCT_KEYS = Object.freeze([
  "civicsure",
  "oas",
  "registry",
  "studio",
  "bos",
  "foundation",
  "solutions",
] as const);

export type ProductKey = typeof PRODUCT_KEYS[number];

export type AuthorizedReportProjection = {
  productKey: ProductKey;
  reportFamily: string;
  subject?: unknown;
  scope: { organizationId: string; tenantId: string; [key: string]: unknown };
  reportingPeriod?: unknown;
  classification: "INTERNAL" | "RESTRICTED_EXTERNAL" | "PUBLIC";
  generatedAt: string;
  canonicalReferences: unknown[];
  sourceVersions?: unknown[];
  provenance?: Record<string, unknown>;
  payload: Record<string, unknown>;
};

export interface ProductReportProjectionAdapter {
  productKey: ProductKey;
  supports(reportFamily: string): boolean;
  project(input: unknown, actorContext: unknown): Promise<AuthorizedReportProjection>;
}

export function isProductKey(value: unknown): value is ProductKey {
  return typeof value === "string" && (PRODUCT_KEYS as readonly string[]).includes(value);
}

export function reportFamilyForType(reportType: string) {
  return {
    EXECUTIVE_ASSURANCE: "executive-assurance",
    PROGRAM_ASSURANCE: "program-assurance",
    PROVIDER_ASSURANCE: "provider-assurance",
    FUNDING_LINEAGE: "funding-lineage",
    AUDIT_PACKET: "audit-packet",
  }[String(reportType || "").toUpperCase()] || null;
}

export function createAuthorizedReportProjection(input: Partial<AuthorizedReportProjection> & { payload: Record<string, unknown> }): AuthorizedReportProjection {
  if (!isProductKey(input.productKey)) throw new Error("REPORT_PRODUCT_KEY_INVALID");
  const reportFamily = String(input.reportFamily || "").trim();
  if (!reportFamily) throw new Error("REPORT_FAMILY_REQUIRED");
  if (!input.scope?.organizationId || !input.scope?.tenantId) throw new Error("REPORT_SCOPE_REQUIRED");
  if (!input.classification || !input.generatedAt) throw new Error("REPORT_PROJECTION_METADATA_REQUIRED");
  if (!["INTERNAL", "RESTRICTED_EXTERNAL", "PUBLIC"].includes(input.classification)) throw new Error("REPORT_CLASSIFICATION_INVALID");
  if (!Array.isArray(input.canonicalReferences)) throw new Error("REPORT_CANONICAL_REFERENCES_REQUIRED");
  return {
    productKey: input.productKey,
    reportFamily,
    subject: input.subject,
    scope: input.scope,
    reportingPeriod: input.reportingPeriod,
    classification: input.classification,
    generatedAt: input.generatedAt,
    canonicalReferences: input.canonicalReferences,
    sourceVersions: input.sourceVersions || [],
    provenance: input.provenance || {},
    payload: input.payload,
  };
}
