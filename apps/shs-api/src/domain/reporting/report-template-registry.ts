import { reportFamilyForType, isProductKey, type ProductKey } from "./product-report-contract.js";

export const REPORT_FORMATS = Object.freeze({ JSON: "JSON", HTML: "HTML", PDF: "PDF" });

export type ProductReportDefinition = {
  productKey: ProductKey;
  reportFamily: string;
  displayName: string;
  reportType: string;
  templateKey: string;
  templateId: string;
  templateVersion: number;
  supportedFormats: string[];
  rendererIdentifier: string;
  projectionAdapterKey: string;
  brandingKey: string;
  filenamePrefix: string;
  classificationBehavior: Record<string, unknown>;
  publicEligibilityMode: string;
  status: "ACTIVE" | "INACTIVE";
  metadata: Record<string, unknown>;
};

const CIVICSURE = "civicsure" as const;
const CIVICSURE_DEFINITIONS: ProductReportDefinition[] = [
  ["executive-assurance", "EXECUTIVE_ASSURANCE", 1, "civicsure-r1", "Executive Assurance Report"],
  ["executive-assurance", "EXECUTIVE_ASSURANCE", 2, "civicsure-r2", "Executive Assurance Report"],
  ["program-assurance", "PROGRAM_ASSURANCE", 1, "civicsure-r3", "Program Assurance Report"],
  ["provider-assurance", "PROVIDER_ASSURANCE", 1, "civicsure-r3", "Provider Assurance Report"],
  ["funding-lineage", "FUNDING_LINEAGE", 1, "civicsure-r3", "Funding Lineage Report"],
  ["audit-packet", "AUDIT_PACKET", 1, "civicsure-r1", "Audit Packet"],
].map(([reportFamily, reportType, templateVersion, rendererIdentifier, displayName]: [string, string, number, string, string]) => ({
  productKey: CIVICSURE,
  reportFamily,
  displayName,
  reportType,
  templateId: `civicsure-${reportFamily}.v${templateVersion}`,
  templateKey: `civicsure-${reportFamily}`,
  templateVersion,
  supportedFormats: [REPORT_FORMATS.JSON, REPORT_FORMATS.HTML, REPORT_FORMATS.PDF],
  rendererIdentifier,
  projectionAdapterKey: "civicsure-government-assurance",
  brandingKey: "civicsure",
  filenamePrefix: "CivicSure",
  classificationBehavior: { source: "report_artifact", markRenderedOutput: true },
  publicEligibilityMode: "PUBLIC_DISCLOSURE_SEPARATE",
  status: "ACTIVE",
  metadata: { product: "CivicSure", foundation: templateVersion === 2 ? "R2_EXECUTIVE_ASSURANCE" : rendererIdentifier === "civicsure-r3" ? "R3_PROGRAM_PROVIDER_FUNDING" : "R1" },
}));

export const PRODUCT_BRANDS = Object.freeze({
  civicsure: { displayName: "CivicSure", shortName: "CivicSure", brandingKey: "civicsure", filenamePrefix: "CivicSure", headerLabel: "CivicSure" },
  oas: { displayName: "Open Autonomous Standard", shortName: "OAS", brandingKey: "oas", filenamePrefix: "OAS", headerLabel: "OAS" },
  registry: { displayName: "Autonomous Registry", shortName: "Registry", brandingKey: "registry", filenamePrefix: "Registry", headerLabel: "Autonomous Registry" },
  studio: { displayName: "Studio", shortName: "Studio", brandingKey: "studio", filenamePrefix: "Studio", headerLabel: "Studio" },
  bos: { displayName: "Business Operating System", shortName: "BOS", brandingKey: "bos", filenamePrefix: "BOS", headerLabel: "BOS" },
  foundation: { displayName: "Silicon Heartland Foundation", shortName: "Foundation", brandingKey: "foundation", filenamePrefix: "Foundation", headerLabel: "Foundation" },
  solutions: { displayName: "Silicon Heartland Solutions", shortName: "Solutions", brandingKey: "solutions", filenamePrefix: "Solutions", headerLabel: "Solutions" },
  legal: { displayName: "Legal Authority", shortName: "Legal", brandingKey: "legal", filenamePrefix: "Legal", headerLabel: "Legal Authority" },
} satisfies Record<ProductKey, Record<string, string>>);

const PRODUCT_DEFINITIONS: ProductReportDefinition[] = [
  ["studio", "project-report", "STUDIO_PROJECT_REPORT", "Project Report"],
  ["studio", "qa-report", "STUDIO_QA_REPORT", "QA Report"],
  ["studio", "review-report", "STUDIO_REVIEW_REPORT", "Review Report"],
  ["studio", "project-completion", "STUDIO_PROJECT_COMPLETION", "Project Completion Report"],
  ["studio", "build-packet-evidence", "STUDIO_BUILD_PACKET_EVIDENCE", "Build Packet Evidence Report"],
  ["oas", "conformance", "OAS_CONFORMANCE", "OAS Conformance Report"],
  ["oas", "traceability", "OAS_TRACEABILITY", "OAS Traceability Report"],
  ["oas", "testing-evidence", "OAS_TESTING_EVIDENCE", "OAS Testing and Evidence Report"],
].map(([productKey, reportFamily, reportType, displayName]: [ProductKey, string, string, string]) => ({
  productKey,
  reportFamily,
  displayName,
  reportType,
  templateId: `${productKey}-${reportFamily}.v1`,
  templateKey: `${productKey}-${reportFamily}`,
  templateVersion: 1,
  supportedFormats: [REPORT_FORMATS.JSON, REPORT_FORMATS.HTML, REPORT_FORMATS.PDF],
  rendererIdentifier: "shu-universal-r1",
  projectionAdapterKey: `${productKey}-product-reporting`,
  brandingKey: productKey,
  filenamePrefix: PRODUCT_BRANDS[productKey].filenamePrefix,
  classificationBehavior: { source: "report_artifact", markRenderedOutput: true },
  publicEligibilityMode: "PUBLIC_DISCLOSURE_SEPARATE",
  status: "ACTIVE",
  metadata: { product: PRODUCT_BRANDS[productKey].displayName, foundation: "U2_PRODUCT_ADAPTER" },
}));

const FOUNDATION_DEFINITIONS: ProductReportDefinition[] = [
  ["program-impact", "FOUNDATION_PROGRAM_IMPACT", "Program Impact Report", "Foundation"],
  ["grant-funder", "FOUNDATION_GRANT_FUNDER", "Grant / Funder Report", "Foundation"],
  ["cohort-outcome", "FOUNDATION_COHORT_OUTCOME", "Cohort Outcome Report", "Foundation"],
  ["community-impact", "FOUNDATION_COMMUNITY_IMPACT", "Community Impact Report", "Foundation"],
  ["curriculum-student-progress", "CURRICULUM_STUDENT_PROGRESS", "Student Progress Report", "Curriculum"],
  ["curriculum-course-completion", "CURRICULUM_COURSE_COMPLETION", "Course Completion Report", "Curriculum"],
  ["curriculum-assessment-evidence", "CURRICULUM_ASSESSMENT_EVIDENCE", "Assessment & Evidence Report", "Curriculum"],
  ["curriculum-instructor-class", "CURRICULUM_INSTRUCTOR_CLASS", "Instructor / Class Report", "Curriculum"],
  ["curriculum-cohort-learning", "CURRICULUM_COHORT_LEARNING", "Cohort Learning Report", "Curriculum"],
  ["career-readiness", "CAREER_READINESS", "Career Readiness Report", "Career"],
  ["career-skill-profile", "CAREER_SKILL_PROFILE", "Skill Profile Report", "Career"],
  ["career-credential-evidence", "CAREER_CREDENTIAL_EVIDENCE", "Credential Evidence Report", "Career"],
  ["career-pathway-outcome", "CAREER_PATHWAY_OUTCOME", "Career Pathway Outcome Report", "Career"],
  ["career-employer-partner-outcome", "CAREER_EMPLOYER_PARTNER_OUTCOME", "Employer / Partner Outcome Report", "Career"],
].map(([reportFamily, reportType, displayName, prefix]: [string, string, string, string]) => ({
  productKey: "foundation",
  reportFamily,
  displayName,
  reportType,
  templateId: `foundation-${reportFamily}.v1`,
  templateKey: `foundation-${reportFamily}`,
  templateVersion: 1,
  supportedFormats: [REPORT_FORMATS.JSON, REPORT_FORMATS.HTML, REPORT_FORMATS.PDF],
  rendererIdentifier: "shu-universal-r1",
  projectionAdapterKey: "foundation-curriculum-career-reporting",
  brandingKey: "foundation",
  filenamePrefix: prefix,
  classificationBehavior: { source: "report_artifact", markRenderedOutput: true },
  publicEligibilityMode: "PUBLIC_DISCLOSURE_SEPARATE",
  status: "ACTIVE",
  metadata: { product: "Silicon Heartland Foundation", reportDomain: prefix, foundation: "U3_FOUNDATION_CURRICULUM_CAREER" },
}));

const BOS_DEFINITIONS: ProductReportDefinition[] = [
  ["operating-review", "BOS_OPERATING_REVIEW", "Operating Review"],
  ["workflow-performance", "BOS_WORKFLOW_PERFORMANCE", "Workflow / Operational Performance Report"],
  ["governance-control", "BOS_GOVERNANCE_CONTROL", "Governance Control Report"],
  ["release-assurance-evidence", "BOS_RELEASE_ASSURANCE_EVIDENCE", "Release Assurance Evidence Report"],
  ["control-exception", "BOS_CONTROL_EXCEPTION", "Control Exception Report"],
  ["agent-session", "BOS_AGENT_SESSION", "Agent Session Report"],
  ["policy-enforcement", "BOS_POLICY_ENFORCEMENT", "Policy Enforcement Report"],
  ["mcp-tool-access", "BOS_MCP_TOOL_ACCESS", "MCP / Tool Access Report"],
  ["ai-security-event", "BOS_AI_SECURITY_EVENT", "AI Security Event Report"],
  ["governed-ai-activity", "BOS_GOVERNED_AI_ACTIVITY", "Governed AI Activity Report"],
].map(([reportFamily, reportType, displayName]: [string, string, string]) => ({
  productKey: "bos",
  reportFamily,
  displayName,
  reportType,
  templateId: `bos-${reportFamily}.v1`,
  templateKey: `bos-${reportFamily}`,
  templateVersion: 1,
  supportedFormats: [REPORT_FORMATS.JSON, REPORT_FORMATS.HTML, REPORT_FORMATS.PDF],
  rendererIdentifier: "shu-universal-r1",
  projectionAdapterKey: "bos-ai-governance-reporting",
  brandingKey: "bos",
  filenamePrefix: "BOS",
  classificationBehavior: { source: "report_artifact", markRenderedOutput: true, conservativeDefault: "INTERNAL" },
  publicEligibilityMode: "PUBLIC_DISCLOSURE_SEPARATE",
  status: "ACTIVE",
  metadata: { product: "Business Operating System", foundation: "U4_BOS_AI_GOVERNANCE" },
}));

const U5_DEFINITIONS: ProductReportDefinition[] = [
  ["registry", "registry-record", "REGISTRY_RECORD", "Registry Record Report"],
  ["registry", "registration-summary", "REGISTRATION_SUMMARY", "Registration Summary Report"],
  ["solutions", "client-operating", "SOLUTIONS_CLIENT_OPERATING", "Client Operating Report"],
  ["solutions", "service-delivery", "SOLUTIONS_SERVICE_DELIVERY", "Service Delivery Report"],
  ["solutions", "implementation", "SOLUTIONS_IMPLEMENTATION", "Implementation Report"],
  ["solutions", "executive-business-review", "SOLUTIONS_EXECUTIVE_BUSINESS_REVIEW", "Executive Business Review"],
  ["solutions", "assurance-control", "SOLUTIONS_ASSURANCE_CONTROL", "Assurance / Control Report"],
].map(([productKey, reportFamily, reportType, displayName]: [ProductKey, string, string, string]) => ({
  productKey,
  reportFamily,
  displayName,
  reportType,
  templateId: `${productKey}-${reportFamily}.v1`,
  templateKey: `${productKey}-${reportFamily}`,
  templateVersion: 1,
  supportedFormats: [REPORT_FORMATS.JSON, REPORT_FORMATS.HTML, REPORT_FORMATS.PDF],
  rendererIdentifier: "shu-universal-r1",
  projectionAdapterKey: `${productKey}-reporting`,
  brandingKey: productKey,
  filenamePrefix: PRODUCT_BRANDS[productKey].filenamePrefix,
  classificationBehavior: { source: "report_artifact", markRenderedOutput: true, conservativeDefault: "INTERNAL" },
  publicEligibilityMode: "PUBLIC_DISCLOSURE_SEPARATE",
  status: "ACTIVE",
  metadata: { product: PRODUCT_BRANDS[productKey].displayName, foundation: "U5_REGISTRY_SOLUTIONS" },
}));

const LEGAL_DEFINITIONS: ProductReportDefinition[] = [
  ["legal-artifact-summary", "LEGAL_ARTIFACT_SUMMARY", "Legal Artifact Summary"],
  ["legal-authority-obligation", "LEGAL_AUTHORITY_OBLIGATION", "Legal Authority / Obligation Report"],
  ["legal-readiness", "LEGAL_READINESS", "Legal Readiness Report"],
  ["legal-evidence-decision-trace", "LEGAL_EVIDENCE_DECISION_TRACE", "Legal Evidence / Decision Trace Report"],
].map(([reportFamily, reportType, displayName]: [string, string, string]) => ({
  productKey: "legal", reportFamily, displayName, reportType,
  templateId: `legal-${reportFamily}.v1`, templateKey: `legal-${reportFamily}`, templateVersion: 1,
  supportedFormats: [REPORT_FORMATS.JSON, REPORT_FORMATS.HTML, REPORT_FORMATS.PDF], rendererIdentifier: "shu-universal-r1",
  projectionAdapterKey: "legal-reporting", brandingKey: "legal", filenamePrefix: "Legal",
  classificationBehavior: { source: "report_artifact", markRenderedOutput: true, conservativeDefault: "INTERNAL" },
  publicEligibilityMode: "PUBLIC_DISCLOSURE_SEPARATE", status: "ACTIVE",
  metadata: { product: "Legal Authority", foundation: "POST_LOCK_LEGAL_RUNTIME" },
}));

const DEFINITIONS: ProductReportDefinition[] = [...CIVICSURE_DEFINITIONS, ...PRODUCT_DEFINITIONS, ...FOUNDATION_DEFINITIONS, ...BOS_DEFINITIONS, ...U5_DEFINITIONS, ...LEGAL_DEFINITIONS];

export class ReportTemplateRegistry {
  constructor(private repo: any = null) {}

  definitions() { return DEFINITIONS.map((definition) => ({ ...definition, supportedFormats: [...definition.supportedFormats] })); }

  resolve(productKey: string, reportFamily: string, version = 1) {
    if (!isProductKey(productKey)) throw new Error("REPORT_PRODUCT_KEY_INVALID");
    const definition = DEFINITIONS.find((item) => item.productKey === productKey && item.reportFamily === reportFamily && item.templateVersion === Number(version) && item.status === "ACTIVE");
    if (!definition) throw new Error("REPORT_TEMPLATE_NOT_FOUND");
    return { ...definition, supportedFormats: [...definition.supportedFormats] };
  }

  get(reportType: string, version = 1) {
    const reportFamily = reportFamilyForType(reportType);
    if (!reportFamily) throw new Error("REPORT_TEMPLATE_NOT_FOUND");
    return this.resolve(CIVICSURE, reportFamily, version);
  }

  async ensurePersisted(executor: any) {
    if (!executor?.query) return this.definitions();
    for (const definition of DEFINITIONS) {
      await executor.query(
        `INSERT INTO report_templates
          (template_id, template_key, report_type, template_version, supported_formats, renderer_identifier, classification_behavior, status, metadata, product_key, report_family)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7::jsonb,$8,$9::jsonb,$10,$11)
         ON CONFLICT (template_key, template_version) DO UPDATE SET
           template_id=EXCLUDED.template_id,
           report_type=EXCLUDED.report_type,
           supported_formats=EXCLUDED.supported_formats,
           renderer_identifier=EXCLUDED.renderer_identifier,
           classification_behavior=EXCLUDED.classification_behavior,
           status=EXCLUDED.status,
           metadata=EXCLUDED.metadata,
           product_key=EXCLUDED.product_key,
           report_family=EXCLUDED.report_family`,
        [definition.templateId, definition.templateKey, definition.reportType, definition.templateVersion,
          JSON.stringify(definition.supportedFormats), definition.rendererIdentifier,
          JSON.stringify(definition.classificationBehavior), definition.status, JSON.stringify(definition.metadata),
          definition.productKey, definition.reportFamily],
      );
    }
    return this.definitions();
  }
}
