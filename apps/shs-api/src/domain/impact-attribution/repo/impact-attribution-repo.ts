import { query } from "../../../db/client.js";
import { IMPACT_METRICS } from "../model/impact-attribution.js";

const SHF_ORG_ID = "org_shf_001";

const METRIC_FILTERS: Record<string, string> = {
  [IMPACT_METRICS.TRUTH_FACT_COUNT]: "TRUE",
  [IMPACT_METRICS.LESSON_COMPLETION_COUNT]: "f.source_type = 'LESSON_COMPLETION'",
  [IMPACT_METRICS.PROJECT_ACCEPTED_COUNT]: "f.source_type = 'PROJECT_SUBMISSION'",
};

export class ImpactAttributionRepo {
  async listCanonicalFacts(input: { metricKey: string; from: Date; until: Date }, executor: any = { query }) {
    const filter = METRIC_FILTERS[input.metricKey];
    if (!filter) return [];
    const res = await executor.query(
      `WITH source_facts AS (
         SELECT
           f.truth_fact_id AS fact_id,
           f.fact_type,
           f.source_type,
           f.source_record_id,
           f.evidence_id,
           f.organization_id AS source_organization_id,
           f.learner_user_id,
           f.assignment_id,
           f.curriculum_release_id,
           f.provenance_json,
           f.occurred_at,
           COALESCE(p.program_id, f.provenance_json->>'program_id') AS program_id
         FROM curriculum_truth_facts f
         LEFT JOIN projects p
           ON f.source_type = 'PROJECT_SUBMISSION'
          AND p.organization_id = f.organization_id
          AND p.project_id = (
            SELECT ps.project_id
            FROM project_submissions ps
            WHERE ps.organization_id = f.organization_id
              AND ps.submission_id = f.source_record_id
            LIMIT 1
          )
         WHERE ${filter}
           AND f.occurred_at >= $1
           AND f.occurred_at < $2
       )
       SELECT
         sf.*,
         COALESCE(programs.operator_organization_id, programs.organization_id, sf.source_organization_id) AS producer_organization_id,
         programs.owner_organization_id,
         programs.operator_organization_id,
         programs.accountable_organization_id,
         programs.program_classification
       FROM source_facts sf
       LEFT JOIN programs
         ON programs.program_id = sf.program_id
       ORDER BY sf.occurred_at ASC, sf.fact_id ASC`,
      [input.from, input.until],
    );
    return res.rows;
  }

  async listSupportReasons(input: { producerOrganizationIds: string[]; factIds: string[] }, executor: any = { query }): Promise<Map<string, string[]>> {
    if (!input.producerOrganizationIds.length) return new Map<string, string[]>();
    const res = await executor.query(
      `WITH facts AS (
         SELECT
           f.truth_fact_id,
           f.organization_id AS source_organization_id,
           f.occurred_at,
           COALESCE(p.program_id, f.provenance_json->>'program_id') AS program_id
         FROM curriculum_truth_facts f
         LEFT JOIN projects p
           ON f.source_type = 'PROJECT_SUBMISSION'
          AND p.organization_id = f.organization_id
          AND p.project_id = (
            SELECT ps.project_id
            FROM project_submissions ps
            WHERE ps.organization_id = f.organization_id
              AND ps.submission_id = f.source_record_id
            LIMIT 1
          )
         WHERE f.truth_fact_id = ANY($1::text[])
       ),
       facts_with_producer AS (
         SELECT
           facts.truth_fact_id,
           facts.occurred_at,
           facts.program_id,
           COALESCE(programs.operator_organization_id, programs.organization_id, facts.source_organization_id) AS producer_organization_id
         FROM facts
         LEFT JOIN programs ON programs.program_id = facts.program_id
       ),
       reasons AS (
         SELECT f.truth_fact_id, 'NETWORK_MEMBERSHIP' AS reason
         FROM facts_with_producer f
         JOIN organization_relationships r
           ON r.source_organization_id = f.producer_organization_id
          AND r.target_organization_id = $2
          AND r.relationship_type = 'NETWORK_MEMBER_OF'
          AND r.status = 'ACTIVE'
          AND r.effective_from <= f.occurred_at
          AND (r.effective_to IS NULL OR r.effective_to >= f.occurred_at)
         WHERE f.producer_organization_id <> $2
         UNION
         SELECT f.truth_fact_id, 'INCUBATION' AS reason
         FROM facts_with_producer f
         JOIN organization_relationships r
           ON r.source_organization_id = $2
          AND r.target_organization_id = f.producer_organization_id
          AND r.relationship_type = 'INCUBATES'
          AND r.status = 'ACTIVE'
          AND r.effective_from <= f.occurred_at
          AND (r.effective_to IS NULL OR r.effective_to >= f.occurred_at)
         WHERE f.producer_organization_id <> $2
         UNION
         SELECT f.truth_fact_id, 'SERVICE_AGREEMENT' AS reason
         FROM facts_with_producer f
         JOIN service_agreements a
           ON a.provider_organization_id = $2
          AND a.consumer_organization_id = f.producer_organization_id
          AND a.status = 'ACTIVE'
          AND a.effective_from <= f.occurred_at
          AND (a.effective_until IS NULL OR a.effective_until >= f.occurred_at)
         WHERE f.producer_organization_id <> $2
         UNION
         SELECT f.truth_fact_id, 'FUNDING' AS reason
         FROM facts_with_producer f
         JOIN funding_grants g
           ON g.status IN ('ACTIVE', 'AWARDED', 'CLOSED')
          AND g.start_date <= f.occurred_at::date
          AND (g.end_date IS NULL OR g.end_date >= f.occurred_at::date)
         LEFT JOIN grant_program_allocations ga
           ON ga.grant_id = g.grant_id
          AND ga.program_id = f.program_id
         WHERE f.producer_organization_id <> $2
           AND (
             g.recipient_organization_id = f.producer_organization_id
             OR g.reporting_organization_id = f.producer_organization_id
             OR ga.allocation_id IS NOT NULL
           )
       )
       SELECT truth_fact_id, array_agg(reason ORDER BY reason) AS support_reasons
       FROM reasons
       GROUP BY truth_fact_id`,
      [input.factIds, SHF_ORG_ID],
    );
    return new Map<string, string[]>(res.rows.map((row: any) => [row.truth_fact_id, row.support_reasons || []]));
  }
}
