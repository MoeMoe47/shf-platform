// NCA-2 — Canonical Notification Persistence, Recipient Resolution & Preferences.
//
// Entitlement step of the recipient-resolution pipeline (NCA-2 §10/§14):
// Source Event → Organization Scope → ... → Entitlement → Authorized User
// Set → Notification Policy → Preference Policy → Recipient Set.
//
// Reuses the real, canonical service_catalog / organization_service_entitlements
// tables (migration 084_service_catalog_entitlements.sql) — this does not
// introduce a second entitlement model. An EVENT_POLICIES entry may
// declare `requiresEntitlementService: <service_key>` and
// createNotificationFromEvent will call isOrganizationEntitled() before
// persisting a notification for that policy.
//
// Deliberately NOT retroactively applied to any of the ~19 existing wired
// policies in this phase: NCA-0 found no active incident of an operator
// being notified about a product their organization lacks, and this phase
// did not verify that organization_service_entitlements has been
// backfilled for every organization already relying on those existing
// notification types. Silently gating already-working notifications behind
// an unverified backfill would risk a false-negative regression with no
// evidence it's needed. The mechanism is implemented, tested, and
// available for any policy that genuinely requires it going forward — see
// the NCA-2 report §12 for the explicit reasoning.

type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

import { query } from "../../../db/client.js";

export async function isOrganizationEntitled(organizationId: string, serviceKey: string, db: Executor = { query }): Promise<boolean> {
  if (!organizationId || !serviceKey) return false;
  const result = await db.query(
    `SELECT 1
     FROM organization_service_entitlements e
     JOIN service_catalog s ON s.service_id = e.service_id
     WHERE e.organization_id = $1
       AND s.service_key = $2
       AND e.status = 'ACTIVE'
       AND s.status = 'ACTIVE'
       AND e.effective_from <= NOW()
       AND (e.effective_until IS NULL OR e.effective_until > NOW())
     LIMIT 1`,
    [organizationId, serviceKey],
  );
  return result.rows.length > 0;
}
