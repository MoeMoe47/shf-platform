import type { MetaverseMessageContract } from "../message-contract.js";
import type { MetaversePresenceSession } from "../presence-contract.js";
import type { MetaverseRoomContract } from "../room-contract.js";

export type MetaverseCommunicationReport = {
  report_id: string;
  reporter_user_id: string;
  reported_user_id: string | null;
  message_id: string | null;
  room_id: string;
  organization_id: string;
  category: string;
  comment: string | null;
  submitted_at: string;
  preserved_context: {
    message: MetaverseMessageContract | null;
    room: MetaverseRoomContract | null;
  };
  review_status: "PENDING_REVIEW" | "IN_REVIEW" | "RESOLVED" | "ESCALATED";
  declares_guilt: false;
  audit_reference: string;
};

export type MetaverseCommunicationPreference = {
  preference_id: string;
  organization_id: string;
  owner_user_id: string;
  target_user_id: string;
  kind: "MUTE" | "BLOCK";
  room_id: string | null;
  created_at: string;
  semantics: {
    changes_target_permissions?: false;
    expels_target_from_platform?: false;
    hides_messages_for_user?: true;
    prevents_direct_interaction_paths?: true;
  };
};

export type MetaverseModerationRecord = {
  action_id: string;
  action: "WARN" | "ROOM_MUTE" | "REMOVE_FROM_ROOM" | "TEMPORARY_COMMUNICATION_SUSPENSION" | "LOCK_POSTING" | "CLOSE_ROOM" | "ESCALATE" | "ARCHIVE_CONVERSATION";
  scope: "ROOM" | "FACILITY" | "DISTRICT" | "ORGANIZATION";
  moderator_user_id: string;
  target_user_id: string | null;
  room_id: string | null;
  organization_id: string;
  reason: string;
  created_at: string;
  audit_reference: string;
};

export class MetaverseCommunicationRepository {
  private presence = new Map<string, MetaversePresenceSession>();
  private rooms = new Map<string, MetaverseRoomContract>();
  private messages = new Map<string, MetaverseMessageContract[]>();
  private reports = new Map<string, MetaverseCommunicationReport>();
  private preferences = new Map<string, MetaverseCommunicationPreference>();
  private moderation = new Map<string, MetaverseModerationRecord>();

  upsertPresence(session: MetaversePresenceSession) {
    this.presence.set(session.presence_session_id, session);
    return session;
  }

  getPresence(sessionId: string) {
    return this.presence.get(sessionId) || null;
  }

  deletePresence(sessionId: string) {
    this.presence.delete(sessionId);
  }

  listPresence() {
    return [...this.presence.values()];
  }

  saveRoom(room: MetaverseRoomContract) {
    this.rooms.set(room.room_id, room);
    return room;
  }

  getRoom(roomId: string) {
    return this.rooms.get(roomId) || null;
  }

  listRooms() {
    return [...this.rooms.values()];
  }

  appendMessage(message: MetaverseMessageContract) {
    const rows = this.messages.get(message.room_id) || [];
    rows.push(message);
    this.messages.set(message.room_id, rows);
    return message;
  }

  updateMessage(message: MetaverseMessageContract) {
    const rows = this.messages.get(message.room_id) || [];
    const index = rows.findIndex((item) => item.message_id === message.message_id);
    if (index >= 0) rows[index] = message;
    else rows.push(message);
    this.messages.set(message.room_id, rows);
    return message;
  }

  listMessages(roomId: string) {
    return [...(this.messages.get(roomId) || [])];
  }

  findMessage(messageId: string) {
    for (const rows of this.messages.values()) {
      const found = rows.find((item) => item.message_id === messageId);
      if (found) return found;
    }
    return null;
  }

  saveReport(report: MetaverseCommunicationReport) {
    this.reports.set(report.report_id, report);
    return report;
  }

  getReport(reportId: string) {
    return this.reports.get(reportId) || null;
  }

  savePreference(preference: MetaverseCommunicationPreference) {
    this.preferences.set(preference.preference_id, preference);
    return preference;
  }

  listPreferences(ownerUserId: string, organizationId: string) {
    return [...this.preferences.values()].filter((item) => item.owner_user_id === ownerUserId && item.organization_id === organizationId);
  }

  saveModeration(record: MetaverseModerationRecord) {
    this.moderation.set(record.action_id, record);
    return record;
  }

  clearForTests() {
    this.presence.clear();
    this.rooms.clear();
    this.messages.clear();
    this.reports.clear();
    this.preferences.clear();
    this.moderation.clear();
  }
}

export const metaverseCommunicationRepository = new MetaverseCommunicationRepository();
