// src/utils/civicLogs.js

const CIVIC_KEY = "shf.civicMissionLogs.v1";

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[civicLogs] Failed to save JSON", err);
  }
}

/**
 * Append a civic mission log entry.
 * Returns the full updated array so callers can inspect counts.
 */
export function recordCivicMissionLog(entry) {
  const now = new Date();
  const base = {
    id: entry.id || `civic-${now.getTime()}`,
    at: entry.at || now.toISOString(),
    source: "civic",
  };

  const payload = {
    ...base,
    ...entry,
  };

  const prev = readJSON(CIVIC_KEY, []);
  const out = [...prev, payload];
  saveJSON(CIVIC_KEY, out);
  return out;
}

/** Read all civic mission logs (or [] if none). */
export function getAllCivicMissionLogs() {
  return readJSON(CIVIC_KEY, []);
}

/**
 * NEW: Initialize civic logs from storage.
 * This satisfies `import { initCivicLogsFromStorage } from "src/utils/civicLogs.js"`
 * and gives the app a predictable shape.
 */
export function initCivicLogsFromStorage() {
  const logs = readJSON(CIVIC_KEY, []);
  return {
    logs,
    count: logs.length,
    key: CIVIC_KEY,
  };
}
