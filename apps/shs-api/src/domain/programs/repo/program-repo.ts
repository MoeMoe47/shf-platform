import { query } from "../../../db/client";
import type { TaxonomyCategory } from "../model/taxonomy-category";

export class ProgramRepo {
  async listPrograms() {
    const res = await query(
      `SELECT program_id, organization_id, name, program_type, status, owner_team_id, created_by_user_id, created_at, updated_at
       FROM programs
       ORDER BY updated_at DESC`
    );
    return res.rows;
  }

  async getProgramById(programId: string) {
    const res = await query(
      `SELECT program_id, organization_id, name, program_type, status, owner_team_id, created_by_user_id, created_at, updated_at
       FROM programs
       WHERE program_id = $1
       LIMIT 1`,
      [programId]
    );
    return res.rows[0] || null;
  }

  async createProgram(input: any) {
    const res = await query(
      `INSERT INTO programs (
        program_id, organization_id, name, program_type, status, owner_team_id, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING program_id, organization_id, name, program_type, status, owner_team_id, created_by_user_id, created_at, updated_at`,
      [
        input.program_id,
        input.organization_id,
        input.name,
        input.program_type,
        input.status,
        input.owner_team_id || null,
        input.created_by_user_id || null,
      ]
    );
    return res.rows[0];
  }

  async updateProgramStatus(programId: string, status: string) {
    const res = await query(
      `UPDATE programs
       SET status = $2, updated_at = NOW()
       WHERE program_id = $1
       RETURNING program_id, organization_id, name, program_type, status, owner_team_id, created_by_user_id, created_at, updated_at`,
      [programId, status]
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
