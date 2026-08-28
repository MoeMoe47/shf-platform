export const PROGRAM_CLASSIFICATIONS = {
  SHF_OWNED: "SHF_OWNED",
  SHF_INCUBATED: "SHF_INCUBATED",
  INDEPENDENT_NETWORK: "INDEPENDENT_NETWORK",
} as const;

export type ProgramClassification =
  typeof PROGRAM_CLASSIFICATIONS[keyof typeof PROGRAM_CLASSIFICATIONS];

const PROGRAM_CLASSIFICATION_VALUES = new Set(Object.values(PROGRAM_CLASSIFICATIONS));

export function isKnownProgramClassification(value: string): value is ProgramClassification {
  return PROGRAM_CLASSIFICATION_VALUES.has(value as ProgramClassification);
}

export type ProgramStewardship = {
  program_classification: ProgramClassification;
  owner_organization_id: string;
  operator_organization_id: string;
  accountable_organization_id: string;
};

export function normalizeProgramStewardship(input: any, fallbackOrganizationId: string): ProgramStewardship {
  const classification = String(input?.program_classification || PROGRAM_CLASSIFICATIONS.SHF_OWNED).trim();
  if (!isKnownProgramClassification(classification)) throw new Error("unknown_program_classification");
  const owner = String(input?.owner_organization_id || fallbackOrganizationId || "").trim();
  const operator = String(input?.operator_organization_id || owner || "").trim();
  const accountable = String(input?.accountable_organization_id || owner || "").trim();
  if (!owner || !operator || !accountable) throw new Error("program_stewardship_scope_missing");
  return {
    program_classification: classification,
    owner_organization_id: owner,
    operator_organization_id: operator,
    accountable_organization_id: accountable,
  };
}
