import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const entry = readFileSync("src/entries/index.main.jsx", "utf8");
const app = readFileSync("src/pages/civicsure/CivicSureApp.jsx", "utf8");
const css = readFileSync("src/styles/civicSureCanonical.css", "utf8");
const registry = readFileSync("src/pages/universe-v1/universeDestinationRegistry.js", "utf8");

test("CivicSure has one root canonical route with audience sections", () => {
  assert.ok(entry.includes('routePath === "/civicsure"'));
  assert.match(entry, /CivicSureApp/);
  assert.ok(app.includes('/civicsure/operator'));
  assert.ok(app.includes('/civicsure/provider'));
  assert.ok(app.includes('/civicsure/public'));
});

test("CivicSure provider and public surfaces do not use fixture fallback", () => {
  assert.match(app, /public\/assurance\/projections/);
  assert.match(app, /government-assurance\/provider-workspace/);
  assert.match(app, /Provider workspace unavailable/);
  assert.doesNotMatch(app, /mock|fixture|demo data/i);
});

test("CivicSure preserves responsive and accessible structural contracts", () => {
  assert.match(css, /max-width: 48rem/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.match(app, /role="status"/);
  assert.match(app, /role="alert"/);
});

test("CivicSure keeps prior canonical destinations intact", () => {
  assert.match(entry, /GovernmentAssurance/);
  assert.match(entry, /operator\/government-assurance/);
  assert.match(registry, /productionPath: '\/index\.html#\/civicsure'/);
  assert.doesNotMatch(registry, /productionPath: '\/civic\.html#\/dashboard'/);
});
