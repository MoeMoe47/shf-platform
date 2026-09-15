import { randomUUID } from "node:crypto";
import { buildServerAuthoredMessage, canDeleteMessageWithoutEvidenceLoss, type MetaverseMessageContract, type MetaverseMessageType } from "../message-contract.js";
import { METAVERSE_NOTIFICATION_INTEGRATION } from "../communication-policy.js";
import { COMMUNICATION_PREFERENCE_SEMANTICS, isModeratorActionInScope, type MetaverseModerationScope } from "../moderation-contract.js";
import { metaverseCommunicationRepository, type MetaverseCommunicationRepository } from "./communication-repository.js";
import { MetaverseCommunicationError } from "./presence-service.js";
import { MetaverseRoomService } from "./room-service.js";

const messageLimit = new Map<string, { count: number; expiresAt: number; lastBody: string; duplicateCount: number }>();

function normalize(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function extractUrls(body: string) {
  return body.match(/\b(?:https?:\/\/|javascript:|data:|\/\/|\/)[^\s<>"']+/gi) || [];
}

function sanitizeBody(body: string) {
  return body.replace(/[<>]/g, "");
}

export function validateMessageBodySafety(body: string) {
  const urls = extractUrls(body);
  const unsafe = urls.filter((raw) => {
    const value = raw.trim();
    if (/^(javascript|data):/i.test(value) || value.startsWith("//")) return true;
    if (value.startsWith("/")) return false;
    try {
      const url = new URL(value);
      return !["http:", "https:"].includes(url.protocol);
    } catch {
      return true;
    }
  });
  return { ok: unsafe.length === 0, unsafe, normalized_body: sanitizeBody(body) };
}

function consumeMessageRate(userId: string, roomId: string, body: string, now: Date) {
  const key = `${userId}:${roomId}`;
  const current = messageLimit.get(key);
  if (!current || current.expiresAt <= now.getTime()) {
    messageLimit.set(key, { count: 1, expiresAt: now.getTime() + 30_000, lastBody: body, duplicateCount: 0 });
    return;
  }
  current.count += 1;
  if (current.lastBody === body) current.duplicateCount += 1;
  else {
    current.lastBody = body;
    current.duplicateCount = 0;
  }
  if (current.count > 8 || current.duplicateCount > 2) {
    throw new MetaverseCommunicationError("MESSAGE_RATE_LIMITED", "Message rate limit exceeded.", 429);
  }
}

export class MetaverseMessageService {
  constructor(
    private repo: MetaverseCommunicationRepository = metaverseCommunicationRepository,
    private rooms = new MetaverseRoomService(repo),
  ) {}

  list(user: any, roomId: string) {
    this.rooms.getAuthorized(user, roomId);
    const actor = this.rooms.requireActor(user);
    const preferences = this.repo.listPreferences(actor.user_id as string, actor.organization_id as string);
    const muted = new Set(preferences.filter((item) => item.kind === "MUTE").map((item) => item.target_user_id));
    return this.repo.listMessages(roomId).filter((message) => !muted.has(message.sender_user_id));
  }

  send(user: any, roomId: string, body: any = {}, now = new Date()): MetaverseMessageContract {
    const room = this.rooms.getAuthorized(user, roomId);
    const actor = this.rooms.requireActor(user);
    const text = String(body.body || "").trim();
    if (!text) throw new MetaverseCommunicationError("MESSAGE_BODY_REQUIRED", "Message body is required.", 400);
    if (text.length > 1000) throw new MetaverseCommunicationError("MESSAGE_BODY_TOO_LONG", "Message body is too long.", 400);
    consumeMessageRate(actor.user_id as string, room.room_id, text, now);
    const safe = validateMessageBodySafety(text);
    if (!safe.ok) throw new MetaverseCommunicationError("UNSAFE_LINK_REJECTED", "Unsafe message link rejected.", 400);
    const messageType = String(body.message_type || body.messageType || "TEXT") as MetaverseMessageType;
    let message: MetaverseMessageContract;
    try {
      message = buildServerAuthoredMessage({
        server_message_id: randomUUID(),
        actor_user_id: actor.user_id as string,
        sent_at: now.toISOString(),
        audit_reference: `audit:metaverse-message:${room.room_id}:${actor.user_id}:${now.getTime()}`,
        submitted: {
          room_id: room.room_id,
          organization_id: room.organization_id,
          body: safe.normalized_body,
          message_type: messageType,
          reply_to_message_id: normalize(body.reply_to_message_id || body.replyToMessageId),
          source_client_id: normalize(body.source_client_id || body.sourceClientId) || "unknown-client",
          client_claimed_sender_user_id: normalize(body.sender_user_id || body.senderUserId || body.client_claimed_sender_user_id),
        },
      });
    } catch (error: any) {
      if (error?.message === "sender_identity_cannot_be_client_forged") {
        throw new MetaverseCommunicationError("SENDER_IDENTITY_FORGED", "sender_identity_cannot_be_client_forged", 403);
      }
      throw error;
    }
    return this.repo.appendMessage(message);
  }

  delete(user: any, roomId: string, messageId: string, now = new Date()) {
    this.rooms.getAuthorized(user, roomId);
    const actor = this.rooms.requireActor(user);
    const message = this.repo.findMessage(messageId);
    if (!message || message.room_id !== roomId) throw new MetaverseCommunicationError("MESSAGE_NOT_FOUND", "Message not found.", 404);
    if (message.sender_user_id !== actor.user_id && actor.role_context.role !== "MODERATOR" && actor.role_context.role !== "ORG_ADMIN") {
      throw new MetaverseCommunicationError("MESSAGE_DELETE_DENIED", "Message delete denied.", 403);
    }
    if (!canDeleteMessageWithoutEvidenceLoss(message)) {
      return this.repo.updateMessage({ ...message, moderation_state: "REDACTED", deleted_at: now.toISOString(), body: "[preserved for review]" });
    }
    return this.repo.updateMessage({ ...message, moderation_state: "DELETED", deleted_at: now.toISOString(), body: "" });
  }

  mute(user: any, targetUserId: string, roomId: string | null, now = new Date()) {
    const actor = this.rooms.requireActor(user);
    return this.repo.savePreference({
      preference_id: `mute:${actor.organization_id}:${actor.user_id}:${targetUserId}:${roomId || "global"}`,
      organization_id: actor.organization_id as string,
      owner_user_id: actor.user_id as string,
      target_user_id: targetUserId,
      kind: "MUTE",
      room_id: roomId,
      created_at: now.toISOString(),
      semantics: COMMUNICATION_PREFERENCE_SEMANTICS.mute,
    });
  }

  block(user: any, targetUserId: string, roomId: string | null, now = new Date()) {
    const actor = this.rooms.requireActor(user);
    return this.repo.savePreference({
      preference_id: `block:${actor.organization_id}:${actor.user_id}:${targetUserId}:${roomId || "global"}`,
      organization_id: actor.organization_id as string,
      owner_user_id: actor.user_id as string,
      target_user_id: targetUserId,
      kind: "BLOCK",
      room_id: roomId,
      created_at: now.toISOString(),
      semantics: COMMUNICATION_PREFERENCE_SEMANTICS.block,
    });
  }

  report(user: any, roomId: string, body: any = {}, now = new Date()) {
    const room = this.rooms.getAuthorized(user, roomId);
    const actor = this.rooms.requireActor(user);
    const message = body.message_id || body.messageId ? this.repo.findMessage(String(body.message_id || body.messageId)) : null;
    if (message && message.room_id !== roomId) throw new MetaverseCommunicationError("REPORT_MESSAGE_ROOM_MISMATCH", "Reported message is not in this room.", 400);
    if (message) this.repo.updateMessage({ ...message, safety_flags: Array.from(new Set([...message.safety_flags, "REPORTED"])), moderation_state: "FLAGGED" });
    return this.repo.saveReport({
      report_id: randomUUID(),
      reporter_user_id: actor.user_id as string,
      reported_user_id: normalize(body.reported_user_id || body.reportedUserId || message?.sender_user_id),
      message_id: message?.message_id || null,
      room_id: room.room_id,
      organization_id: room.organization_id,
      category: normalize(body.category) || "SAFETY_REVIEW",
      comment: normalize(body.comment),
      submitted_at: now.toISOString(),
      preserved_context: { message: message || null, room },
      review_status: "PENDING_REVIEW",
      declares_guilt: false,
      audit_reference: `audit:metaverse-report:${room.room_id}:${actor.user_id}:${now.getTime()}`,
    });
  }

  moderate(user: any, body: any = {}, now = new Date()) {
    const actor = this.rooms.requireActor(user);
    if (!["MODERATOR", "ORG_ADMIN", "INSTRUCTOR"].includes(actor.role_context.role)) {
      throw new MetaverseCommunicationError("MODERATION_DENIED", "Moderation authority required.", 403);
    }
    const scope = String(body.scope || "ROOM") as MetaverseModerationScope;
    const moderatorScope: MetaverseModerationScope = actor.role_context.role === "ORG_ADMIN" ? "ORGANIZATION" : scope;
    if (!isModeratorActionInScope({ moderatorScope, targetScope: scope, sameOrganization: true })) {
      throw new MetaverseCommunicationError("MODERATION_SCOPE_DENIED", "Moderation scope denied.", 403);
    }
    return this.repo.saveModeration({
      action_id: randomUUID(),
      action: String(body.action || "WARN"),
      scope,
      moderator_user_id: actor.user_id as string,
      target_user_id: normalize(body.target_user_id || body.targetUserId),
      room_id: normalize(body.room_id || body.roomId),
      organization_id: actor.organization_id as string,
      reason: normalize(body.reason) || "policy_review",
      created_at: now.toISOString(),
      audit_reference: `audit:metaverse-moderation:${actor.organization_id}:${actor.user_id}:${now.getTime()}`,
    } as any);
  }

  notificationIntegration() {
    return METAVERSE_NOTIFICATION_INTEGRATION;
  }
}
