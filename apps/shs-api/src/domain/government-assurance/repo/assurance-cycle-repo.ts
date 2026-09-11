import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };
const json = (value: unknown) => JSON.stringify(value ?? {});

export class AssuranceCycleRepo {
  constructor(private dbQuery: typeof query = query) {}
  private e(executor?: Executor): Executor { return executor || { query: this.dbQuery }; }

  async createCycle(input: any, executor?: Executor) {
    const r = await this.e(executor).query(`INSERT INTO gpa_assurance_cycles
      (cycle_id,organization_id,tenant_id,program_reference,jurisdiction_reference,period_start,period_end,status,evidence_rule_reference,metric_references,review_state,closure_state,public_disclosure_state,provenance,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [input.cycle_id,input.organization_id,input.tenant_id,input.program_reference,input.jurisdiction_reference || null,input.period_start,input.period_end,input.status || "PLANNED",input.evidence_rule_reference || null,json(input.metric_references || []),input.review_state || "NOT_STARTED",input.closure_state || "OPEN",input.public_disclosure_state || "NOT_REVIEWED",json(input.provenance),input.created_by]);
    return r.rows[0];
  }
  async getCycle(id: string, scope: any, executor?: Executor) { return (await this.e(executor).query("SELECT * FROM gpa_assurance_cycles WHERE cycle_id=$1 AND organization_id=$2 AND tenant_id=$3", [id,scope.organizationId,scope.tenantId])).rows[0] || null; }
  async listCycles(scope: any, programReference?: string, executor?: Executor) {
    const p = [scope.organizationId,scope.tenantId]; let sql = "SELECT * FROM gpa_assurance_cycles WHERE organization_id=$1 AND tenant_id=$2";
    if (programReference) { p.push(programReference); sql += " AND program_reference=$3"; }
    return (await this.e(executor).query(`${sql} ORDER BY period_start DESC, created_at DESC`, p)).rows;
  }
  async updateCycle(id: string, scope: any, fields: any, executor?: Executor) {
    const names = Object.keys(fields); const values = names.map((name) => fields[name]);
    return (await this.e(executor).query(`UPDATE gpa_assurance_cycles SET ${names.map((name, i) => `${name}=$${i + 4}`).join(",")},updated_at=NOW() WHERE cycle_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *`, [id,scope.organizationId,scope.tenantId,...values])).rows[0] || null;
  }
  async addScope(input: any, executor?: Executor) {
    return (await this.e(executor).query(`INSERT INTO gpa_assurance_cycle_scope (scope_id,cycle_id,organization_id,tenant_id,provider_reference,service_reference,funding_reference,effective_from,effective_to,provenance,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [input.scope_id,input.cycle_id,input.organization_id,input.tenant_id,input.provider_reference,input.service_reference,input.funding_reference || null,input.effective_from || null,input.effective_to || null,json(input.provenance),input.created_by])).rows[0];
  }
  async listScope(cycleId: string, scope: any, executor?: Executor) { return (await this.e(executor).query("SELECT * FROM gpa_assurance_cycle_scope WHERE cycle_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY provider_reference,service_reference", [cycleId,scope.organizationId,scope.tenantId])).rows; }
  async createSnapshot(input: any, executor?: Executor) {
    return (await this.e(executor).query(`INSERT INTO gpa_assurance_cycle_snapshots (snapshot_id,cycle_id,organization_id,tenant_id,profile_type,subject_reference,summary,source_references,provenance) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [input.snapshot_id,input.cycle_id,input.organization_id,input.tenant_id,input.profile_type,input.subject_reference,json(input.summary),json(input.source_references),json(input.provenance)])).rows[0];
  }
  async listSnapshots(scope: any, profileType?: string, subjectReference?: string, executor?: Executor) {
    const p = [scope.organizationId,scope.tenantId]; let sql = "SELECT * FROM gpa_assurance_cycle_snapshots WHERE organization_id=$1 AND tenant_id=$2";
    if (profileType) { p.push(profileType); sql += ` AND profile_type=$${p.length}`; }
    if (subjectReference) { p.push(subjectReference); sql += ` AND subject_reference=$${p.length}`; }
    return (await this.e(executor).query(`${sql} ORDER BY created_at DESC`, p)).rows;
  }
}
