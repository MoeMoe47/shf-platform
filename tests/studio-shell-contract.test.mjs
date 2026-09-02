import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routes = fs.readFileSync("src/router/CurriculumRoutes.jsx", "utf8");
const client = fs.readFileSync("src/lib/studio/api.js", "utf8");
const pages = fs.readFileSync("src/pages/studio/StudioNewProject.jsx", "utf8");
const home = fs.readFileSync("src/pages/studio/StudioHome.jsx", "utf8");

test("Studio student routes are separate from the curriculum admin tree", () => {
  assert.match(routes, /path="\/studio"/);
  assert.match(routes, /path="projects\/:projectId"/);
});

test("Studio API client exposes the durable Phase 2 actions", () => {
  assert.match(client, /\/studio\/projects/);
  assert.match(client, /\/studio\/handoffs\/assignment/);
  assert.match(client, /projectType, title/);
});

test("Studio exposes assignment progress through the instructor projection route", () => {
  assert.match(routes, /assignments\/:assignmentId\/progress/);
  assert.match(client, /getStudioAssignmentProgress/);
  assert.match(client, /studio\/assignments/);
});

test("student creation offers both canonical project types without client authority fields", () => {
  assert.match(pages, /value="WEBSITE"/);
  assert.match(pages, /value="AI_AGENT"/);
  assert.doesNotMatch(pages, /organization|tenant|destination|VERIFIED|completion/i);
});

test("Studio presentation does not expose ClientOps or sample project data", () => {
  assert.doesNotMatch(home, /ClientOps|sample|demo/i);
});
