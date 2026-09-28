import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const devOnlyHtml = ["foundation.html", "sales.html", "employer.html", "solutions.html"];

test("production HTML does not inject Vite development clients", () => {
  for (const filename of devOnlyHtml) {
    const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\/@vite\/client|\/@react-refresh/);
  }
});

test("built Capital dependency graph contains no unresolved Vite define token", () => {
  const dist = new URL("../dist/assets/", import.meta.url);
  assert.equal(existsSync(dist), true, "run npm run build before the production artifact check");
  const chunks = readdirSync(dist).filter((filename) => filename.endsWith(".js"));
  const unresolved = chunks.filter((filename) => readFileSync(join(dist.pathname, filename), "utf8").includes("__DEFINES__"));
  assert.deepEqual(unresolved, []);
});
