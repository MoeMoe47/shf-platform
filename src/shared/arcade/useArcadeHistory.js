// src/shared/arcade/useArcadeHistory.js
// ------------------------------------------------------------
// Legacy/local compatibility history only; this is not canonical Arcade truth.
// ------------------------------------------------------------

import React from "react";
import * as creditLedger from "@/utils/creditLedger.js";
import { arcadeGames } from "@/data/arcade.js";
import { getArcadeEventRule } from "./arcadeRules.js";

const LIMIT = 200;

/**
 * Reads historical frontend-era rows for compatibility and forensic review.
 * These rows are not canonical Arcade Results, Verified Evidence records,
 * Treasury records, Truth Spine facts, or proof of mastery, credentials, or
 * institutional blockchain proof.
 */
export function useArcadeHistory() {
  const [events, setEvents] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let rows = [];

        if (typeof creditLedger.listRecentEntries === "function") {
          rows = await creditLedger.listRecentEntries({
            app: "arcade",
            limit: LIMIT,
          });
        } else {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[useArcadeHistory] creditLedger.listRecentEntries() not implemented. " +
                "Implement it or swap this call to your ledger client."
            );
          }
          rows = [];
        }

        if (cancelled) return;

        const normalized = Array.isArray(rows)
          ? rows.map(normalizeArcadeEntry).filter(Boolean)
          : [];

        const summary = buildSummary(normalized);

        setEvents(normalized);
        setSummary(summary);
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load arcade history.");
          if (process.env.NODE_ENV !== "production") {
            console.error("[useArcadeHistory] load error:", err);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, summary, loading, error };
}

export function normalizeArcadeEntry(raw) {
  if (!raw || typeof raw !== "object") return null;

  const {
    id,
    _id,
    uuid,
    timestamp,
    createdAt,
    time,
    eventType: rawEventType,
    type,
    gameId: rawGameId,
    game,
    xpDelta,
    xp,
    deltaXp,
    evuDelta,
    evu,
    deltaEvu,
    creditsDelta,
    creditDelta,
    credits,
    userId: rawUserId,
    user,
    userName: rawUserName,
    meta = {},
    ruleMeta = {},
    polygon = {},
    txHash: rawTxHash,
  } = raw;

  const eventTypeKey = rawEventType || type || meta.eventType || "unknown";

  const rule = getArcadeEventRule(eventTypeKey);
  const eventLabel = rule?.label || eventTypeKey;

  const gameId = rawGameId || game?.id || meta.gameId;
  const gameMeta = arcadeGames.find((g) => g.id === gameId) || null;
  const gameTitle =
    raw.gameTitle ||
    game?.title ||
    meta.gameTitle ||
    gameMeta?.title ||
    null;

  const legacyXpDelta =
    xpDelta ??
    xp ??
    deltaXp ??
    meta.xpDelta ??
    null;

  const legacyEvuDelta =
    evuDelta ??
    evu ??
    deltaEvu ??
    meta.evuDelta ??
    null;

  const legacyCreditsDelta =
    creditsDelta ??
    creditDelta ??
    credits ??
    meta.creditsDelta ??
    null;

  const userId = rawUserId || user?.id || meta.userId || null;
  const userName =
    rawUserName ||
    user?.name ||
    user?.displayName ||
    meta.userName ||
    null;

  const legacyOnChain =
    raw.onChain ??
    meta.onChain ??
    ruleMeta.onChain ??
    polygon.onChain ??
    rule?.onChain ??
    null;

  const legacyTxHash =
    rawTxHash ||
    meta.txHash ||
    polygon.txHash ||
    null;

  const cohort = meta.cohort || meta.cohortId || null;
  const location = meta.location || meta.site || null;
  const device = meta.device || meta.client || null;

  const selTags =
    (Array.isArray(meta.selTags) && meta.selTags.length
      ? meta.selTags
      : gameMeta?.selTags) || [];

  const workforceTags =
    (Array.isArray(meta.workforceTags) && meta.workforceTags.length
      ? meta.workforceTags
      : gameMeta?.workforceTags) || [];

  const ts = timestamp || createdAt || time || meta.timestamp || null;
  let timestampReadable = ts;

  if (ts) {
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) {
      timestampReadable = d.toLocaleString();
    }
  }

  return {
    id: id || _id || uuid || `${eventTypeKey}-${ts}-${gameId || "nogame"}`,
    timestamp: ts,
    timestampReadable,
    userId,
    userName,
    eventType: eventLabel,
    gameId,
    gameTitle,
    cohort,
    location,
    device,
    selTags,
    workforceTags,
    source: "legacy_local_history",
    authoritative: false,
    legacyOutcomeMetadata: {
      xpDelta: legacyXpDelta ?? null,
      evuDelta: legacyEvuDelta ?? null,
      creditsDelta: legacyCreditsDelta ?? null,
      onChain: legacyOnChain ?? null,
      txHash: legacyTxHash ?? null,
    },
  };
}

export function buildSummary(events) {
  const rows = Array.isArray(events) ? events : [];
  const timestamps = rows
    .map((event) => event.timestamp)
    .filter((timestamp) => timestamp && !Number.isNaN(new Date(timestamp).getTime()))
    .map((timestamp) => new Date(timestamp).toISOString())
    .sort();
  return {
    totalEntries: rows.length,
    totalSessions: rows.length,
    distinctGames: new Set(rows.map((event) => event.gameId).filter(Boolean)).size,
    distinctEventTypes: new Set(rows.map((event) => event.eventType).filter(Boolean)).size,
    latestTimestamp: timestamps.at(-1) || null,
    source: "legacy_local_history",
    authoritative: false,
  };
}
