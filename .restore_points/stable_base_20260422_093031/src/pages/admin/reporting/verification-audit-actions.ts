export type VerificationAuditActionKind =
  | "approve_verification"
  | "flag_for_review"
  | "generate_audit_pack"
  | "open_source_object";

export interface VerificationAuditActionInput {
  actionKind: VerificationAuditActionKind;
  targetId: string;
  requestedBy?: string;
}

export interface VerificationAuditActionResult {
  actionKind: VerificationAuditActionKind;
  targetId: string;
  status: "completed";
  createdAt: string;
  requestedBy: string;
  message: string;
}

export function runVerificationAuditAction(
  input: VerificationAuditActionInput
): VerificationAuditActionResult {
  const actor = input.requestedBy || "user_admin_001";
  const ts = new Date().toISOString();

  const messageMap: Record<VerificationAuditActionKind, string> = {
    approve_verification: `Verification approved for ${input.targetId}.`,
    flag_for_review: `Record flagged for review: ${input.targetId}.`,
    generate_audit_pack: `Audit pack generation started for ${input.targetId}.`,
    open_source_object: `Source object opened for ${input.targetId}.`,
  };

  return {
    actionKind: input.actionKind,
    targetId: input.targetId,
    status: "completed",
    createdAt: ts,
    requestedBy: actor,
    message: messageMap[input.actionKind],
  };
}
