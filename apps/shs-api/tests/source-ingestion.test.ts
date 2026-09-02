import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LocalPrivateSourceStorage } from "../src/domain/source-ingestion/storage/source-storage.js";
import { SourceValidationError, validateSourceFile } from "../src/domain/source-ingestion/service/source-validation.js";
import { getAsset } from "../src/domain/source-ingestion/repo/source-repo.js";
import { registerSourceIngestionRoutes } from "../src/domain/source-ingestion/api/routes.js";

const file = (name: string, mimetype: string, content: Buffer) => ({ originalname: name, mimetype, size: content.length, buffer: content });

test("accepts validated PDF, DOCX, TXT, and Markdown source files", () => {
  assert.equal(validateSourceFile(file("book.pdf", "application/pdf", Buffer.from("%PDF-1.7\n"))).type, "PDF");
  assert.equal(validateSourceFile(file("book.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", Buffer.from("PK\x03\x04docx"))).type, "DOCX");
  assert.equal(validateSourceFile(file("notes.txt", "text/plain", Buffer.from("notes"))).type, "TXT");
  assert.equal(validateSourceFile(file("notes.md", "text/markdown", Buffer.from("# notes"))).type, "MARKDOWN");
});

test("rejects unsupported, mismatched, unsafe, empty, and oversized files", () => {
  for (const input of [
    file("run.exe", "application/octet-stream", Buffer.from("MZ")),
    file("book.pdf", "text/plain", Buffer.from("not a pdf")),
    file("../book.pdf", "application/pdf", Buffer.from("%PDF-1.7")),
    file("book.pdf", "application/pdf", Buffer.alloc(0)),
  ]) assert.throws(() => validateSourceFile(input), SourceValidationError);
  assert.throws(() => validateSourceFile(file("book.pdf", "application/pdf", Buffer.alloc(25 * 1024 * 1024 + 1))), SourceValidationError);
});

test("private local storage uses generated keys and rejects traversal", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shf-source-test-"));
  const storage = new LocalPrivateSourceStorage(root);
  await storage.put("source-assets/test-id", Buffer.from("private"));
  assert.equal((await storage.get("source-assets/test-id")).toString(), "private");
  await assert.rejects(() => storage.get("../outside"));
  await storage.remove("source-assets/test-id");
});

test("migration defines tenant-scoped immutable source and document boundaries", async () => {
  const migration = await readFile(new URL("../migrations/058_source_assets_documents.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS source_assets/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS source_document_versions/);
  assert.match(migration, /source_assets_org_hash_unique/);
  assert.match(migration, /source_document_versions_asset_same_org_fk/);
  assert.match(migration, /visibility = 'PRIVATE'/);
  assert.match(migration, /scan_status IN \('PENDING', 'CLEAN', 'REJECTED', 'UNAVAILABLE'\)/);
  assert.match(migration, /content_hash TEXT NOT NULL/);
});

test("metadata reads are organization-scoped and the upload route fails closed", async () => {
  let queryParams: unknown[] = [];
  await getAsset("org-a", "asset-b", { query: async (_sql: string, params: unknown[]) => { queryParams = params; return { rows: [] }; } });
  assert.deepEqual(queryParams, ["org-a", "asset-b"]);

  const routes: Record<string, any[]> = {};
  const app = { post: (path: string, ...middleware: any[]) => { routes[`POST ${path}`] = middleware; }, get: (path: string, ...middleware: any[]) => { routes[`GET ${path}`] = middleware; } };
  registerSourceIngestionRoutes(app);
  const response: any = { statusCode: 200, body: null, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  routes["POST /curriculum/source-assets"][0]({ headers: {} }, response, () => undefined);
  assert.equal(response.statusCode, 401);
  const forbidden: any = { statusCode: 200, status(code: number) { this.statusCode = code; return this; }, json() { return this; } };
  routes["POST /curriculum/source-assets"][1]({ user: { active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions: [] } }, forbidden, () => undefined);
  assert.equal(forbidden.statusCode, 403);
});
