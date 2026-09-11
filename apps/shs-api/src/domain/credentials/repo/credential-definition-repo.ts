import { query } from "../../../db/client.js";
import { CredentialDefinition } from "../model/credential.js";

const COLUMNS = `
  credential_definition_id, slug, name, credential_type, issuing_authority, description,
  career_id, requires_accepted_capstone, validity_period_months, renewal_window_days,
  eligibility_policy_version, eligibility_requirements_json,
  status, created_by_user_id, created_at, updated_at
`;

function rowToDefinition(row: any): CredentialDefinition {
  return {
    id: row.credential_definition_id,
    slug: row.slug,
    name: row.name,
    credentialType: row.credential_type,
    issuingAuthority: row.issuing_authority,
    description: row.description,
    careerId: row.career_id,
    requiresAcceptedCapstone: row.requires_accepted_capstone,
    eligibilityPolicyVersion: row.eligibility_policy_version || "accepted-capstone.v1",
    eligibilityRequirements: row.eligibility_requirements_json || {},
    validityPeriodMonths: row.validity_period_months === null ? null : Number(row.validity_period_months),
    renewalWindowDays: row.renewal_window_days === null ? null : Number(row.renewal_window_days),
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export class CredentialDefinitionRepo {
  async create(input: {
    id: string; slug: string; name: string; credentialType: string; issuingAuthority: string;
    description: string | null; careerId: string | null; requiresAcceptedCapstone: boolean;
    validityPeriodMonths: number | null; renewalWindowDays: number | null; createdByUserId: string;
    eligibilityPolicyVersion?: string; eligibilityRequirements?: Record<string, unknown>;
  }): Promise<CredentialDefinition> {
    const res = await query(
      `INSERT INTO credential_definitions (
        credential_definition_id, slug, name, credential_type, issuing_authority, description,
        career_id, requires_accepted_capstone, validity_period_months, renewal_window_days,
        eligibility_policy_version, eligibility_requirements_json, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING ${COLUMNS}`,
      [
        input.id, input.slug, input.name, input.credentialType, input.issuingAuthority, input.description,
        input.careerId, input.requiresAcceptedCapstone, input.validityPeriodMonths, input.renewalWindowDays,
        input.eligibilityPolicyVersion || (input.requiresAcceptedCapstone ? "accepted-capstone.v1" : "manual.v1"),
        JSON.stringify(input.eligibilityRequirements || {}), input.createdByUserId,
      ],
    );
    return rowToDefinition(res.rows[0]);
  }

  async getById(id: string): Promise<CredentialDefinition | null> {
    const res = await query(`SELECT ${COLUMNS} FROM credential_definitions WHERE credential_definition_id=$1`, [id]);
    return res.rows[0] ? rowToDefinition(res.rows[0]) : null;
  }

  async getBySlug(slug: string): Promise<CredentialDefinition | null> {
    const res = await query(`SELECT ${COLUMNS} FROM credential_definitions WHERE slug=$1`, [slug]);
    return res.rows[0] ? rowToDefinition(res.rows[0]) : null;
  }

  async listActive(): Promise<CredentialDefinition[]> {
    const res = await query(`SELECT ${COLUMNS} FROM credential_definitions WHERE status='active' ORDER BY name ASC`);
    return res.rows.map(rowToDefinition);
  }
}
