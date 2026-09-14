// NCA-1 — Canonical Notification Contracts, Consolidation & Policy.
//
// Type-only contracts. Formalizes the shapes already implied by the real,
// running system (integration_outbox migration 007, notifications migration
// 081) per docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md
// and docs/architecture/NCA_OWNER_DECISION_LOCK.md (NCA-D001/NCA-D002 approved).
//
// Governing law (do not violate anywhere this contract is used):
// a notification communicates source-domain state. It never becomes
// workflow authority, Evidence, Truth, or audit authority, and it never
// independently completes the work it describes.
//
// Nothing here changes the database schema. Fields marked "reserved" have
// no persisted column yet (see NCA-0 §67 / decision lock §15 for the
// deferred, additive migration outlook) and are either computed at read
// time from a static classification registry (see
// ./notification-classification.ts) or intentionally left for a later
// phase.

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH" | "WEBHOOK";

/**
 * The owner-approved six-category communication policy
 * (NCA_OWNER_DECISION_LOCK.md §7). MARKETING must never be assigned to
 * anything projected through the canonical notifications table — it
 * requires its own, separately consented channel that does not exist
 * today.
 */
export type NotificationCategory =
  | "MANDATORY_OPERATIONAL"
  | "REQUIRED_ACTION"
  | "TRANSACTIONAL"
  | "OPTIONAL_PRODUCT"
  | "DIGEST_ELIGIBLE"
  | "MARKETING";

/** Reuses the BOS notification-fabric's existing four-level scheme (NCA-0 §32) for consistency across the two systems rather than inventing a second scale. */
export type NotificationUrgency = "info" | "notice" | "warning" | "critical";

/**
 * Read state. Matches the real `notifications.status` CHECK constraint
 * verbatim (migration 081) — this is not a new value set, only a named type
 * for it.
 */
export type NotificationReadState = "UNREAD" | "READ" | "ARCHIVED";

/**
 * Action state. Only NO_ACTION and ACTION_REQUIRED are derivable today
 * (from the static classification registry). ACTION_COMPLETED and EXPIRED
 * are reserved: per the governing law, completion must be derived from
 * source-domain workflow state, not from notification read/archive state,
 * and no source-domain completion signal is wired back into notifications
 * yet. Do not synthesize ACTION_COMPLETED from `status === 'READ'` — that
 * is exactly the conflation NCA-0 §54/§39 warns against.
 */
export type NotificationActionState = "NO_ACTION" | "ACTION_REQUIRED" | "ACTION_COMPLETED" | "EXPIRED";

/**
 * The canonical communication event contract. Field-for-field mapping onto
 * the real `integration_outbox` row shape (migration 007) plus the
 * additive fields NCA-0 §28 identified as missing. Every "already real"
 * field must keep mapping onto the named outbox column; nothing here
 * introduces a second event shape or a parallel event bus.
 */
export interface CommunicationEventContract {
  /** outbox_event_id — already real */
  eventId: string;
  /** event_type — already real */
  eventType: string;
  /** producer_id — already real, e.g. "shs-api.studio-routing" */
  sourceDomain: string;
  /** subject_type — already real */
  sourceEntityType: string;
  /** subject_id — already real */
  sourceEntityId: string;
  /** organization_id — already real */
  organizationId: string;
  /** tenant_id — already real; must always equal `tenant:${organizationId}` */
  tenantId: string;
  /** originating_actor_id — already real */
  actorId: string | null;
  /** occurred_at — already real */
  occurredAt: string;
  /** de facto unique on (organization_id, producer_id, idempotency_key) — already real */
  idempotencyKey: string;
  /** correlation_id — already real */
  correlationId: string | null;
  /** payload_json — already real */
  payload: Record<string, unknown>;
  /**
   * Resolved per-event by the owning EVENT_POLICIES.recipient() function,
   * not modeled at the outbox layer — recipient resolution is a policy
   * concern, not an event-shape concern (NCA-0 §28). Not a column.
   */
  subjectUserId?: string | null;
  /** Reserved — not modeled at the outbox layer today; see notification-classification.ts for the read-time equivalent used by the projection. */
  severity?: NotificationUrgency;
  /** Reserved — see notification-classification.ts for the read-time equivalent used today. */
  actionRequired?: boolean;
  /** Reserved for future use; no migration exists to persist this on the event yet. */
  privacyClassification?: "GENERIC" | "SENSITIVE";
  /** Reserved for future use; no migration exists to persist this on the event yet. */
  expiresAt?: string | null;
}

/**
 * The canonical notification projection contract. Field-for-field mapping
 * onto the real `notifications` row shape (migration 081) plus the
 * additive/derived fields NCA-0 §29 identified. Fields marked "derived,
 * read-time" are computed by classifyNotificationType(), not stored — do
 * not add a migration to persist them without an explicit later-phase
 * decision (NCA-0 §67).
 */
export interface NotificationProjectionContract {
  /** notification_id — already real */
  notificationId: string;
  /** recipient_user_id — already real */
  recipientUserId: string;
  /** organization_id — already real */
  organizationId: string;
  /** tenant_id — already real */
  tenantId: string;
  /** source_event_id / source_event_type — already real */
  eventId: string;
  eventType: string;
  /** notification_type — already real */
  type: string;
  /** title / message — already real, bounded to 200/1000 chars */
  title: string;
  message: string;
  /** destination_path — already real; server-generated only, never client-supplied */
  destinationPath: string | null;
  /** status — already real */
  readState: NotificationReadState;
  /** created_at / read_at — already real */
  createdAt: string;
  readAt: string | null;
  /** derived, read-time (notification-classification.ts) — not a column */
  category: NotificationCategory;
  /** derived, read-time — not a column */
  actionRequired: boolean;
  /** derived, read-time — not a column */
  urgency: NotificationUrgency;
  /** derived, read-time — not a column; today always ["IN_APP"] because no other channel is wired */
  channelEligibility: NotificationChannel[];
  /** derived from readState + category today; ACTION_COMPLETED/EXPIRED reserved (see NotificationActionState) */
  actionState: NotificationActionState;
  /** Reserved — no `expires_at` column exists yet (NCA-0 §53/§67) */
  expiresAt?: string | null;
}

/**
 * The canonical attention-item projection: the actionRequired-filtered
 * subset of NotificationProjectionContract, meant to feed the existing
 * SeaAttention primitive (src/components/sea/SeaDashboardPrimitives.jsx)
 * everywhere, rather than each page hand-rolling its own `items` list
 * (NCA-0 §33, decision lock §11). This is NCA's data contract to EXR's UI
 * placement — NCA owns the data shape, EXR owns where it is rendered.
 */
export interface AttentionItemContract {
  notificationId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  destinationPath: string | null;
  urgency: NotificationUrgency;
  readState: NotificationReadState;
  createdAt: string;
}

/**
 * The recipient-resolution contract. Matches the real, working
 * EVENT_POLICIES[...].recipient(event, db) signature verbatim — no change
 * to the ~19 existing implementations. `entitlementCheck` is a reserved
 * extension point: NCA-0 §30/§65 found no entitlement/permission check
 * before recipient resolution today, and the owner decision lock scoped
 * adding one to NCA-2, not NCA-1. Do not implement enforcement against
 * this field yet — it exists so a policy author can start declaring intent
 * now without every future policy needing a breaking contract change
 * later.
 */
export interface RecipientResolutionContract<TEvent = Record<string, unknown>> {
  recipient: (event: TEvent, db: { query: (sql: string, params?: unknown[]) => Promise<any> }) => Promise<string | null>;
  /** Reserved for NCA-2. Not enforced today. */
  entitlementCheck?: (recipientUserId: string, event: TEvent) => Promise<boolean>;
}
