// NCA-2 — Canonical Notification Persistence, Recipient Resolution & Preferences.
//
// The smallest canonical preference model NCA-2 requires: a per-user,
// per-category in-app suppression choice, backed by migration
// 143_notification_preferences.sql. Governing rule (NCA_OWNER_DECISION_LOCK.md
// §7, notification-classification.ts SUPPRESSIBLE_CATEGORIES): only
// OPTIONAL_PRODUCT and DIGEST_ELIGIBLE may ever be set here. Every function
// takes an injectable executor (default: the real pool), matching the same
// pattern createNotificationFromEvent already uses, so this is unit
// testable without a live database connection.

import { query } from "../../../db/client.js";
import { isSuppressibleCategory, SUPPRESSIBLE_CATEGORIES, type NotificationCategory } from "../contracts/notification-classification.js";

type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class InvalidPreferenceCategoryError extends Error {
  constructor(public readonly category: string) {
    super(`Category is not user-suppressible: ${category}`);
    this.name = "InvalidPreferenceCategoryError";
  }
}

/**
 * The full, explicit preference set for a user: every suppressible
 * category, defaulting to enabled=true (visible) when no row exists yet.
 * A missing row is not an error and is never created merely by reading —
 * matches the existing repo convention (user_accessibility_profiles: "a
 * GET with no row returns the canonical default in memory without
 * persisting anything").
 */
export async function listPreferences(userId: string, db: Executor = { query }) {
  const result = await db.query("SELECT category, in_app_enabled FROM notification_preferences WHERE user_id=$1", [userId]);
  const stored = new Map<string, boolean>(result.rows.map((row: any) => [String(row.category), Boolean(row.in_app_enabled)]));
  return SUPPRESSIBLE_CATEGORIES.map((category) => ({
    category,
    inAppEnabled: stored.has(category) ? stored.get(category)! : true,
  }));
}

/**
 * Map form used internally by notification-service.ts read paths — only
 * contains an entry for a category the user has actually set; absence
 * means "enabled" (default), same semantics as listPreferences.
 */
export async function getPreferenceOverrides(userId: string, db: Executor = { query }): Promise<Map<NotificationCategory, boolean>> {
  const result = await db.query("SELECT category, in_app_enabled FROM notification_preferences WHERE user_id=$1", [userId]);
  return new Map(result.rows.map((row: any) => [String(row.category) as NotificationCategory, Boolean(row.in_app_enabled)]));
}

export async function setPreference(userId: string, category: string, inAppEnabled: boolean, db: Executor = { query }) {
  if (!isSuppressibleCategory(category as NotificationCategory)) {
    throw new InvalidPreferenceCategoryError(category);
  }
  const result = await db.query(
    `INSERT INTO notification_preferences (user_id, category, in_app_enabled, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, category) DO UPDATE SET in_app_enabled = EXCLUDED.in_app_enabled, updated_at = NOW()
     RETURNING category, in_app_enabled`,
    [userId, category, inAppEnabled],
  );
  const row = result.rows[0];
  return { category: row.category, inAppEnabled: Boolean(row.in_app_enabled) };
}
