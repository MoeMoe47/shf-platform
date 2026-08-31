// SHF Database Phase 4.2 — deterministic expectation extraction from
// migration SQL text.
//
// This is NOT a general-purpose SQL parser. It is a bounded extractor for
// the exact, narrow DDL vocabulary every migration in this repository has
// used from 001 through the current HEAD (verified — see the Phase 4.2
// report's migration census): CREATE TABLE IF NOT EXISTS, ALTER TABLE ...
// ADD COLUMN IF NOT EXISTS, CREATE [UNIQUE] INDEX IF NOT EXISTS ... ON,
// CREATE EXTENSION IF NOT EXISTS, and named CONSTRAINT clauses (inline or
// via ALTER TABLE ADD CONSTRAINT). No trigger, view, function, or stored
// procedure DDL exists anywhere in this repository's migrations. No
// DROP TABLE/COLUMN, RENAME, or ALTER COLUMN TYPE statement exists
// anywhere (confirmed by repo-wide search) — every migration is purely
// additive at the table/column level, so an expectation extracted from
// migration N's own text is always the correct *current* canonical
// expectation; no later migration ever invalidates an earlier one's
// column definition (see §8/§19 of the Phase 4.2 brief). The one
// narrower exception is `DROP CONSTRAINT IF EXISTS X` immediately
// followed by `ADD CONSTRAINT X` with the identical name (migrations
// 020/021/026/029 redefine a CHECK's condition this way) — the name
// survives unchanged, so this still doesn't require re-attribution; the
// `SQL_NOISE_WORDS` filter below exists specifically so the DROP
// clause's own "IF"/"EXISTS" tokens are never mistaken for a
// constraint name.
//
// Deliberately NOT verified here (documented limitation, not silently
// skipped): inline UNIQUE/CHECK constraints written without an explicit
// CONSTRAINT name rely on Postgres' auto-generated name, which this
// extractor does not attempt to predict (name-length truncation makes
// that unreliable) and does not yet verify structurally. Every
// migration in the 030-047 range that this project's incident history
// has actually touched already uses explicit CONSTRAINT names, so this
// gap has not caused an undetected incident to date — see the Phase 4.2
// report's Known Limitations section.

export type ExpectedObjectType = "table" | "column" | "index" | "constraint" | "extension" | "primary_key";

export interface MigrationExpectation {
  migrationId: string;
  objectType: ExpectedObjectType;
  table: string;
  name: string; // column name, index name, constraint name, or extension name
}

const CREATE_TABLE_RE = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(/gi;
const ADD_COLUMN_RE = /ADD COLUMN IF NOT EXISTS\s+(\w+)/gi;
const CREATE_INDEX_RE = /CREATE\s+(?:UNIQUE\s+)?INDEX IF NOT EXISTS\s+(\w+)\s+ON\s+(\w+)/gi;
const CREATE_EXTENSION_RE = /CREATE EXTENSION IF NOT EXISTS\s+(\w+)/gi;
// Negative lookbehind excludes "pg_constraint" (the catalog table name,
// which several migrations query inside DO $$ guards) from matching —
// without it, "...FROM pg_constraint WHERE..." is misread as a
// CONSTRAINT clause naming "WHERE".
const CONSTRAINT_NAME_RE = /(?<![\w])CONSTRAINT\s+(\w+)/gi;
const ALTER_TABLE_HEADER_RE = /ALTER TABLE\s+(\w+)/gi;
const TABLE_LEVEL_KEYWORDS = new Set(["CONSTRAINT", "CHECK", "UNIQUE", "PRIMARY", "FOREIGN", "EXCLUDE"]);
// Defensive filter: a captured "constraint name" that is actually a bare
// SQL keyword means the regex matched a DROP/other clause it wasn't
// meant to (e.g. "DROP CONSTRAINT IF EXISTS x" — "IF" is not a real
// constraint name). No real identifier in this codebase collides with
// these words.
const SQL_NOISE_WORDS = new Set(["IF", "EXISTS", "NOT", "DROP", "ADD"]);

/** Finds the matching closing paren for the `(` at `openIndex`, honoring nesting. */
function findMatchingParen(sql: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Splits a paren body into top-level comma-separated definition lines,
 * ignoring commas nested inside column-type parens (e.g. NUMERIC(10,2)). */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** Strips `-- ...` line comments so they can never be mistaken for a
 * column/constraint token by the splitter below. */
function stripLineComments(sql: string): string {
  return sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}

function extractColumnsAndPrimaryKey(body: string): { columns: string[]; hasPrimaryKey: boolean } {
  const columns: string[] = [];
  let hasPrimaryKey = false;
  for (const rawLine of splitTopLevel(body)) {
    const line = rawLine.trim();
    if (!line) continue;
    const firstWord = line.split(/\s+/)[0].toUpperCase();
    if (TABLE_LEVEL_KEYWORDS.has(firstWord)) {
      if (/PRIMARY\s+KEY/i.test(line) || firstWord === "PRIMARY") hasPrimaryKey = true;
      continue;
    }
    // Column definition: first token is the column name (case preserved).
    const columnName = line.split(/\s+/)[0];
    if (columnName) columns.push(columnName);
    if (/PRIMARY\s+KEY/i.test(line)) hasPrimaryKey = true;
  }
  return { columns, hasPrimaryKey };
}

export function parseMigrationExpectations(migrationId: string, rawSql: string): MigrationExpectation[] {
  const sql = stripLineComments(rawSql);
  const expectations: MigrationExpectation[] = [];

  for (const match of sql.matchAll(CREATE_TABLE_RE)) {
    const table = match[1];
    const openIndex = match.index! + match[0].length - 1;
    const closeIndex = findMatchingParen(sql, openIndex);
    if (closeIndex === -1) continue;
    const body = sql.slice(openIndex + 1, closeIndex);

    expectations.push({ migrationId, objectType: "table", table, name: table });

    const { columns, hasPrimaryKey } = extractColumnsAndPrimaryKey(body);
    for (const column of columns) {
      expectations.push({ migrationId, objectType: "column", table, name: column });
    }
    if (hasPrimaryKey) {
      expectations.push({ migrationId, objectType: "primary_key", table, name: `${table}_pkey` });
    }
    for (const cmatch of body.matchAll(CONSTRAINT_NAME_RE)) {
      if (SQL_NOISE_WORDS.has(cmatch[1].toUpperCase())) continue;
      expectations.push({ migrationId, objectType: "constraint", table, name: cmatch[1] });
    }
  }

  // ADD COLUMN IF NOT EXISTS clauses, attributed to the nearest preceding
  // ALTER TABLE <table> header — a single ALTER TABLE statement can list
  // several comma-separated ADD COLUMN clauses (e.g. migration 032's
  // programs stewardship columns), so this cannot be a single regex match
  // per statement.
  const alterHeadersForColumns = [...sql.matchAll(ALTER_TABLE_HEADER_RE)].map((m) => ({ table: m[1], index: m.index! }));
  for (const match of sql.matchAll(ADD_COLUMN_RE)) {
    const idx = match.index!;
    const owner = [...alterHeadersForColumns].reverse().find((h) => h.index < idx);
    if (owner) expectations.push({ migrationId, objectType: "column", table: owner.table, name: match[1] });
  }

  for (const match of sql.matchAll(CREATE_INDEX_RE)) {
    const [, indexName, table] = match;
    expectations.push({ migrationId, objectType: "index", table, name: indexName });
  }

  for (const match of sql.matchAll(CREATE_EXTENSION_RE)) {
    expectations.push({ migrationId, objectType: "extension", table: "", name: match[1] });
  }

  // Named constraints added via ALTER TABLE ... ADD CONSTRAINT (outside any
  // CREATE TABLE block — those were already captured above). Associate each
  // with the nearest preceding ALTER TABLE <table> header in the same
  // migration (this repo never interleaves two different tables' ALTER
  // TABLE ADD CONSTRAINT blocks without a new header in between).
  const alterHeaders = [...sql.matchAll(ALTER_TABLE_HEADER_RE)].map((m) => ({ table: m[1], index: m.index! }));
  for (const cmatch of sql.matchAll(CONSTRAINT_NAME_RE)) {
    if (SQL_NOISE_WORDS.has(cmatch[1].toUpperCase())) continue;
    const idx = cmatch.index!;
    // Skip constraints already attributed inside a CREATE TABLE body.
    const insideCreateTable = [...sql.matchAll(CREATE_TABLE_RE)].some((tmatch) => {
      const openIndex = tmatch.index! + tmatch[0].length - 1;
      const closeIndex = findMatchingParen(sql, openIndex);
      return closeIndex !== -1 && idx > openIndex && idx < closeIndex;
    });
    if (insideCreateTable) continue;
    const owner = [...alterHeaders].reverse().find((h) => h.index < idx);
    if (owner) {
      // Only attribute if not a duplicate of a same-name constraint already recorded for this table.
      const already = expectations.some((e) => e.objectType === "constraint" && e.table === owner.table && e.name === cmatch[1]);
      if (!already) expectations.push({ migrationId, objectType: "constraint", table: owner.table, name: cmatch[1] });
    }
  }

  return expectations;
}
