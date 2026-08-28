import type { Organization } from "../model/organization";

export class IdentityRepo {
  async getUserByEmail(email: string) {
    const users = [
      {
        user_id: "user_admin_001",
        organization_id: "org_shf_001",
        email: "admin@siliconheartland.org",
        full_name: "SHF Org Admin",
        roles: ["org_admin"],
        permissions: [
          "user.read",
          "role.read",
          "membership.assign",
          "membership.revoke",
          "program.create",
          "program.read",
          "program.update",
          "program.transition",
          "case.create",
          "case.read",
          "case.update",
          "case.assign",
          "case.transition",
          "audit.read",
          "exchange.fundingCommitments.view",
          "exchange.fundingCommitments.manage",
        ],
      },
      {
        user_id: "user_operator_001",
        organization_id: "org_shf_001",
        email: "operator@siliconheartland.org",
        full_name: "SHF Operator",
        roles: ["operator"],
        permissions: [
          "program.read",
          "case.create",
          "case.read",
          "case.update",
          "case.assign",
          "case.transition",
        ],
      },
    ];

    return users.find((u) => u.email === email) || null;
  }

  async getUserById(userId: string) {
    if (userId === "user_operator_001") {
      return {
        user_id: "user_operator_001",
        organization_id: "org_shf_001",
        email: "operator@siliconheartland.org",
        full_name: "SHF Operator",
        roles: ["operator"],
        permissions: [
          "program.read",
          "case.create",
          "case.read",
          "case.update",
          "case.assign",
          "case.transition",
        ],
      };
    }

    // Phase 2A Live Learning demo identities (mirrors existing users table
    // seed — see apps/shs-api/seeds/010_seed_live_learning_users.sql).
    // roles here drive real permission checks (see
    // src/auth/security-permissions.ts's STUDENT/INSTRUCTOR role maps),
    // unlike src/utils/zoomAccess.js's localStorage state, which the
    // Live Learning service never consults.
    if (userId === "user_student_001") {
      return {
        user_id: "user_student_001",
        organization_id: "org_shf_001",
        email: "student@siliconheartland.org",
        full_name: "SHF Demo Student",
        roles: ["student"],
      };
    }
    if (userId === "user_instructor_001") {
      return {
        user_id: "user_instructor_001",
        organization_id: "org_shf_001",
        email: "instructor@siliconheartland.org",
        full_name: "SHF Demo Instructor",
        roles: ["instructor"],
      };
    }

    return null;
  }

  async listOrganizations(): Promise<Organization[]> {
    return [
      {
        organization_id: "org_shf_001",
        organization_name: "Silicon Heartland Foundation",
        service_categories: ["education_support", "workforce_training", "youth_services"],
        contact_points: [
          { type: "email", value: "admin@siliconheartland.org" },
          { type: "phone", value: "555-0100" },
        ],
        intake_rules: ["manual_review_required_for_high_urgency"],
        eligibility_notes: "Demo organization for phase 1 hub foundation build.",
        hours: "Mon-Fri 9:00 AM - 5:00 PM",
        referral_channels: ["manual_assisted_entry", "api"],
        accepted_fields: ["name", "email", "phone", "need_category", "urgency_level"],
        source_system_type: "shs_internal",
        integration_mode: "manual_assisted_entry",
        active_status: "active",
      },
      {
        organization_id: "org_partner_001",
        organization_name: "Franklin County Workforce Partner",
        service_categories: ["job_placement", "benefits_navigation", "transportation"],
        contact_points: [
          { type: "email", value: "intake@franklinworkforce.org" },
        ],
        intake_rules: ["accept_referrals_during_business_hours"],
        eligibility_notes: "Pilot partner for referral exchange.",
        hours: "Mon-Fri 8:30 AM - 4:30 PM",
        referral_channels: ["batch_import", "manual_assisted_entry"],
        accepted_fields: ["name", "dob", "phone", "need_category", "notes"],
        source_system_type: "partner_case_system",
        integration_mode: "hybrid",
        active_status: "active",
      },
    ];
  }

  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    const items = await this.listOrganizations();
    return items.find((org) => org.organization_id === organizationId) || null;
  }
}
