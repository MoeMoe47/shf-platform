import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const viteConfig = read("vite.config.js");

const expectedEntries = {
  "/foundation.html": "/src/entries/foundation.main.jsx",
  "/solutions.html": "/src/entries/solutions.main.jsx",
  "/admin.html": "/src/entries/admin.main.jsx",
  "/curriculum.html": "/src/entries/curriculum.main.jsx",
  "/career.html": "/src/entries/career.main.jsx",
  "/arcade.html": "/src/entries/arcade.main.jsx",
  "/catalog.html": "/src/entries/catalog.main.jsx",
  "/oas.html": "/src/entries/oas.main.jsx",
  "/universe.html": "/src/entries/universe.main.jsx",
  "/civic.html": "/src/entries/civic.main.jsx",
};

test("root ecosystem HTML destinations mount distinct intended entries", () => {
  const seenEntries = new Set();

  for (const [htmlPath, entry] of Object.entries(expectedEntries)) {
    const html = read(htmlPath.slice(1));
    assert.match(html, new RegExp(`src=["']${entry.replaceAll(".", "\\.")}["']`), htmlPath);
    assert.ok(viteConfig.includes(`path.resolve(__dirname, "${htmlPath.slice(1)}")`), `${htmlPath} is absent from root Vite inputs`);
    assert.equal(seenEntries.has(entry), false, `${entry} is reused by unrelated root applications`);
    seenEntries.add(entry);
  }
});

test("critical hash-route applications keep their own router entry", () => {
  assert.match(read("src/entries/admin.main.jsx"), /AdminRoutes/);
  assert.match(read("src/entries/curriculum.main.jsx"), /CurriculumRoutes/);
  assert.match(read("src/entries/oas.main.jsx"), /OASLandingPage/);
  assert.match(read("src/entries/universe.main.jsx"), /UniverseApp/);
  assert.match(read("src/pages/universe-v1/universeDestinationRegistry.js"), /productionPath: '\/oas\.html'/);
});
