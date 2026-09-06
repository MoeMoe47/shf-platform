import { isPlatformGlobalRole } from "../../../auth/security-permissions.js";
import { IMPACT_ATTRIBUTION_SCOPES, IMPACT_METRICS } from "../model/impact-attribution.js";
import { ImpactAttributionRepo } from "../repo/impact-attribution-repo.js";

const SHF_ORG_ID = "org_shf_001";

function activeOrganizationId(actor: any) {
  return String(actor?.active_organization_id || actor?.organization_id || "").trim();
}

function actorHasPermission(actor: any, permission: string) {
  return Array.isArray(actor?.permissions) && actor.permissions.includes(permission);
}

function actorHasPlatformAuthority(actor: any) {
  const roles = Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
  return roles.some((role: string) => isPlatformGlobalRole(role, actor?.role_scope_type));
}

function actorCanNetworkAggregate(actor: any) {
  return actorHasPlatformAuthority(actor) || activeOrganizationId(actor) === SHF_ORG_ID;
}

export class ImpactAttributionError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "ImpactAttributionError";
  }
}

export class ImpactAttributionService {
  constructor(private repo = new ImpactAttributionRepo()) {}

  async getAttribution(input: any, actor: any) {
    if (!actorHasPermission(actor, "impact.aggregate.view")) {
      throw new ImpactAttributionError("FORBIDDEN", "Impact aggregation permission is required.", 403);
    }
    const metricKey = String(input?.metric_key || input?.metricKey || IMPACT_METRICS.TRUTH_FACT_COUNT).trim();
    if (!Object.values(IMPACT_METRICS).includes(metricKey as any)) {
      throw new ImpactAttributionError("UNKNOWN_METRIC", "Unknown impact attribution metric.", 400);
    }
    const scope = String(input?.scope || IMPACT_ATTRIBUTION_SCOPES.ORGANIZATION).trim();
    if (!Object.values(IMPACT_ATTRIBUTION_SCOPES).includes(scope as any)) {
      throw new ImpactAttributionError("UNKNOWN_SCOPE", "Unknown impact attribution scope.", 400);
    }
    const from = input?.from ? new Date(String(input.from)) : new Date("1970-01-01T00:00:00Z");
    const until = input?.until ? new Date(String(input.until)) : new Date("9999-12-31T00:00:00Z");
    if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime()) || until <= from) {
      throw new ImpactAttributionError("INVALID_PERIOD", "A valid from/until period is required.", 400);
    }
    const requestedOrganizationId = String(input?.organization_id || input?.organizationId || activeOrganizationId(actor)).trim();
    const actorOrg = activeOrganizationId(actor);
    const networkScope = [
      IMPACT_ATTRIBUTION_SCOPES.SHF_DIRECT,
      IMPACT_ATTRIBUTION_SCOPES.SHF_SUPPORTED_NETWORK,
      IMPACT_ATTRIBUTION_SCOPES.WHOLE_NETWORK,
    ].includes(scope as any);
    if (networkScope && !actorCanNetworkAggregate(actor)) {
      throw new ImpactAttributionError("FORBIDDEN", "Whole-network impact aggregation requires SHF/platform authority.", 403);
    }
    if (scope === IMPACT_ATTRIBUTION_SCOPES.ORGANIZATION && requestedOrganizationId !== actorOrg && !actorCanNetworkAggregate(actor)) {
      throw new ImpactAttributionError("FORBIDDEN", "Cannot inspect another organization's attribution detail.", 403);
    }

    const facts = await this.repo.listCanonicalFacts({ metricKey, from, until });
    const supportByFact = await this.repo.listSupportReasons({
      producerOrganizationIds: [...new Set<string>(facts.map((row: any) => String(row.producer_organization_id)))],
      factIds: facts.map((row: any) => row.fact_id),
    });
    const projected = facts.map((row: any) => {
      const producerOrganizationId = row.producer_organization_id;
      const supportReasons = supportByFact.get(row.fact_id) || [];
      const direct = producerOrganizationId === SHF_ORG_ID;
      const supported = !direct && supportReasons.length > 0;
      return {
        factId: row.fact_id,
        metricKey,
        producerOrganizationId,
        programId: row.program_id || null,
        ownerOrganizationId: row.owner_organization_id || null,
        operatorOrganizationId: row.operator_organization_id || null,
        accountableOrganizationId: row.accountable_organization_id || null,
        sourceType: row.source_type,
        sourceRecordId: row.source_record_id,
        evidenceId: row.evidence_id || null,
        supportClassification: direct ? "DIRECT" : supported ? "SUPPORTED" : "INDEPENDENT_ORGANIZATION",
        supportReasons,
        value: 1,
        occurredAt: row.occurred_at,
      };
    });

    const items = projected.filter((item: any) => {
      if (scope === IMPACT_ATTRIBUTION_SCOPES.SHF_DIRECT) return item.producerOrganizationId === SHF_ORG_ID;
      if (scope === IMPACT_ATTRIBUTION_SCOPES.SHF_SUPPORTED_NETWORK) return item.producerOrganizationId !== SHF_ORG_ID && item.supportReasons.length > 0;
      if (scope === IMPACT_ATTRIBUTION_SCOPES.WHOLE_NETWORK) return item.producerOrganizationId === SHF_ORG_ID || item.supportReasons.length > 0;
      return item.producerOrganizationId === requestedOrganizationId;
    });
    const uniqueFacts = new Map<string, any>(items.map((item: any) => [item.factId, item]));
    const dedupedItems = [...uniqueFacts.values()];
    const allUnique = new Map<string, any>(projected.map((item: any) => [item.factId, item]));
    const allItems = [...allUnique.values()];
    return {
      metricKey,
      scope,
      period: { from: from.toISOString(), until: until.toISOString() },
      total: dedupedItems.reduce((sum: number, item: any) => sum + item.value, 0),
      directShf: allItems.filter((item: any) => item.producerOrganizationId === SHF_ORG_ID).length,
      supportedNetwork: allItems.filter((item: any) => item.producerOrganizationId !== SHF_ORG_ID && item.supportReasons.length > 0).length,
      wholeNetwork: allItems.filter((item: any) => item.producerOrganizationId === SHF_ORG_ID || item.supportReasons.length > 0).length,
      producingOrganizations: [...new Set(dedupedItems.map((item: any) => item.producerOrganizationId))].sort(),
      sourceFactCount: dedupedItems.length,
      items: dedupedItems,
    };
  }
}
