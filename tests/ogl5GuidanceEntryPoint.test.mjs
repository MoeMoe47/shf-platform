import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/system/guidance/OglGuidanceEntryPoint.jsx", import.meta.url), "utf8");
const curriculum = readFileSync(new URL("../src/entries/curriculum.main.jsx", import.meta.url), "utf8");
const civic = readFileSync(new URL("../src/entries/civic.main.jsx", import.meta.url), "utf8");

test("OGL-5 mounts only active canonical contract entry points", () => {
  assert.match(source, /orientation:curriculum:student-dashboard/);
  assert.match(source, /orientation:curriculum:instructor-operations/);
  assert.match(source, /orientation:civicsure:operator/);
  assert.match(source, /orientation:civicsure:provider/);
  assert.match(source, /config \? <GuidanceCenter/);
  assert.match(source, /server-resolvable contracts/);
  assert.doesNotMatch(source, /career-learner/);
});

test("Curriculum and CivicSure mount the shared Guidance Center inside their routers", () => {
  for (const entry of [curriculum, civic]) {
    assert.match(entry, /OglGuidanceEntryPoint/);
    assert.match(entry, /<HashRouter>[\s\S]*<OglGuidanceEntryPoint/);
  }
});
