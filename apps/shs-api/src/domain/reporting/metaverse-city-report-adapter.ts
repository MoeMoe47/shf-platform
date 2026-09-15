import { query } from "../../db/client.js";
import { isAdminTier } from "../shared/audience-eligibility.js";
import { getSiliconHeartlandCityRegistry } from "../metaverse/registry/city-registry.js";
import { createAuthorizedReportProjection, type AuthorizedReportProjection, type ProductReportProjectionAdapter } from "./product-report-contract.js";

const FAMILIES = new Set(["metaverse-city-participation"]);

const REPORT_TYPES: Record<string, string> = {
  "metaverse-city-participation": "METAVERSE_CITY_PARTICIPATION",
};

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || actor?.tenant || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  if (!organizationId || !tenantId || !userId) throw new Error("REPORT_SCOPE_REQUIRED");
  const admin = isAdminTier(actor?.roles || []);
  const instructor = Boolean(actor?.roles?.includes?.("instructor"));
  if (!admin && !instructor) throw new Error("REPORT_SUBJECT_FORBIDDEN");
  return { organizationId, tenantId, userId, admin };
}

function ref(type: string, id: string, label = id) { return { type, id, label }; }

function period(input: any) {
  const value = input?.reportingPeriod || input?.reporting_period;
  return value && typeof value === "object" ? value : { label: String(value || "Current state") };
}

function presentation(subject: string, generatedAt: string, rows: any[], references: any[]) {
  return {
    brand: { displayName: "Silicon Heartland Foundation", shortName: "Metaverse", headerLabel: "Metaverse", subtitle: "City, job, civic, and economy participation reporting", category: "Metaverse Reporting", attribution: "Silicon Heartland Foundation" },
    reportTitle: "City / Job / Civic / Economy Participation Report",
    subjectLabel: subject,
    reportingPeriod: "Current state",
    generatedAt,
    classification: "INTERNAL",
    summary: { subject, status: "CANONICAL_DATA", privacy: "Authorized organization-scoped projection; no unsupported inference" },
    sections: [
      { title: "Report Summary", tables: [{ headers: ["Measure", "Value", "Authority"], rows }], notes: [] },
      { title: "Items Requiring Attention", notes: ["Only canonical records are included. Missing or unresolved links are not inferred."] },
    ],
    methodology: {
      source_authority: "Metaverse city registry, Student Opportunity Exchange, Market/Treasury, and verified-evidence authorities where applicable",
      privacy: "Learner-level protected data, private orders, and participant identities are omitted; only aggregate organization-scoped counts are reported.",
      publication: "Generation does not publish or release this report.",
    },
    references,
    metadata: { product: "Silicon Heartland Foundation", reportFamily: "metaverse-city-participation", generatedAt, canonicalReferenceCount: references.length, aiInvolvement: "No" },
  };
}

async function one(executor: typeof query, sql: string, params: unknown[]) { const result = await executor(sql, params); return result.rows[0] || null; }

export class MetaverseCityReportAdapter implements ProductReportProjectionAdapter {
  productKey = "foundation" as const;
  constructor(private dbQuery = query) {}
  supports(reportFamily: string) { return FAMILIES.has(reportFamily); }

  private async projection(s: ReturnType<typeof scope>) {
    const references: any[] = [];
    const rows: any[] = [];

    const cityRegistry = getSiliconHeartlandCityRegistry();
    references.push(ref("METAVERSE_CITY_REGISTRY", cityRegistry.city_id, cityRegistry.label));
    rows.push(["City districts", cityRegistry.districts?.length || 0, "City/District Registry (MET-2)"]);
    rows.push(["City facilities", cityRegistry.facilities?.length || 0, "City/District Registry (MET-2)"]);

    const opportunities = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM student_opportunities WHERE organization_id=$1", [s.organizationId]);
    const awards = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM student_opportunity_awards WHERE organization_id=$1", [s.organizationId]);
    const submissions = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM student_opportunity_submissions WHERE organization_id=$1", [s.organizationId]);
    references.push(ref("METAVERSE_OPPORTUNITY_EXCHANGE", s.organizationId, "Student Opportunity Exchange (MET-8)"));
    rows.push(["Job/task opportunities", opportunities?.count || 0, "Student Opportunity Exchange authority"]);
    rows.push(["Job/task awards", awards?.count || 0, "Student Opportunity Exchange authority"]);
    rows.push(["Job/task submissions", submissions?.count || 0, "Student Opportunity Exchange authority"]);

    const listings = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM market_listings WHERE organization_id=$1 AND status='PUBLISHED'", [s.organizationId]);
    const orders = await one(this.dbQuery, "SELECT COUNT(*)::int AS count, COALESCE(SUM(total_price_snapshot),0) AS total FROM market_orders WHERE organization_id=$1 AND status <> 'CANCELLED'", [s.organizationId]);
    references.push(ref("METAVERSE_MARKET", s.organizationId, "Metaverse Market (MET-9)"));
    rows.push(["Published market listings", listings?.count || 0, "Market authority"]);
    rows.push(["Market orders", orders?.count || 0, "Market authority"]);
    rows.push(["Market order value", orders?.total ?? 0, "Market authority"]);
    rows.push(["Treasury ledger balance", "Not available", "Durable ledger persistence pending — MET-9 P1"]);

    rows.push(["Civic governance evidence", "Owned by SHF Civic", "MET-1 Civic Government Boundary — not duplicated here"]);

    const evidence = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM prepare_prove_evidence WHERE organization_id=$1 AND source_type='OPPORTUNITY_SUBMISSION'", [s.organizationId]);
    const truthFacts = await one(this.dbQuery, "SELECT COUNT(*)::int AS count FROM curriculum_truth_facts WHERE organization_id=$1 AND source_type='OPPORTUNITY_SUBMISSION'", [s.organizationId]);
    references.push(ref("METAVERSE_EVIDENCE", s.organizationId, "Verified-evidence projection for metaverse opportunity work"));
    rows.push(["Verified metaverse evidence records", evidence?.count || 0, "Prepare/Prove evidence authority"]);
    rows.push(["Verified metaverse truth facts", truthFacts?.count || 0, "Curriculum Truth authority"]);

    return { subject: `Organization ${s.organizationId} metaverse participation`, rows, references };
  }

  async project(input: any, actor: any): Promise<AuthorizedReportProjection> {
    const family = String(input?.reportFamily || input?.report_family || "").trim();
    if (!this.supports(family)) throw new Error("REPORT_FAMILY_NOT_SUPPORTED");
    const s = scope(actor);
    const generatedAt = new Date().toISOString();
    const data = await this.projection(s);
    const reportPeriod = period(input);
    const reportType = REPORT_TYPES[family];
    const reportPresentation = presentation(data.subject, generatedAt, data.rows, data.references);
    return createAuthorizedReportProjection({
      productKey: "foundation",
      reportFamily: family,
      subject: data.subject,
      scope: { organizationId: s.organizationId, tenantId: s.tenantId, subjectReference: data.subject, jurisdiction: "Authorized-Scope" },
      reportingPeriod: reportPeriod,
      classification: "INTERNAL",
      generatedAt,
      canonicalReferences: data.references,
      sourceVersions: [{ authority: "metaverse-city-participation", generatedAt }],
      provenance: { adapter: "metaverse-city-participation-reporting", sourceAuthority: "Metaverse City Registry, Opportunity Exchange, Market, and verified-evidence authorities", reportType },
      payload: { reportType, reportVersion: 1, scope: { subjectReference: data.subject, jurisdiction: "Authorized-Scope", reportingPeriod: reportPeriod }, classification: "INTERNAL", generatedAt, canonicalReferences: data.references, presentation: { ...reportPresentation, reportingPeriod: reportPeriod }, metaverse: { reportFamily: family, subject: data.subject, rows: data.rows } },
    });
  }
}

export const metaverseCityReportAdapter = new MetaverseCityReportAdapter();
