import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = await readFile(new URL("../src/router/paths.js", import.meta.url), "utf8");
const careerRoutes = await readFile(new URL("../src/router/CareerRoutes.jsx", import.meta.url), "utf8");
const sidebar = await readFile(new URL("../src/components/career/CareerSidebar.jsx", import.meta.url), "utf8");
const footer = await readFile(new URL("../src/components/shared/SHFFooter.jsx", import.meta.url), "utf8");
const appsRegistry = await readFile(new URL("../src/data/apps.registry.js", import.meta.url), "utf8");
const universeRegistry = await readFile(new URL("../src/pages/universe-v1/universeDestinationRegistry.js", import.meta.url), "utf8");
const aiScore = await readFile(new URL("../src/components/ai-compass/AIScoreModal.jsx", import.meta.url), "utf8");
const aiDrawer = await readFile(new URL("../src/components/ai-compass/Drawer.jsx", import.meta.url), "utf8");
const foundationFiles = await Promise.all([
  "../src/foundation/pages/Mission.jsx",
  "../src/pages/foundation/About.jsx",
  "../src/pages/foundation/Top.jsx",
  "../src/foundation/pages/FoundationMissionPage.jsx",
  "../src/pages/solutions/SHSRequestDemoPage.jsx",
].map((p) => readFile(new URL(p, import.meta.url), "utf8")));
const dashboard = await readFile(new URL("../src/pages/career/CareerDashboard.jsx", import.meta.url), "utf8");
const northstar = await readFile(new URL("../src/pages/career/CareerDashboardNorthstar.jsx", import.meta.url), "utf8");
const portfolio = await readFile(new URL("../src/pages/career/Portfolio.jsx", import.meta.url), "utf8");
const credentials = await readFile(new URL("../src/pages/career/portfolio-sections/CredentialsBadges.jsx", import.meta.url), "utf8");
const opportunitiesApi = await readFile(new URL("../apps/shs-api/src/domain/opportunities/api/routes.ts", import.meta.url), "utf8");
const opportunitiesMigration = await readFile(new URL("../apps/shs-api/migrations/046_career_events_opportunities_foundation.sql", import.meta.url), "utf8");

test("Career Center has one public hash-host route contract and preserves the personal dashboard", () => {
  assert.match(paths, /host:\s*"\/career\.html#"/);
  assert.match(paths, /CAREER_HOME\s+=\s*"\/"/);
  assert.match(paths, /CAREER_DASHBOARD\s+=\s*"\/dashboard"/);
  assert.match(paths, /CAREER_PATHWAYS\s+=\s*"\/pathways"/);
  assert.match(careerRoutes, /<Route index element=\{<CareerHomePlaceholder \/>/);
  assert.match(careerRoutes, /<Route path="dashboard" element=\{<CareerDashboard \/>/);
  assert.match(careerRoutes, /<Route path="\*" element=\{<Navigate to=\{CAREER_HOME\} replace \/>/);
});

test("public registries and Foundation Career links resolve to the public Career entry", () => {
  assert.match(appsRegistry, /href:\s*"\/career\.html#\/"/);
  assert.match(universeRegistry, /productionPath:\s+'\/career\.html#\/'/);
  for (const source of foundationFiles) {
    assert.doesNotMatch(source, /#\/careers\b/);
    assert.match(source, /\/career\.html#\//);
  }
  assert.match(footer, /href\.career\("\/"\)/);
});

test("AI mock surfaces do not point to broken Career hashes or present scoring as production", () => {
  assert.doesNotMatch(aiScore, /href="#\/career"/);
  assert.doesNotMatch(aiDrawer, /href="#\/career"/);
  assert.match(aiScore, /Demo AI Score/);
  assert.match(aiScore, /Not a validated career assessment/);
  assert.match(aiScore, /href\.career\("\/planner"\)/);
  assert.match(aiDrawer, /href\.career\("\/"\)/);
});

test("public and personal Career navigation are distinguishable", () => {
  assert.match(sidebar, /PUBLIC_ITEMS/);
  assert.match(sidebar, /Section title="PUBLIC CAREER"/);
  assert.match(sidebar, /Section title="MY CAREER"/);
  assert.match(sidebar, /label: "Career Home"/);
  assert.match(sidebar, /label: "My Career Center"/);
  assert.match(sidebar, /My Career Planner/);
});

test("planner and pathway responsibilities are separated at the active route layer", () => {
  assert.match(careerRoutes, /const CareerPlanner = lazy\(\(\) => import\("@\/pages\/CareerPathways\.jsx"\)\)/);
  assert.match(careerRoutes, /path="planner" element=\{<CareerPlanner \/>/);
  assert.match(careerRoutes, /path="pathways" element=\{<PathwaysExplore \/>/);
  assert.match(careerRoutes, /path="career\/pathways" element=\{<Navigate to=\{CAREER_PATHWAYS\} replace \/>/);
  assert.doesNotMatch(careerRoutes, /@\/pages\/CareerPlanner\.jsx/);
});

test("demo claims are quarantined without creating duplicate authorities", () => {
  assert.doesNotMatch(dashboard, /Portfolio items:\s*<strong>5<\/strong>/);
  assert.match(dashboard, /Portfolio: <a href="\/career\.html#\/portfolio">View artifacts and credentials<\/a>/);
  assert.match(northstar, /Demo-only seed snapshot/);
  assert.match(northstar, /not a production readiness, placement, or outcome record/);
  assert.match(portfolio, /getPortfolio/);
  assert.match(portfolio, /CredentialsBadges/);
  assert.match(credentials, /listMyCredentials/);
});

test("opportunity and employer authorities remain backend-owned and are not duplicated in Career Phase 1", () => {
  assert.match(opportunitiesApi, /app\.get\("\/opportunities"/);
  assert.match(opportunitiesApi, /requirePermission\(SHS_SECURITY_PERMISSIONS\.OPPORTUNITY_VIEW\)/);
  assert.match(opportunitiesMigration, /reuse the existing `organizations` table/);
  assert.doesNotMatch(paths + careerRoutes + sidebar, /career_employers|CareerEmployer|careerEmployers/);
});
