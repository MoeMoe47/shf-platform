// src/shared/ledger/exporters.js
import { queryEvents, rollup } from "@/shared/ledger/ledgerClient.js";
import { downloadCSV } from "@/utils/exports.js";

/**
 * All exporter fns accept the SAME query shape as queryEvents:
 *   { from?, to?, filters?, sort? }
 * and simply pass it through.
 *
 * You can optionally pass a custom CSV header (array of field names)
 * to control which columns are exported and in what order.
 * Any missing fields will export as empty strings.
 */

/** Pretty JSON of raw events (respects query) */
export function exportEventsJSON(query = {}) {
  return JSON.stringify(queryEvents(query), null, 2);
}

/** Pretty JSON of rollup (unchanged; rollup ignores query by design) */
export function exportRollupJSON() {
  return JSON.stringify(rollup(), null, 2);
}

/** CSV string (programmatic use; respects query) */
export function exportCSV(query = {}, headerOverride = CSV_HEADER) {
  const header = Array.isArray(headerOverride) && headerOverride.length > 0
    ? headerOverride
    : CSV_HEADER;

  const rows = csvRowsFromEvents(queryEvents(query));
  return [header, ...rows.map(r => header.map(k => toCSV(r[k])))]
    .map(r => r.join(","))
    .join("\n");
}

/** Trigger browser download of events as CSV (respects query) */
export function downloadEventsCSV(
  filename = "ledger.csv",
  query = {},
  headerOverride = CSV_HEADER
) {
  const header = Array.isArray(headerOverride) && headerOverride.length > 0
    ? headerOverride
    : CSV_HEADER;

  const rows = csvRowsFromEvents(queryEvents(query));
  downloadCSV(filename, rows, header);
}

/* ---------------- internal helpers ---------------- */

const CSV_HEADER = [
  "id",
  "actorId",
  "app",
  "type",
  "amount",
  "tags",
  "impact_tag",
  "ts",
];

function csvRowsFromEvents(events) {
  return (events || []).map(e => ({
    id: e.id ?? "",
    actorId: e.actorId ?? "",
    app: e.app ?? "",
    type: e.type ?? "",
    amount: e.amount ?? 0,
    tags: Array.isArray(e.tags) ? e.tags.join("|") : "",
    impact_tag: e.impact_tag ?? "",
    ts: e.ts ?? "",
    // If your UI shows additional columns, you can pre-map them here so that
    // header overrides like ["date", "memo", "program", "amount"] have data:
    // date: e.date ?? e.ts ?? "",
    // memo: e.memo ?? "",
    // program: e.program ?? "",
    // vendor: e.vendor ?? "",
  }));
}

function toCSV(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
