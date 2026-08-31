import test from "node:test";
import assert from "node:assert/strict";
import { parseMigrationExpectations } from "../src/db/migration-expectation-parser.ts";

function find(expectations: ReturnType<typeof parseMigrationExpectations>, objectType: string, table: string, name: string) {
  return expectations.find((e) => e.objectType === objectType && e.table === table && e.name === name);
}

test("extracts table, columns, and primary key from a simple CREATE TABLE", () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS widgets (
      widget_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  const exp = parseMigrationExpectations("999", sql);
  assert.ok(find(exp, "table", "widgets", "widgets"));
  assert.ok(find(exp, "column", "widgets", "widget_id"));
  assert.ok(find(exp, "column", "widgets", "name"));
  assert.ok(find(exp, "column", "widgets", "created_at"));
  assert.ok(find(exp, "primary_key", "widgets", "widgets_pkey"));
});

test("attributes multiple ADD COLUMN clauses in one ALTER TABLE statement to the same table", () => {
  const sql = `
    ALTER TABLE programs
      ADD COLUMN IF NOT EXISTS program_classification TEXT,
      ADD COLUMN IF NOT EXISTS owner_organization_id TEXT REFERENCES organizations(organization_id);
  `;
  const exp = parseMigrationExpectations("999", sql);
  assert.ok(find(exp, "column", "programs", "program_classification"));
  assert.ok(find(exp, "column", "programs", "owner_organization_id"));
});

test("attributes a named CONSTRAINT inside a DO $$ guard block to the correct table", () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS organization_relationships (
      relationship_id TEXT PRIMARY KEY,
      status TEXT NOT NULL
    );
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'organization_relationship_no_active_overlap'
      ) THEN
        ALTER TABLE organization_relationships
          ADD CONSTRAINT organization_relationship_no_active_overlap
          EXCLUDE USING gist (status WITH =);
      END IF;
    END $$;
  `;
  const exp = parseMigrationExpectations("999", sql);
  assert.ok(find(exp, "constraint", "organization_relationships", "organization_relationship_no_active_overlap"));
  // The literal word "pg_constraint" must never be mistaken for the CONSTRAINT keyword.
  assert.ok(!exp.some((e) => e.name === "WHERE"));
});

test("never captures DROP CONSTRAINT IF EXISTS noise tokens as constraint names", () => {
  const sql = `
    ALTER TABLE widgets
      DROP CONSTRAINT IF EXISTS widgets_status_check;
    ALTER TABLE widgets
      ADD CONSTRAINT widgets_status_check CHECK (status IN ('a', 'b'));
  `;
  const exp = parseMigrationExpectations("999", sql);
  assert.ok(find(exp, "constraint", "widgets", "widgets_status_check"));
  assert.ok(!exp.some((e) => e.name === "IF" || e.name === "EXISTS"));
});

test("strips line comments so commented text is never parsed as a column", () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS opportunities (
      opportunity_id TEXT PRIMARY KEY,
      -- Deadlines are calendar dates, not moments in time
      application_deadline DATE NOT NULL
    );
  `;
  const exp = parseMigrationExpectations("999", sql);
  assert.ok(find(exp, "column", "opportunities", "application_deadline"));
  assert.ok(!exp.some((e) => e.name === "--" || e.name === "Deadlines"));
});

test("extracts CREATE EXTENSION and CREATE INDEX", () => {
  const sql = `
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    CREATE UNIQUE INDEX IF NOT EXISTS widgets_name_idx ON widgets(name);
  `;
  const exp = parseMigrationExpectations("999", sql);
  assert.ok(find(exp, "extension", "", "btree_gist"));
  assert.ok(find(exp, "index", "widgets", "widgets_name_idx"));
});

test("handles nested parens in column types without corrupting column splitting", () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS amounts (
      amount_id TEXT PRIMARY KEY,
      value NUMERIC(10,2) NOT NULL,
      label TEXT
    );
  `;
  const exp = parseMigrationExpectations("999", sql);
  assert.ok(find(exp, "column", "amounts", "value"));
  assert.ok(find(exp, "column", "amounts", "label"));
});
