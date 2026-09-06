import type { Organization } from "../model/organization.js";
import { ProductionIdentityRepo } from "./production-identity-repo.js";

function databaseDevIdentityEnabled() {
  const environment = String(process.env.SHS_AUTH_ENV || process.env.NODE_ENV || "development").trim().toLowerCase();
  const enabled = String(process.env.SHS_DEV_DATABASE_IDENTITY_ENABLED || "0").trim().toLowerCase();
  return ["development", "test"].includes(environment) && ["1", "true", "yes", "on"].includes(enabled);
}

const productionIdentityRepo = new ProductionIdentityRepo();

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
    // Acceptance/local development may opt into canonical DB-backed identities.
    // Production always uses the session path in auth-middleware and cannot
    // accept this development-only resolver.
    if (databaseDevIdentityEnabled()) {
      const databaseIdentity = await productionIdentityRepo.getActiveIdentity(userId);
      if (databaseIdentity) return databaseIdentity;
    }

    if (userId === "user_admin_001") {
      return {
        user_id: "user_admin_001",
        organization_id: "org_shf_001",
        email: "admin@siliconheartland.org",
        full_name: "SHF Program Administrator",
        roles: ["org_admin"],
      };
    }
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
    if (userId === "user_no_assignment_001") {
      return {
        user_id: "user_no_assignment_001",
        organization_id: "org_shf_001",
        email: "no-assignment@test.invalid",
        full_name: "No Assignment Learner",
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
    // Disposable PREPARE/PROVE reviewer used only by the local full-stack
    // proof harness. The explicit verifier role keeps membership distinct
    // from competency-review authority.
    if (userId === "user_reviewer_001") {
      return {
        user_id: "user_reviewer_001",
        organization_id: "org_shf_001",
        email: "reviewer@siliconheartland.org",
        full_name: "SHF Proof Reviewer",
        roles: ["reviewer_verifier"],
      };
    }
    if (userId === "user_other_admin_001") {
      return {
        user_id: "user_other_admin_001",
        organization_id: "org_other",
        email: "admin@other.test",
        full_name: "Other Organization Program Staff",
        roles: ["program_manager"],
      };
    }
    if (userId === "user_partner_student_001") {
      return {
        user_id: "user_partner_student_001",
        organization_id: "org_partner_001",
        email: "student@partner.test",
        full_name: "Partner Demo Student",
        roles: ["student"],
      };
    }
    if (userId === "user_employer_001") {
      return {
        user_id: "user_employer_001",
        organization_id: "org_shf_001",
        email: "employer@partner.test",
        full_name: "Partner Organization Member",
        roles: ["partner"],
        permissions: ["program.read"],
      };
    }
    const phase43bUsers: Record<string, any> = {
      user_phase43b_staff_001: { permissions: [], organization_id: "org_shf_001", email: "phase43b-staff@test.invalid" },
      user_phase43b_course_001: { permissions: ["program.course.assign"], organization_id: "org_shf_001", email: "phase43b-course@test.invalid" },
      user_phase43b_manager_001: { permissions: ["project.team.manage"], organization_id: "org_shf_001", email: "phase43b-manager@test.invalid" },
      user_phase43b_project_reviewer_001: { permissions: ["project.submission.review"], organization_id: "org_shf_001", email: "phase43b-project-reviewer@test.invalid" },
      user_phase43b_competency_reviewer_001: { permissions: ["verification.review", "verification.approve"], organization_id: "org_shf_001", email: "phase43b-competency-reviewer@test.invalid" },
      user_phase43b_academic_001: { permissions: ["curriculum.lesson.complete", "program.read", "program.specialization.assign", "program.course.assign", "project.create", "project.team.manage", "project.submission.view", "project.submission.write", "project.submission.review", "verification.view", "verification.review", "verification.approve"], organization_id: "org_shf_001", email: "phase43b-academic@test.invalid" },
    };
    if (phase43bUsers[userId]) return { user_id: userId, ...phase43bUsers[userId], full_name: phase43bUsers[userId].email, roles: ["phase43b_fixture_actor"] };

    const assignmentLearners: Record<string, string> = {
      user_assignment_technical_001: "technical@test.invalid",
      user_assignment_networking_001: "networking@test.invalid",
      user_assignment_electrical_001: "electrical@test.invalid",
      user_assignment_mechanical_001: "mechanical@test.invalid",
      user_assignment_security_001: "security@test.invalid",
      user_assignment_ai_001: "ai@test.invalid",
    };
    if (assignmentLearners[userId]) return {
      user_id: userId,
      organization_id: "org_shf_001",
      email: assignmentLearners[userId],
      full_name: "SHF Assignment Learner",
      roles: ["student"],
    };

    // Phase 4 Career Events/Opportunities tests: dynamically-generated
    // per-run learner personas (org-only, program A/B, cohort A/B). The
    // dev-auth fallback below only recognizes known user ids, so any
    // freshly-created test user needs a matching entry here to
    // authenticate — mirrors the assignmentLearners pattern above.
    const phase4CareerLearnerMatch = userId.match(/^user_phase(?:4ce|4opp|5)_\d+_(org_only|program_a|program_b|cohort_a|cohort_b)$/);
    if (phase4CareerLearnerMatch) {
      return {
        user_id: userId,
        organization_id: "org_shf_001",
        email: `${userId}@test.invalid`,
        full_name: "SHF Phase 4 Learner",
        roles: ["student"],
      };
    }

    // Phase 12.1 External Account Security: dynamically-generated per-run
    // learner personas (a/b, for cross-user IDOR isolation checks).
    const phase121ExternalAccountLearnerMatch = userId.match(/^user_phase121_\d+_(a|b)$/);
    if (phase121ExternalAccountLearnerMatch) {
      return {
        user_id: userId,
        organization_id: "org_shf_001",
        email: `${userId}@test.invalid`,
        full_name: "SHF Phase 12.1 Learner",
        roles: ["student"],
      };
    }

    // Phase 12.2 Native External Calendar Integration: same pattern, its
    // own run prefix (a/b personas, plus admin for the admin-privacy
    // check).
    const phase122ExternalCalendarLearnerMatch = userId.match(/^user_phase122_\d+_(a|b|admin)$/);
    if (phase122ExternalCalendarLearnerMatch) {
      return {
        user_id: userId,
        organization_id: "org_shf_001",
        email: `${userId}@test.invalid`,
        full_name: "SHF Phase 12.2 Learner",
        roles: [phase122ExternalCalendarLearnerMatch[1] === "admin" ? "org_admin" : "student"],
      };
    }

    // Phase 13 Production Hardening: same pattern, its own run prefix.
    const phase13HardeningLearnerMatch = userId.match(/^user_phase13_\d+_(a|b)$/);
    if (phase13HardeningLearnerMatch) {
      return {
        user_id: userId,
        organization_id: "org_shf_001",
        email: `${userId}@test.invalid`,
        full_name: "SHF Phase 13 Learner",
        roles: ["student"],
      };
    }

    // AIEL Phase 3 — same pattern, its own run prefix.
    const aielPhase3LearnerMatch = userId.match(/^user_aielp3_\d+_(a|b)$/);
    if (aielPhase3LearnerMatch) {
      return {
        user_id: userId,
        organization_id: "org_shf_001",
        email: `${userId}@test.invalid`,
        full_name: "AIEL Phase 3 Learner",
        roles: ["student"],
      };
    }

    // SHF Lesson + Assignment + Curriculum Ingestion Phase 2 — Curriculum
    // Catalog: dynamically-generated per-run personas (admin = org_admin
    // author/approver/publisher, student = no catalog permissions, for
    // cross-role and cross-org isolation checks).
    const curriculumCatalogPhase2Match = userId.match(/^user_ccp2_\d+_(admin_a|admin_b|student)$/);
    if (curriculumCatalogPhase2Match) {
      const persona = curriculumCatalogPhase2Match[1];
      const organizationId = persona === "admin_b" ? "org_partner_001" : "org_shf_001";
      return {
        user_id: userId,
        organization_id: organizationId,
        email: `${userId}@test.invalid`,
        full_name: "Curriculum Catalog Phase 2 Test User",
        roles: [persona === "student" ? "student" : "org_admin"],
      };
    }

    // SHF Lesson + Assignment + Curriculum Phase 4.5A — Curriculum Import
    // Job foundation: same admin_a/admin_b/student cross-org isolation
    // shape as Phase 2's user_ccp2_* fixtures above, its own run prefix.
    const curriculumImportPhase45AMatch = userId.match(/^user_ci45a_\d+_(admin_a|admin_b|student)$/);
    if (curriculumImportPhase45AMatch) {
      const persona = curriculumImportPhase45AMatch[1];
      const organizationId = persona === "admin_b" ? "org_partner_001" : "org_shf_001";
      return {
        user_id: userId,
        organization_id: organizationId,
        email: `${userId}@test.invalid`,
        full_name: "Curriculum Import Phase 4.5A Test User",
        roles: [persona === "student" ? "student" : "org_admin"],
      };
    }

    // SHF Lesson + Assignment + Curriculum Phase 4.6 — Raw Document
    // Extraction: same admin_a/admin_b/student cross-org isolation shape
    // as every prior phase's own fixtures, its own run prefix.
    const curriculumImportPhase46Match = userId.match(/^user_ci46_\d+_(admin_a|admin_b|student)$/);
    if (curriculumImportPhase46Match) {
      const persona = curriculumImportPhase46Match[1];
      const organizationId = persona === "admin_b" ? "org_partner_001" : "org_shf_001";
      // shf_admin/partner_org_admin, not org_admin: this phase needs
      // BOTH curriculum.source.upload/view (Phase 1) AND
      // curriculum.catalog.manage (Phase 2+) on the same actor — org_admin
      // only ever held the catalog half.
      const role = persona === "student" ? "student" : persona === "admin_b" ? "partner_org_admin" : "shf_admin";
      return {
        user_id: userId,
        organization_id: organizationId,
        email: `${userId}@test.invalid`,
        full_name: "Curriculum Import Phase 4.6 Test User",
        roles: [role],
      };
    }

    const serviceEntitlementPhase3Match = userId.match(/^user_shfp3_\d+_(shf_admin|org_admin|student|partner_admin|partner_student)$/);
    if (serviceEntitlementPhase3Match) {
      const persona = serviceEntitlementPhase3Match[1];
      const organizationId = persona.startsWith("partner") ? "org_partner_001" : "org_shf_001";
      const role = persona === "student" || persona === "partner_student"
        ? "student"
        : persona === "shf_admin"
          ? "shf_admin"
          : "org_admin";
      return {
        user_id: userId,
        organization_id: organizationId,
        email: `${userId}@test.invalid`,
        full_name: "SHF Phase 3 Service Entitlement Test User",
        roles: [role],
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
