import { createHash } from "node:crypto";

export const COMPLETION_DEFINITION_AUTHORITY_VERSION = "program-completion-definition-authority-v1";

export const COMPLETION_REQUIREMENT_TYPES = [
  "LESSON_COMPLETION",
  "COMPETENCY_DEMONSTRATED",
] as const;

export type CompletionRequirementType = (typeof COMPLETION_REQUIREMENT_TYPES)[number];
export type CompletionDefinitionStatus = "DRAFT" | "ACTIVE" | "RETIRED";
export type CompletionMode = "ALL_OF" | "ONE_OF";

export type ProgramCompletionRequirementDefinition = {
  requirementId: string;
  type: CompletionRequirementType;
  canonicalReference: string;
  label: string;
  required?: boolean;
  group?: CompletionMode;
  minimumCount?: number;
  metadata?: { curriculumId?: string };
};

export type ProgramCompletionDefinition = {
  definitionId: string;
  canonicalProgramReference: string;
  organizationId: string;
  tenantId: string;
  version: string;
  status: CompletionDefinitionStatus;
  completionMode: CompletionMode;
  requirements: ProgramCompletionRequirementDefinition[];
  authorityReference: string;
  definitionHash: string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  createdByUserId?: string | null;
};

const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const UNSAFE_KEYS = new Set(["sql", "formula", "expression", "code", "evaluator", "evaluatorKey", "query", "html", "css", "javascript"]);

function rejectUntrustedKeys(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (UNSAFE_KEYS.has(key)) throw new Error("completion_definition_untrusted_configuration");
    rejectUntrustedKeys(child);
  }
}

export function validateDefinitionInput(input: any): Omit<ProgramCompletionDefinition, "definitionId" | "organizationId" | "tenantId" | "definitionHash"> {
  rejectUntrustedKeys(input);
  const version = String(input?.version || "").trim();
  const authorityReference = String(input?.authorityReference || "").trim();
  const completionMode = String(input?.completionMode || "ALL_OF") as CompletionMode;
  if (!SAFE_ID.test(version) || !SAFE_ID.test(authorityReference)) throw new Error("completion_definition_identity_invalid");
  if (!["ALL_OF", "ONE_OF"].includes(completionMode)) throw new Error("completion_definition_mode_invalid");
  const canonicalProgramReference = String(input?.canonicalProgramReference || "").trim();
  if (!SAFE_ID.test(canonicalProgramReference)) throw new Error("completion_definition_program_invalid");
  const rawRequirements = Array.isArray(input?.requirements) ? input.requirements : [];
  if (!rawRequirements.length || rawRequirements.length > 500) throw new Error("completion_definition_requirements_invalid");
  const ids = new Set<string>();
  const requirements = rawRequirements.map((raw: any) => {
    const requirementId = String(raw?.requirementId || "").trim();
    const type = String(raw?.type || "") as CompletionRequirementType;
    const canonicalReference = String(raw?.canonicalReference || "").trim();
    const label = String(raw?.label || "").trim();
    if (!SAFE_ID.test(requirementId) || ids.has(requirementId)) throw new Error("completion_definition_requirement_id_invalid");
    if (!COMPLETION_REQUIREMENT_TYPES.includes(type)) throw new Error("completion_definition_requirement_type_unsupported");
    if (!SAFE_ID.test(canonicalReference) || !label || label.length > 240) throw new Error("completion_definition_requirement_reference_invalid");
    ids.add(requirementId);
    if (raw?.group !== undefined && !["ALL_OF", "ONE_OF"].includes(String(raw.group))) throw new Error("completion_definition_group_invalid");
    const minimumCount = undefined;
    const metadata = raw?.metadata && typeof raw.metadata === "object" ? { curriculumId: raw.metadata.curriculumId ? String(raw.metadata.curriculumId) : undefined } : undefined;
    if (metadata?.curriculumId && !SAFE_ID.test(metadata.curriculumId)) throw new Error("completion_definition_metadata_invalid");
    return { requirementId, type, canonicalReference, label, required: raw?.required !== false, group: raw?.group, minimumCount, metadata };
  });
  return { canonicalProgramReference, version, status: "DRAFT", completionMode, requirements, authorityReference };
}

export function definitionHash(definition: Pick<ProgramCompletionDefinition, "canonicalProgramReference" | "version" | "completionMode" | "requirements" | "authorityReference">): string {
  return createHash("sha256").update(JSON.stringify({
    canonicalProgramReference: definition.canonicalProgramReference,
    version: definition.version,
    completionMode: definition.completionMode,
    requirements: definition.requirements,
    authorityReference: definition.authorityReference,
  }), "utf8").digest("hex");
}

export function definitionFromRow(row: any): ProgramCompletionDefinition {
  return {
    definitionId: row.definition_id,
    canonicalProgramReference: row.canonical_program_reference,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    version: row.version,
    status: row.status,
    completionMode: row.completion_mode,
    requirements: row.requirements_json || [],
    authorityReference: row.authority_reference,
    definitionHash: row.definition_hash,
    effectiveFrom: row.effective_from,
    effectiveUntil: row.effective_until,
    createdByUserId: row.created_by_user_id,
  };
}
