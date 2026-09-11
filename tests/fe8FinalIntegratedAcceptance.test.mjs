import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const agentPage = read("src/pages/admin/agent-fabric/AgentFabricPage.jsx");
const agentRoutes = read("src/router/AdminRoutes.jsx");
const agentStyles = read("src/pages/admin/agent-fabric/agent-fabric.css");
const universeEntry = read("src/entries/universe.main.jsx");
const indexEntry = read("src/entries/index.main.jsx");
const registry = read("src/pages/universe-v1/universeDestinationRegistry.js");
const adminSidebar = read("src/components/admin/AdminSidebar.jsx");
const hasProductionPath = (path) => registry.includes(`productionPath: '${path}'`);

test("Agent Fabric remains a protected, canonical governed control center", () => {
  assert.match(agentRoutes, /path="\/agent-fabric" element=\{protect\("\/agent-fabric"/);
  assert.match(agentRoutes, /AgentFabricPage/);
  assert.match(agentPage, /\/admin\/agents/);
  assert.match(agentPage, /\/admin\/agents\/verify/);
  assert.match(agentPage, /\/admin\/layers\/gate\/status/);
  assert.match(agentPage, /Human Approval/);
  assert.match(agentPage, /Disallowed Tasks/);
  assert.match(agentPage, /No agents returned/);
  assert.match(agentPage, /summaryValue/);
  assert.doesNotMatch(agentPage, /demo|fixture|sample data/i);
});

test("Agent Fabric preserves human, policy, audit, and WF-040 safety boundaries", () => {
  assert.match(agentPage, /cannot verify claims/i);
  assert.match(agentPage, /cannot public-approve data/i);
  assert.match(agentPage, /cannot override Oracle rulings/i);
  assert.match(agentPage, /Audit Trace/);
  assert.match(agentPage, /AI Guardrails/);
  assert.match(agentPage, /No tools/);
  assert.match(agentStyles, /prefers-reduced-motion/);
  assert.match(agentStyles, /focus-visible/);
  assert.match(agentStyles, /max-width: 560px/);
});

test("Universe has one canonical component and registry-backed cross-app destinations", () => {
  assert.match(indexEntry, /pages\/universe-v1\/UniverseApp\.jsx/);
  assert.match(universeEntry, /pages\/universe-v1\/UniverseApp\.jsx/);
  for (const route of [
    "/foundation.html#reports",
    "/solutions.html#/home",
    "/admin.html#/agent-fabric",
    "/curriculum.html#/dashboard",
    "/career.html#/",
    "/oas.html",
    "/index.html#/civicsure",
  ]) assert.equal(hasProductionPath(route), true, route);
  assert.match(registry, /export function resolveDestinationHref/);
  assert.match(registry, /export function needsHardNavigation/);
  assert.match(adminSidebar, /label: "Agent Fabric"/);
});

test("Canonical identity and destination boundaries remain explicit", () => {
  assert.match(agentRoutes, /SHS_SECURITY_PERMISSIONS\.AUDIT_VIEW/);
  assert.match(registry, /access: 'admin-only'/);
  assert.match(registry, /productionPath: '\/oas\.html'/);
  assert.match(agentRoutes, /path="\/release-assurance" element=\{protect\("\/release-assurance"/);
  assert.match(read("src/router/CurriculumRoutes.jsx"), /path="\/studio"/);
  assert.match(agentRoutes, /path="\/hub" element=\{protect\("\/hub"/);
  assert.equal(hasProductionPath("/index.html#/civicsure"), true);
  assert.equal(hasProductionPath("/civic.html#/dashboard"), false);
});
