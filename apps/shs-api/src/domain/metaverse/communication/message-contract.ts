import { isSafeInternalPath } from "../../notifications/contracts/safe-links.js";

export const METAVERSE_MESSAGE_TYPES = [
  "TEXT",
  "SYSTEM",
  "ANNOUNCEMENT",
  "HELP_REQUEST",
  "MODERATOR_NOTICE",
  "TASK_CONTEXT",
  "CIVIC_CONTEXT",
  "PROJECT_CONTEXT",
] as const;

export type MetaverseMessageType = (typeof METAVERSE_MESSAGE_TYPES)[number];

export type MetaverseMessageContract = {
  message_id: string;
  room_id: string;
  sender_user_id: string;
  organization_id: string;
  sent_at: string;
  message_type: MetaverseMessageType;
  body: string;
  reply_to_message_id: string | null;
  attachment_refs: string[];
  moderation_state: "VISIBLE" | "FLAGGED" | "HELD" | "REDACTED" | "DELETED";
  edited_at: string | null;
  deleted_at: string | null;
  source_client_id: string;
  safety_flags: string[];
  audit_reference: string | null;
};

export type MessageSubmissionInput = {
  room_id: string;
  organization_id: string;
  body: string;
  message_type?: MetaverseMessageType;
  reply_to_message_id?: string | null;
  attachment_refs?: string[];
  source_client_id: string;
  client_claimed_sender_user_id?: string | null;
};

export function buildServerAuthoredMessage(input: {
  server_message_id: string;
  actor_user_id: string;
  submitted: MessageSubmissionInput;
  sent_at: string;
  audit_reference?: string | null;
}): MetaverseMessageContract {
  if (input.submitted.client_claimed_sender_user_id && input.submitted.client_claimed_sender_user_id !== input.actor_user_id) {
    throw new Error("sender_identity_cannot_be_client_forged");
  }
  return {
    message_id: input.server_message_id,
    room_id: input.submitted.room_id,
    sender_user_id: input.actor_user_id,
    organization_id: input.submitted.organization_id,
    sent_at: input.sent_at,
    message_type: input.submitted.message_type || "TEXT",
    body: input.submitted.body,
    reply_to_message_id: input.submitted.reply_to_message_id || null,
    attachment_refs: input.submitted.attachment_refs || [],
    moderation_state: "VISIBLE",
    edited_at: null,
    deleted_at: null,
    source_client_id: input.submitted.source_client_id,
    safety_flags: [],
    audit_reference: input.audit_reference || null,
  };
}

export function validateSafeMessageLinks(urls: unknown[]): { ok: boolean; unsafe: unknown[] } {
  const unsafe = urls.filter((url) => !isSafeInternalPath(url));
  return { ok: unsafe.length === 0, unsafe };
}

export function canDeleteMessageWithoutEvidenceLoss(message: Pick<MetaverseMessageContract, "moderation_state" | "audit_reference" | "safety_flags">): boolean {
  if (message.audit_reference) return false;
  if (message.moderation_state === "FLAGGED" || message.moderation_state === "HELD") return false;
  return !message.safety_flags.includes("REPORTED");
}
