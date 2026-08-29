import { query } from "../../../db/client.js";
import type { TaxonomyCategory } from "../model/taxonomy-category.js";

const PROGRAM_COLUMNS = `
  program_id, organization_id, name, program_type, status, owner_team_id, created_by_user_id,
  program_classification,
  COALESCE(owner_organization_id, organization_id) AS owner_organization_id,
  COALESCE(operator_organization_id, organization_id) AS operator_organization_id,
  COALESCE(accountable_organization_id, organization_id) AS accountable_organization_id,
  created_at, updated_at
`;

export class ProgramRepo {
  async listPrograms(scope: any) {
    const res = await query(
      `SELECT ${PROGRAM_COLUMNS}
       FROM programs
       WHERE organization_id = $1
          OR owner_organization_id = $1
          OR operator_organization_id = $1
          OR accountable_organization_id = $1
       ORDER BY updated_at DESC`
      , [scope.organization_id]
    );
    return res.rows;
  }

  async getProgramById(programId: string, scope: any) {
    const res = await query(
      `SELECT ${PROGRAM_COLUMNS}
       FROM programs
       WHERE program_id = $1
         AND (
           organization_id = $2
           OR owner_organization_id = $2
           OR operator_organization_id = $2
           OR accountable_organization_id = $2
         )
       LIMIT 1`,
      [programId, scope.organization_id]
    );
    return res.rows[0] || null;
  }

  async getProgramForTransition(programId: string, scope: any) {
    const res = await query(
      `SELECT ${PROGRAM_COLUMNS}
       FROM programs
       WHERE program_id = $1
         AND (
           COALESCE(operator_organization_id, organization_id) = $2
           OR COALESCE(accountable_organization_id, organization_id) = $2
         )
       LIMIT 1`,
      [programId, scope.organization_id]
    );
    return res.rows[0] || null;
  }

  async createProgram(input: any) {
    const res = await query(
      `INSERT INTO programs (
        program_id, organization_id, name, program_type, status, owner_team_id, created_by_user_id,
        program_classification, owner_organization_id, operator_organization_id, accountable_organization_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING ${PROGRAM_COLUMNS}`,
      [
        input.program_id,
        input.accountable_organization_id,
        input.name,
        input.program_type,
        input.status,
        input.owner_team_id || null,
        input.created_by_user_id || null,
        input.program_classification,
        input.owner_organization_id,
        input.operator_organization_id,
        input.accountable_organization_id,
      ]
    );
    return res.rows[0];
  }

  async updateProgramStatus(programId: string, status: string, scope: any, expectedStatus?: string) {
    const res = await query(
      `UPDATE programs
       SET status = $2, updated_at = NOW()
       WHERE program_id = $1
         AND (
           COALESCE(operator_organization_id, organization_id) = $3
           OR COALESCE(accountable_organization_id, organization_id) = $3
         )
         AND ($4::text IS NULL OR status = $4)
       RETURNING ${PROGRAM_COLUMNS}`,
      [programId, status, scope.organization_id, expectedStatus || null]
    );
    return res.rows[0] || null;
  }

  async listTaxonomy(): Promise<TaxonomyCategory[]> {
    return [
      {
        category_id: "workforce_training",
        category_name: "Workforce Training",
        description: "Training and readiness programs for employment pathways.",
        synonyms: ["job training", "career training"],
        reporting_group: "workforce",
        active_status: "active",
      },
      {
        category_id: "job_placement",
        category_name: "Job Placement",
        description: "Placement support, employer matching, and hiring pipeline services.",
        synonyms: ["placement", "employment placement"],
        reporting_group: "workforce",
        active_status: "active",
      },
      {
        category_id: "education_support",
        category_name: "Education Support",
        description: "Academic support, tutoring, and education navigation services.",
        synonyms: ["school support", "academic support"],
        reporting_group: "education",
        active_status: "active",
      },
      {
        category_id: "childcare",
        category_name: "Childcare",
        description: "Childcare access and support services.",
        synonyms: ["daycare", "child care"],
        reporting_group: "family_support",
        active_status: "active",
      },
      {
        category_id: "transportation",
        category_name: "Transportation",
        description: "Transportation assistance for appointments, work, and services.",
        synonyms: ["rides", "transit support"],
        reporting_group: "stability_support",
        active_status: "active",
      },
      {
        category_id: "housing_stabilization",
        category_name: "Housing Stabilization",
        description: "Housing retention, navigation, and stabilization support.",
        synonyms: ["housing support", "housing retention"],
        reporting_group: "stability_support",
        active_status: "active",
      },
      {
        category_id: "food_access",
        category_name: "Food Access",
        description: "Food distribution, pantry access, and nutrition support.",
        synonyms: ["food support", "nutrition access"],
        reporting_group: "stability_support",
        active_status: "active",
      },
      {
        category_id: "benefits_navigation",
        category_name: "Benefits Navigation",
        description: "Support for public benefits applications and renewal.",
        synonyms: ["benefits help", "public benefits"],
        reporting_group: "stability_support",
        active_status: "active",
      },
      {
        category_id: "financial_coaching",
        category_name: "Financial Coaching",
        description: "Budgeting, savings, tax help, and financial guidance.",
        synonyms: ["financial counseling", "money coaching"],
        reporting_group: "economic_support",
        active_status: "active",
      },
      {
        category_id: "family_support",
        category_name: "Family Support",
        description: "Family-focused support services and navigation.",
        synonyms: ["family services", "household support"],
        reporting_group: "family_support",
        active_status: "active",
      },
      {
        category_id: "youth_services",
        category_name: "Youth Services",
        description: "Services and programming for youth development.",
        synonyms: ["youth support", "teen services"],
        reporting_group: "education",
        active_status: "active",
      },
      {
        category_id: "health_navigation",
        category_name: "Health Navigation",
        description: "Navigation support for health and wellness systems.",
        synonyms: ["wellness navigation", "health support"],
        reporting_group: "health_support",
        active_status: "active",
      },
      {
        category_id: "mental_health_support",
        category_name: "Mental Health Support",
        description: "Mental health referral, navigation, and support services.",
        synonyms: ["behavioral health", "counseling support"],
        reporting_group: "health_support",
        active_status: "active",
      },
      {
        category_id: "legal_advocacy_support",
        category_name: "Legal / Advocacy Support",
        description: "Legal support, rights advocacy, and case advocacy services.",
        synonyms: ["legal aid", "advocacy"],
        reporting_group: "advocacy_support",
        active_status: "active",
      },
    ];
  }
}
