import type { AuthorizedReportProjection, ProductKey } from "./product-report-contract.js";

export const REGISTERED_SECTION_IDS = Object.freeze([
  "overview", "participation", "learning-progress", "assessments", "credentials", "projects",
  "career-outcomes", "employer-engagement", "funding", "community-impact", "QA", "review",
  "assurance", "controls", "exceptions", "evidence", "methodology", "disclosures", "appendix",
] as const);

export type ProgramReportProfile = {
  profileKey: string;
  productKey: ProductKey;
  canonicalProgramReferences: string[];
  canonicalProjectTypes?: string[];
  displayName: string;
  allowedReportFamilies: string[];
  terminology: Record<string, string>;
  sectionPolicy: { required: string[]; optional: string[]; ordered: string[]; labels: Record<string, string>; rowKeywords: Record<string, string[]> };
  metricPolicy: { allowedMetricKeys: string[] };
  evidencePolicy: { allowedEvidenceTypes: string[]; requiredEvidenceTypes?: string[] };
  audienceProfiles: string[];
  brandingKey: string;
  methodologyKey: string;
  disclosureKeys: string[];
  filenamePrefix: string;
  publicationEligibility: string;
  status: "ACTIVE" | "INACTIVE";
  version: string;
};

const DATA_CENTER_PROFILE: ProgramReportProfile = {
  profileKey: "foundation.data-center-ai-infrastructure-pathway",
  productKey: "foundation",
  canonicalProgramReferences: ["data-center-specialization-11", "data-center-specialization-12"],
  displayName: "Silicon Heartland Data Center & AI Infrastructure Pathway",
  allowedReportFamilies: ["curriculum-student-progress", "career-readiness", "career-pathway-outcome", "program-impact"],
  terminology: { participant: "learner", program: "pathway", completion: "pathway completion", outcome: "verified workforce outcome" },
  sectionPolicy: {
    required: ["overview", "learning-progress", "evidence"], optional: ["projects", "credentials", "career-outcomes", "employer-engagement", "methodology", "disclosures"],
    ordered: ["overview", "learning-progress", "projects", "credentials", "career-outcomes", "employer-engagement", "evidence", "methodology", "disclosures"],
    labels: { overview: "Pathway Overview", "learning-progress": "Pathway Progress", projects: "Technical Projects", credentials: "Credentials", "career-outcomes": "Career Outcomes", "employer-engagement": "Employer Exposure", evidence: "Evidence Index", methodology: "Pathway Methodology", disclosures: "Pathway Disclosures" },
    rowKeywords: { "learning-progress": ["lesson", "course", "progress"], credentials: ["credential"], "career-outcomes": ["outcome", "readiness"], projects: ["project"], "employer-engagement": ["partner", "employer", "interview", "site"], evidence: ["evidence", "verified", "skill"] },
  },
  metricPolicy: { allowedMetricKeys: ["curriculum.learning_progress", "career.workforce_outcomes.verified"] },
  evidencePolicy: { allowedEvidenceTypes: ["assignment_completion", "assessment", "project", "portfolio", "credential", "career_outcome", "work_based_learning", "verified_event"] },
  audienceProfiles: ["learner", "instructor", "program_admin", "funder", "executive"], brandingKey: "foundation-data-center", methodologyKey: "data-center-pathway", disclosureKeys: ["verification-status", "employment-outcome-limitation"], filenamePrefix: "DataCenterAI", publicationEligibility: "PUBLIC_DISCLOSURE_SEPARATE", status: "ACTIVE", version: "1.0",
};

const SUMMER_STEM_PROFILE: ProgramReportProfile = {
  profileKey: "foundation.summer-stem-community",
  productKey: "foundation",
  canonicalProgramReferences: ["program_seed_001"],
  displayName: "Summer STEM Camp",
  allowedReportFamilies: ["program-impact", "community-impact", "cohort-outcome"],
  terminology: { participant: "participant", program: "community initiative", completion: "camp completion", outcome: "verified community outcome" },
  sectionPolicy: {
    required: ["overview", "participation", "community-impact", "evidence"], optional: ["projects", "methodology", "disclosures"],
    ordered: ["overview", "participation", "community-impact", "projects", "evidence", "methodology", "disclosures"],
    labels: { overview: "Community Program Overview", participation: "Participation and Reach", "community-impact": "Community Impact", projects: "Community Projects", evidence: "Evidence Index", methodology: "Impact Methodology", disclosures: "Community Disclosures" },
    rowKeywords: { participation: ["participant", "learner"], "community-impact": ["verified", "completed", "outcome"], projects: ["project"], evidence: ["evidence", "verified"] },
  },
  metricPolicy: { allowedMetricKeys: ["curriculum.learning_progress", "community.participation.verified"] },
  evidencePolicy: { allowedEvidenceTypes: ["assignment_completion", "project", "verified_event", "community_project"] },
  audienceProfiles: ["program_admin", "funder", "executive", "public"], brandingKey: "foundation-community", methodologyKey: "summer-stem-community", disclosureKeys: ["preliminary-data", "public-data-limitation"], filenamePrefix: "SummerSTEM", publicationEligibility: "PUBLIC_DISCLOSURE_SEPARATE", status: "ACTIVE", version: "1.0",
};

const STUDIO_AGENT_PROFILE: ProgramReportProfile = {
  profileKey: "studio.ai-agent-project",
  productKey: "studio",
  canonicalProgramReferences: [], canonicalProjectTypes: ["AI_AGENT"], displayName: "Studio AI Agent Project",
  allowedReportFamilies: ["project-report", "qa-report", "review-report", "project-completion", "build-packet-evidence"],
  terminology: { participant: "builder", program: "project", completion: "delivery completion", outcome: "accepted delivery evidence" },
  sectionPolicy: {
    required: ["overview", "projects", "QA", "review", "evidence"], optional: ["assurance", "methodology", "disclosures"],
    ordered: ["overview", "projects", "QA", "review", "assurance", "evidence", "methodology", "disclosures"],
    labels: { overview: "AI Agent Project Overview", projects: "Build Packet and Workspace", QA: "Quality Assurance", review: "Human Review", assurance: "Delivery Assurance", evidence: "Build Evidence", methodology: "Studio Methodology", disclosures: "Studio Disclosures" },
    rowKeywords: { projects: ["project", "workspace", "revision", "build"], QA: ["qa", "quality"], review: ["review", "decision"], assurance: ["assurance", "completion"], evidence: ["evidence", "packet"] },
  },
  metricPolicy: { allowedMetricKeys: ["studio.qa.status", "studio.review.status", "studio.delivery.status"] },
  evidencePolicy: { allowedEvidenceTypes: ["QA", "review", "project", "release_assurance_evidence"] },
  audienceProfiles: ["learner", "instructor", "program_admin", "executive"], brandingKey: "studio", methodologyKey: "studio-ai-agent", disclosureKeys: ["verification-status"], filenamePrefix: "StudioAIAgent", publicationEligibility: "PUBLIC_DISCLOSURE_SEPARATE", status: "ACTIVE", version: "1.0",
};

const DEFINITIONS = Object.freeze([DATA_CENTER_PROFILE, SUMMER_STEM_PROFILE, STUDIO_AGENT_PROFILE]);

function validateProfile(profile: ProgramReportProfile) {
  if (!profile.profileKey || !profile.productKey || !profile.version || profile.status !== "ACTIVE") throw new Error("REPORT_PROFILE_INVALID");
  for (const family of profile.allowedReportFamilies) if (!family || !profile.sectionPolicy.ordered.length) throw new Error("REPORT_PROFILE_INVALID");
  const known = new Set(REGISTERED_SECTION_IDS);
  for (const section of [...profile.sectionPolicy.required, ...profile.sectionPolicy.optional, ...profile.sectionPolicy.ordered]) if (!known.has(section as any)) throw new Error("REPORT_PROFILE_SECTION_INVALID");
  for (const section of profile.sectionPolicy.required) if (!profile.sectionPolicy.ordered.includes(section)) throw new Error("REPORT_PROFILE_REQUIRED_SECTION_INVALID");
  return profile;
}

export class ProgramReportProfileRegistry {
  definitions() { return DEFINITIONS.map((profile) => structuredClone(profile)); }

  private assertTrustedInputs(input: any) {
    const forbidden = [
      "sections", "customSections", "custom_sections", "metrics", "metricKeys", "metric_keys", "metricFormula", "metric_formula",
      "evidenceTypes", "evidence_types", "evidenceReferences", "evidence_references", "html", "css", "styles",
      "rendererKey", "renderer_key", "templateKey", "template_key", "publicationState", "publication_state",
    ];
    if (forbidden.some((key) => input?.[key] !== undefined)) throw new Error("REPORT_PROFILE_UNTRUSTED_CONFIGURATION");
  }

  resolve(profileKey: string, productKey: string, reportFamily: string, version?: string) {
    const profile = DEFINITIONS.find((item) => item.profileKey === profileKey);
    if (!profile || profile.productKey !== productKey || profile.status !== "ACTIVE" || (version && profile.version !== version)) throw new Error("REPORT_PROFILE_NOT_FOUND");
    if (!profile.allowedReportFamilies.includes(reportFamily)) throw new Error("REPORT_PROFILE_FAMILY_NOT_ALLOWED");
    return validateProfile(profile);
  }

  resolveForRequest(productKey: string, reportFamily: string, input: any, projection: AuthorizedReportProjection) {
    this.assertTrustedInputs(input);
    const explicit = String(input?.programProfileKey || input?.program_profile_key || "").trim();
    const version = String(input?.programProfileVersion || input?.program_profile_version || "").trim() || undefined;
    if (explicit) return this.resolve(explicit, productKey, reportFamily, version);
    const subjectValues = new Set([String(input?.programId || input?.program_id || "").trim(), String(input?.canonicalProgramReference || input?.canonical_program_reference || "").trim(), String(projection.subject || "").trim()].filter(Boolean));
    const projectType = String(input?.projectType || input?.project_type || "").trim();
    const matches = DEFINITIONS.filter((profile) => profile.productKey === productKey && profile.status === "ACTIVE" && profile.allowedReportFamilies.includes(reportFamily) && ((profile.canonicalProgramReferences.some((reference) => subjectValues.has(reference))) || (projectType && profile.canonicalProjectTypes?.includes(projectType))));
    if (matches.length > 1) throw new Error("REPORT_PROFILE_AMBIGUOUS");
    return matches[0] ? validateProfile(matches[0]) : null;
  }
}

function rowMatches(row: any[], keywords: string[]) {
  const value = String(row?.[0] || "").toLowerCase();
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

export function applyProgramReportProfile(projection: AuthorizedReportProjection, profile: ProgramReportProfile): AuthorizedReportProjection {
  const payload: any = projection.payload;
  const presentation = payload.presentation || {};
  const baseRows = (presentation.sections || []).flatMap((section: any) => (section.tables || []).flatMap((table: any) => table.rows || []));
  const sections = profile.sectionPolicy.ordered.map((sectionId) => {
    const keywords = profile.sectionPolicy.rowKeywords[sectionId] || [];
    const rows = sectionId === "overview" ? baseRows : baseRows.filter((row: any[]) => rowMatches(row, keywords));
    const required = profile.sectionPolicy.required.includes(sectionId);
    if (!rows.length && !required && !["methodology", "disclosures"].includes(sectionId)) return null;
    return { title: profile.sectionPolicy.labels[sectionId] || sectionId, tables: rows.length ? [{ headers: ["Measure", "Value", "Authority"], rows }] : [], notes: rows.length ? [] : ["No canonical records were available for this registered section."] };
  }).filter(Boolean);
  const transformed = {
    ...presentation,
    brand: { ...(presentation.brand || {}), brandingKey: profile.brandingKey, displayName: profile.displayName },
    reportTitle: `${profile.displayName} — ${presentation.reportTitle || "Report"}`,
    terminology: profile.terminology,
    sections,
    methodology: { ...(presentation.methodology || {}), profile: profile.methodologyKey, metricPolicy: profile.metricPolicy.allowedMetricKeys, evidencePolicy: profile.evidencePolicy.allowedEvidenceTypes },
    disclosures: profile.disclosureKeys,
    profileKey: profile.profileKey,
    profileVersion: profile.version,
  };
  return {
    ...projection,
    payload: {
      ...payload,
      presentation: transformed,
      programProfile: {
        profileKey: profile.profileKey,
        profileVersion: profile.version,
        canonicalProgramReferences: profile.canonicalProgramReferences,
        brandingKey: profile.brandingKey,
        filenamePrefix: profile.filenamePrefix,
        allowedReportFamilies: profile.allowedReportFamilies,
      },
    },
  };
}

export const programReportProfileRegistry = new ProgramReportProfileRegistry();
