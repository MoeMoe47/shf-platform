import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { assuranceScope, type AssuranceActor } from "../model/government-assurance.js";
import { ReportPublicationActionRepo } from "../../reporting/report-publication-action-repo.js";
import { requirePublicScope, toPublicProjection, PUBLIC_PROJECTION_AUTHORITY } from "../adapters/public-projection-boundary.js";
import { getPublicReportGovernanceRegistration } from "../../reporting/report-public-governance-registry.js";

function actor(input: any): AssuranceActor {
  return {
    userId: String(input?.userId || input?.user_id || input?.id || ""),
    organizationId: String(input?.organizationId || input?.organization_id || input?.active_organization_id || ""),
    tenantId: String(input?.tenantId || input?.tenant_id || ""),
    permissions: input?.permissions || [],
    actor_type: input?.actor_type || input?.actorType || "user",
  };
}

function requirePermission(input: any, permission: string) {
  const a = actor(input);
  if (!hasPermission(a.permissions || [], permission)) throw new Error("GPA_PERMISSION_REQUIRED");
  if (!a.organizationId || a.tenantId !== `tenant:${a.organizationId}`) throw new Error("GPA_SCOPE_REQUIRED");
  return { actor: a, scope: assuranceScope(a) };
}

async function count(table: string, scope: any, where = "TRUE", params: any[] = []) {
  const result = await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id=$1 AND tenant_id=$2 AND ${where}`, [scope.organizationId, scope.tenantId, ...params]);
  return Number(result.rows[0]?.count || 0);
}

async function sumFunding(scope: any, type: string, status?: string) {
  const extra = status ? " AND status=$3" : "";
  const params = status ? [scope.organizationId, scope.tenantId, type, status] : [scope.organizationId, scope.tenantId, type];
  const result = await query(`SELECT COALESCE(SUM(amount),0)::numeric AS amount FROM gpa_funding_references WHERE organization_id=$1 AND tenant_id=$2 AND canonical_record_type=$3${status ? " AND status=$4" : ""}`, params);
  return Number(result.rows[0]?.amount || 0);
}

export class PilotReportingService {
  constructor(private publicProjections = new ReportPublicationActionRepo()) {}
  async dashboard(input: any) {
    const { scope } = requirePermission(input, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_VIEW);
    const [claims, verifiedClaims, providers, programs, truth, findings, reconciliations, overdueActions, audits, sourceSystems, staleSources, plans, fundingAwarded, fundingObligated, fundingVerified] = await Promise.all([
      count("gpa_claims", scope), count("gpa_claims", scope, "status IN ('VERIFIED','PARTIALLY_VERIFIED')"),
      query("SELECT COUNT(DISTINCT provider_organization_reference)::int AS count FROM gpa_funding_references WHERE organization_id=$1 AND tenant_id=$2 AND provider_organization_reference IS NOT NULL", [scope.organizationId, scope.tenantId]).then((r) => Number(r.rows[0]?.count || 0)),
      query("SELECT COUNT(DISTINCT program_reference)::int AS count FROM gpa_funding_references WHERE organization_id=$1 AND tenant_id=$2 AND program_reference IS NOT NULL", [scope.organizationId, scope.tenantId]).then((r) => Number(r.rows[0]?.count || 0)),
      count("gpa_truth_facts", scope, "status='ACCEPTED'"), count("gpa_findings", scope, "status NOT IN ('RESOLVED','CLOSED','WITHDRAWN','SUPERSEDED')"), count("gpa_reconciliation_cases", scope, "status NOT IN ('RESOLVED','CLOSED','SUPERSEDED')"), count("gpa_corrective_actions", scope, "status='OVERDUE'"), count("gpa_audit_engagements", scope, "status NOT IN ('CLOSED','CANCELLED')"), count("gpa_source_systems", scope, "status='ACTIVE'"), count("gpa_source_health", scope, "current_freshness_state IN ('STALE','DEGRADED')"), count("gpa_monitoring_plans", scope, "status IN ('APPROVED','ACTIVE')"), sumFunding(scope, "AWARD"), sumFunding(scope, "OBLIGATION"), sumFunding(scope, "EXPENDITURE", "VERIFIED"),
    ]);
    return { scope, summary: { claims, verifiedClaims, providers, programs, acceptedTruthFacts: truth, openFindings: findings, openMaterialReconciliations: reconciliations, overdueCorrectiveActions: overdueActions, auditsInProgress: audits, activeSourceSystems: sourceSystems, degradedOrStaleSources: staleSources, activeMonitoringPlans: plans, fundingAwarded, fundingObligated, verifiedExpenditure: fundingVerified }, actionRequired: { claimsAwaitingVerification: Math.max(claims - verifiedClaims, 0), openMaterialReconciliations: reconciliations, overdueCorrectiveActions: overdueActions, sourceHealthFailures: staleSources }, generatedAt: new Date().toISOString() };
  }

  async readiness(input: any) {
    const { scope } = requirePermission(input, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    const pilot = await query("SELECT * FROM gpa_pilot_configurations WHERE organization_id=$1 AND tenant_id=$2 AND status NOT IN ('CLOSED') ORDER BY updated_at DESC LIMIT 1", [scope.organizationId, scope.tenantId]);
    const configuration = pilot.rows[0] || null;
    const checks = await Promise.all([
      ["pilot_configuration", "Pilot configuration", configuration ? 1 : 0],
      ["pilot_programs", "Configured programs", configuration ? (configuration.program_references || []).length : 0],
      ["pilot_providers", "Configured providers", configuration ? (configuration.provider_references || []).length : 0],
      ["pilot_sources", "Configured source systems", configuration ? (configuration.source_system_references || []).length : 0],
      ["source_systems", "Registered source systems", count("gpa_source_systems", scope, "status='ACTIVE'")],
      ["source_authorities", "Active source authorities", count("gpa_source_authorities", scope, "status='ACTIVE'")],
      ["data_use_policies", "Active data-use policies", count("gpa_data_use_policies", scope, "status='ACTIVE'")],
      ["metrics", "Active metric definitions", count("gpa_metrics", scope, "status='ACTIVE'")],
      ["verification_methods", "Active verification methods", count("gpa_verification_methods", scope, "status='ACTIVE'")],
      ["monitoring", "Monitoring capability", count("gpa_monitoring_plans", scope)],
    ]);
    const blockers = checks.filter(([, , value]) => Number(value) === 0).map(([code, label]) => ({ code: `PILOT_${String(code).toUpperCase()}_MISSING`, label }));
    const status = blockers.length ? "READY_WITH_CONDITIONS" : configuration?.status === "READY_FOR_ACCEPTANCE" || configuration?.status === "ACTIVE" ? "READY_FOR_COUNTY_ACCEPTANCE" : "READY_WITH_CONDITIONS";
    return { status, configuration, blockers, checks: checks.map(([code, label, value]) => ({ code, label, count: value })), generatedAt: new Date().toISOString() };
  }

  async publicSummary(input: any = {}) {
    // Public callers without a declared public scope receive a safe empty
    // projection rather than an internal error. A public record is never
    // inferred from an omitted scope.
    let scope: any;
    try {
      scope = requirePublicScope(input);
    } catch (error: any) {
      if (String(error?.message || "") !== "PUBLIC_PROJECTION_SCOPE_REQUIRED") throw error;
      return { items: [], generatedAt: new Date().toISOString(), availability: "NOT_PUBLISHED", disclosure: PUBLIC_PROJECTION_AUTHORITY, scope: { jurisdiction: null } };
    }
    const reportId = String(input?.reportId || input?.report_id || "").trim();
    const reportVersion = Number(input?.reportVersion || input?.report_version || 0);
    if (!reportId || !Number.isInteger(reportVersion) || reportVersion < 1) {
      return { items: [], generatedAt: new Date().toISOString(), availability: "NOT_PUBLISHED", disclosure: PUBLIC_PROJECTION_AUTHORITY, scope: { jurisdiction: scope.jurisdiction || null } };
    }
    // A projection row is not sufficient by itself. The report family must be
    // registered by Reporting/Public Disclosure before the public GPA route
    // will address it.
    if (!getPublicReportGovernanceRegistration(reportId, reportVersion)) {
      return { items: [], generatedAt: new Date().toISOString(), availability: "NOT_PUBLISHED", disclosure: PUBLIC_PROJECTION_AUTHORITY, scope: { jurisdiction: scope.jurisdiction || null } };
    }
    const rows = await this.publicProjections.listPublicProjections(reportId, reportVersion, scope);
    const items = rows.map(toPublicProjection).filter(Boolean);
    return { items, generatedAt: new Date().toISOString(), availability: items.length ? "PUBLISHED" : "NOT_PUBLISHED", disclosure: PUBLIC_PROJECTION_AUTHORITY, scope: { jurisdiction: scope.jurisdiction || null } };
  }
}
