import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class PilotConfigurationRepo {
  constructor(private dbQuery: typeof query = query) {}
  private e(x?: Executor): Executor { return x || { query: this.dbQuery }; }
  async list(scope: any, x?: Executor) {
    return (await this.e(x).query("SELECT * FROM gpa_pilot_configurations WHERE organization_id=$1 AND tenant_id=$2 ORDER BY updated_at DESC", [scope.organizationId, scope.tenantId])).rows;
  }
  async get(id: string, scope: any, x?: Executor) {
    return (await this.e(x).query("SELECT * FROM gpa_pilot_configurations WHERE pilot_configuration_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId])).rows[0] || null;
  }
  async create(input: any, x?: Executor) {
    const values = [input.id, input.organizationId, input.tenantId, input.agencyOrganizationReference, input.pilotName, input.status, input.pilotStart, input.pilotEnd, JSON.stringify(input.programReferences || []), JSON.stringify(input.providerReferences || []), JSON.stringify(input.fundingReferences || []), JSON.stringify(input.sourceSystemReferences || []), JSON.stringify(input.allowedPurposes || []), JSON.stringify(input.requiredRoles || []), input.publicDisclosureProfileReference, input.readinessRequirementsVersion, input.createdBy, input.approvedBy, JSON.stringify(input.provenance || {}), input.effectiveFrom, input.effectiveTo];
    return (await this.e(x).query(`INSERT INTO gpa_pilot_configurations (pilot_configuration_id,organization_id,tenant_id,agency_organization_reference,pilot_name,status,pilot_start,pilot_end,program_references,provider_references,funding_references,source_system_references,allowed_purposes,required_roles,public_disclosure_profile_reference,readiness_requirements_version,created_by,approved_by,provenance,effective_from,effective_to) VALUES (${values.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`, values)).rows[0];
  }
  async updateStatus(id: string, scope: any, status: string, approvedBy?: string, x?: Executor) {
    return (await this.e(x).query("UPDATE gpa_pilot_configurations SET status=$1, approved_by=COALESCE($2,approved_by), updated_at=NOW() WHERE pilot_configuration_id=$3 AND organization_id=$4 AND tenant_id=$5 RETURNING *", [status, approvedBy || null, id, scope.organizationId, scope.tenantId])).rows[0] || null;
  }
}
