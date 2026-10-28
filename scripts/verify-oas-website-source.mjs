import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const publication = "9fc98273119dd1ccb43078b56abb1de02071214f";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const original = path => execFileSync("git", ["show", `${publication}:${path}`], { cwd: root });
const files = [
  ["public/oas/catalogs/OAS-1@1.0.0.json", "public/oas/catalogs/OAS-1@1.0.0.json"],
  ["public/oas/OAS-1@1.0.0.md", "public/oas/OAS-1@1.0.0.md"],
  ["public/oas/currentness.json", "public/oas/currentness.json"],
  ["public/oas/declaration.schema.json", "schemas/oas/closure/declaration.schema.json"],
];
for (const [destination, source] of files) assert.deepEqual(readFileSync(new URL(`../${destination}`, import.meta.url)), original(source), `Frozen bytes changed: ${destination}`);
const catalogBytes = original(files[0][1]);
const catalog = JSON.parse(catalogBytes.toString());
assert.equal(hash(catalogBytes), "9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e");
const requirementsHash = hash(JSON.stringify(catalog.requirements, null, 2) + "\n");
assert.equal(requirementsHash, "37c09a8f92666b10d157d267e480296d9aa614c3299e10060aaa7b414ea50e5d");
const scopeHash = hash(original("standards/oas/closure/scope.json"));
assert.equal(scopeHash, "14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4");
assert.equal(catalog.scope_checksum, `sha256:${scopeHash}`);
assert.equal(catalog.requirements_checksum, `sha256:${requirementsHash}`);
assert.equal(catalog.release_id, "OAS-1@1.0.0");
assert.equal(catalog.requirements.length, 14);
assert.equal(catalog.domain_ids.length, 8);
assert.equal(catalog.declaration_contract_version, "1.1.0");
assert.equal(catalog.evaluation_status, "NOT_EVALUATED");
console.log(JSON.stringify({ publication, artifactHash: hash(catalogBytes), requirementsHash, scopeHash, files: files.map(([path]) => path), result: "PASS: exact published bytes and frozen identity" }, null, 2));
