import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";

const productionRoots = [resolve("src"), resolve("apps/shf-web/src"), resolve("apps/shs-api/src")];

function sourceFiles(root) {
  if (!statExists(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(path));
    else if (/\.(js|jsx|ts|tsx|json)$/.test(entry.name)) files.push(path);
  }
  return files;
}

function statExists(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

test("SEA-4 evidence fixtures are absent from production source roots", () => {
  const fixtureReferences = productionRoots
    .flatMap(sourceFiles)
    .filter((path) => /sea4_(?:provider|workspace|phase8)|sea4-dedicated/i.test(readFileSync(path, "utf8")))
    .map((path) => path.replace(`${process.cwd()}/`, ""));
  assert.deepEqual(fixtureReferences, []);
});

test("SEA-4 evidence harness owns its disposable fixture data", () => {
  const harness = readFileSync(resolve("tests/sea4-final-evidence-harness.spec.mjs"), "utf8");
  assert.match(harness, /sea4-dedicated/);
  assert.match(harness, /testOnly/);
  assert.match(harness, /phase8_project_a/);
});
