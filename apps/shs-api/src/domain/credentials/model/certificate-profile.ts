import type { ProductKey } from "../../reporting/product-report-contract.js";

export const CERTIFICATE_TYPES = Object.freeze([
  "COURSE_COMPLETION",
  "PROGRAM_COMPLETION",
  "ACHIEVEMENT_MILESTONE",
  "VERIFIED_SKILL",
] as const);
export type CertificateType = typeof CERTIFICATE_TYPES[number];

export type ProgramCertificateProfile = {
  profileKey: string;
  version: string;
  productKey: ProductKey;
  canonicalProgramReference: string;
  canonicalReferenceMode: "PROGRAM" | "COURSE_INPUT";
  certificateType: CertificateType;
  displayName: string;
  certificateTitle: string;
  issuerReference: string;
  eligibilityRuleKey: string;
  brandingKey: string;
  templateKey: string;
  templateVersion: string;
  signatoryRoleKeys: string[];
  accomplishmentTextKey: string;
  displayedCompetencyKeys: string[];
  verificationMode: "PUBLIC_MINIMAL";
  qrMode: "VERIFICATION_REFERENCE";
  filenamePrefix: string;
  emailTemplateKey: string;
  expirationPolicy: "NONE";
  replacementPolicy: "SUCCESSOR_RECORD";
  revocationPolicy: "CANONICAL_CREDENTIAL_AUTHORITY";
  status: "ACTIVE" | "INACTIVE";
};

export const PROGRAM_CERTIFICATE_PROFILES: readonly ProgramCertificateProfile[] = Object.freeze([
  {
    profileKey: "foundation.course-completion",
    version: "1.0",
    productKey: "foundation",
    canonicalProgramReference: "curriculum-course",
    canonicalReferenceMode: "COURSE_INPUT",
    certificateType: "COURSE_COMPLETION",
    displayName: "Course Completion Certificate",
    certificateTitle: "Course Completion Certificate",
    issuerReference: "silicon-heartland-foundation",
    eligibilityRuleKey: "curriculum.course_completion.v1",
    brandingKey: "foundation-course",
    templateKey: "foundation-course-certificate",
    templateVersion: "1.0",
    signatoryRoleKeys: ["program-director"],
    accomplishmentTextKey: "course-completion",
    displayedCompetencyKeys: [],
    verificationMode: "PUBLIC_MINIMAL",
    qrMode: "VERIFICATION_REFERENCE",
    filenamePrefix: "FoundationCourse",
    emailTemplateKey: "foundation-certificate-issued",
    expirationPolicy: "NONE",
    replacementPolicy: "SUCCESSOR_RECORD",
    revocationPolicy: "CANONICAL_CREDENTIAL_AUTHORITY",
    status: "ACTIVE",
  },
  {
    profileKey: "foundation.data-center-ai-infrastructure-pathway",
    version: "1.0",
    productKey: "foundation",
    canonicalProgramReference: "data-center-specialization-11",
    canonicalReferenceMode: "PROGRAM",
    certificateType: "PROGRAM_COMPLETION",
    displayName: "Data Center & AI Infrastructure Pathway Certificate",
    certificateTitle: "Data Center & AI Infrastructure Pathway Completion",
    issuerReference: "silicon-heartland-foundation",
    eligibilityRuleKey: "foundation.program_completion.v1",
    brandingKey: "foundation-data-center",
    templateKey: "foundation-data-center-pathway-certificate",
    templateVersion: "1.0",
    signatoryRoleKeys: ["program-director", "pathway-director"],
    accomplishmentTextKey: "data-center-pathway-completion",
    displayedCompetencyKeys: ["technical-infrastructure", "evidence-based-practice"],
    verificationMode: "PUBLIC_MINIMAL",
    qrMode: "VERIFICATION_REFERENCE",
    filenamePrefix: "DataCenterAI",
    emailTemplateKey: "foundation-certificate-issued",
    expirationPolicy: "NONE",
    replacementPolicy: "SUCCESSOR_RECORD",
    revocationPolicy: "CANONICAL_CREDENTIAL_AUTHORITY",
    status: "ACTIVE",
  },
  {
    profileKey: "foundation.summer-stem-community",
    version: "1.0",
    productKey: "foundation",
    canonicalProgramReference: "program_seed_001",
    canonicalReferenceMode: "PROGRAM",
    certificateType: "PROGRAM_COMPLETION",
    displayName: "Summer STEM Camp Certificate",
    certificateTitle: "Summer STEM Camp Completion",
    issuerReference: "silicon-heartland-foundation",
    eligibilityRuleKey: "foundation.program_completion.v1",
    brandingKey: "foundation-community",
    templateKey: "foundation-community-certificate",
    templateVersion: "1.0",
    signatoryRoleKeys: ["program-director"],
    accomplishmentTextKey: "summer-stem-completion",
    displayedCompetencyKeys: ["community-learning"],
    verificationMode: "PUBLIC_MINIMAL",
    qrMode: "VERIFICATION_REFERENCE",
    filenamePrefix: "SummerSTEM",
    emailTemplateKey: "foundation-certificate-issued",
    expirationPolicy: "NONE",
    replacementPolicy: "SUCCESSOR_RECORD",
    revocationPolicy: "CANONICAL_CREDENTIAL_AUTHORITY",
    status: "ACTIVE",
  },
] as const);

export class ProgramCertificateProfileRegistry {
  definitions() { return PROGRAM_CERTIFICATE_PROFILES.map((profile) => structuredClone(profile)); }

  resolve(profileKey: string, canonicalProgramReference: string, certificateType: string, version?: string) {
    const profile = PROGRAM_CERTIFICATE_PROFILES.find((candidate) => candidate.profileKey === profileKey);
    if (!profile || profile.status !== "ACTIVE" || profile.certificateType !== certificateType || (version && profile.version !== version)) {
      throw new Error("CERTIFICATE_PROFILE_NOT_FOUND");
    }
    if (profile.canonicalReferenceMode === "PROGRAM" && profile.canonicalProgramReference !== canonicalProgramReference) throw new Error("CERTIFICATE_PROFILE_PROGRAM_MISMATCH");
    if (profile.canonicalReferenceMode === "COURSE_INPUT" && !canonicalProgramReference) throw new Error("CERTIFICATE_PROFILE_PROGRAM_REQUIRED");
    return structuredClone(profile);
  }

  resolveForRequest(input: any) {
    const profileKey = String(input?.profileKey || input?.profile_key || "").trim();
    const canonicalProgramReference = String(input?.canonicalProgramReference || input?.canonical_program_reference || "").trim();
    const certificateType = String(input?.certificateType || input?.certificate_type || "").trim();
    const version = String(input?.profileVersion || input?.profile_version || "").trim() || undefined;
    if (!profileKey || !canonicalProgramReference || !certificateType) throw new Error("CERTIFICATE_PROFILE_REQUIRED");
    if (!version) throw new Error("CERTIFICATE_PROFILE_VERSION_REQUIRED");
    const profile = this.resolve(profileKey, canonicalProgramReference, certificateType, version);
    const requestedProduct = String(input?.productKey || input?.product_key || "").trim();
    if (requestedProduct && requestedProduct !== profile.productKey) throw new Error("CERTIFICATE_PROFILE_PRODUCT_MISMATCH");
    return profile;
  }

  assertTrustedInput(input: any) {
    const forbidden = [
      "certificateTitle", "certificate_title", "issuerReference", "issuer_reference", "signatoryRoleKeys", "signatory_role_keys",
      "eligibilityRuleKey", "eligibility_rule_key", "html", "css", "rendererKey", "renderer_key", "verificationUrl",
      "verification_url", "qrTarget", "qr_target", "displayedCompetencyKeys", "displayed_competency_keys", "issuedAt",
      "issued_at", "expiresAt", "expires_at", "status",
    ];
    if (forbidden.some((key) => input?.[key] !== undefined)) throw new Error("CERTIFICATE_PROFILE_UNTRUSTED_CONFIGURATION");
  }
}

export const programCertificateProfileRegistry = new ProgramCertificateProfileRegistry();
