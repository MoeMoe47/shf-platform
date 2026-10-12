import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../src/pages/career/Portfolio.jsx", import.meta.url), "utf8");
const livePage = page.replace(/const PREVIEW_PROJECTS[\s\S]*function PortfolioLive\(\) \{/, "function PortfolioLive() {");
const client = await readFile(new URL("../src/lib/portfolio/api.js", import.meta.url), "utf8");
const bridge = await readFile(new URL("../src/pages/studio/StudioInstitutionalStatus.jsx", import.meta.url), "utf8");
const avatar = await readFile(new URL("../src/pages/career/portfolio-sections/AvatarUploader.jsx", import.meta.url), "utf8");
const about = await readFile(new URL("../src/pages/career/portfolio-sections/StudentAbout.jsx", import.meta.url), "utf8");
const careerLayout = await readFile(new URL("../src/layouts/CareerLayout.jsx", import.meta.url), "utf8");
const curriculumLayout = await readFile(new URL("../src/layouts/CurriculumLayout.jsx", import.meta.url), "utf8");
const shellLayout = await readFile(new URL("../src/layouts/AppShellLayout.jsx", import.meta.url), "utf8");
const portfolioRoutes = await readFile(new URL("../apps/shs-api/src/domain/portfolio/api/routes.ts", import.meta.url), "utf8");
const portfolioService = await readFile(new URL("../apps/shs-api/src/domain/portfolio/service/portfolio-service.ts", import.meta.url), "utf8");
const securityPermissions = await readFile(new URL("../apps/shs-api/src/auth/security-permissions.ts", import.meta.url), "utf8");

test("Portfolio page uses the durable authenticated API and not browser storage", () => {
  assert.match(page, /getPortfolio\(role\)/);
  assert.match(page, /updatePortfolioArtifact/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.match(page, /PortfolioHeader/);
  assert.match(page, /StudentProfileHero/);
  assert.match(page, /AvatarUploader/);
  assert.match(page, /What You Proved/);
  assert.match(page, /Private/);
  assert.match(page, /Visible to My Organization/);
  assert.doesNotMatch(page, /PUBLIC|UNLISTED/);
});

test("Portfolio relies on canonical app-shell branding and SHF footer", () => {
  assert.match(shellLayout, /brandMark/);
  assert.match(careerLayout, /HeartMark/);
  assert.match(careerLayout, /usePortfolioBrand/);
  assert.match(careerLayout, /SHFFooter/);
  assert.match(careerLayout, /variant="career"/);
  assert.match(curriculumLayout, /SHFFooter/);
  assert.match(curriculumLayout, /variant="curriculum"/);
  assert.doesNotMatch(page, /FoundationFooter|SHFFooter|shf-globe-logo/);
});

test("Portfolio read access uses Portfolio permissions, not broad Studio view", () => {
  assert.match(securityPermissions, /PORTFOLIO_VIEW: "portfolio\.view"/);
  assert.match(securityPermissions, /PORTFOLIO_UPDATE: "portfolio\.update"/);
  assert.match(portfolioRoutes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.PORTFOLIO_VIEW\)/);
  assert.match(portfolioRoutes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.PORTFOLIO_UPDATE\)/);
  assert.match(portfolioService, /SHS_SECURITY_PERMISSIONS\.PORTFOLIO_VIEW/);
  assert.match(portfolioService, /SHS_SECURITY_PERMISSIONS\.PORTFOLIO_UPDATE/);
  assert.doesNotMatch(portfolioRoutes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.STUDIO_PROJECT_VIEW\)/);
  assert.doesNotMatch(portfolioRoutes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.STUDIO_PROJECT_UPDATE\)/);
});

test("Portfolio payload wires identity, pathway, and Curriculum progress as read-only projections", () => {
  assert.match(portfolioService, /studentProfileFromActor/);
  assert.match(portfolioService, /deriveLearnerPathway/);
  assert.match(portfolioService, /listMyCourses/);
  assert.match(portfolioService, /learningProgressFromCourses/);
  assert.match(portfolioService, /sourceAvailability/);
  assert.match(page, /studentProfile/);
  assert.match(page, /learningProgress/);
  assert.match(page, /studentName/);
  assert.doesNotMatch(portfolioService, /INSERT INTO (curriculum|learner|credential|truth)|UPDATE (curriculum|learner|credential|truth)/i);
});

test("Student-authored profile presentation uses Portfolio authority and stays non-authoritative", () => {
  assert.match(client, /\/portfolio\/profile/);
  assert.match(client, /updatePortfolioProfile/);
  assert.match(portfolioRoutes, /\/portfolio\/profile/);
  assert.match(portfolioService, /updateProfilePresentation/);
  assert.match(portfolioService, /about_text/);
  assert.match(portfolioService, /avatar_reference/);
  assert.match(about, /not a verified institutional record/);
  assert.match(avatar, /not verified evidence, mastery, or a credential/);
  assert.doesNotMatch(about, /localStorage|sessionStorage/);
  assert.doesNotMatch(avatar, /localStorage|sessionStorage/);
});

test("restored student Portfolio does not present fabricated learner facts", () => {
  assert.doesNotMatch(livePage, /RecentAchievements/);
  assert.doesNotMatch(livePage, /ProfileStrength/);
  assert.doesNotMatch(livePage, /AI Career Coach|Responsive Community Website/);
  assert.doesNotMatch(livePage, /career readiness percentage|pathway complete|Day streak|\d+%/i);
  assert.match(page, /import\.meta\.env\.DEV/);
  assert.match(page, /Design Preview.*Sample Data/i);
});

test("Avatar upload remains device-local and non-authoritative", () => {
  assert.match(avatar, /onSave/);
  assert.match(avatar, /not verified evidence, mastery, or a credential/);
  assert.doesNotMatch(avatar, /localStorage|sessionStorage/);
  assert.doesNotMatch(avatar, /curriculum_learner|learner_competency|prepare_prove/i);
});

test("Portfolio client sends only supported presentation fields", () => {
  assert.match(client, /\/portfolio\/artifacts\/from-evidence/);
  assert.match(client, /evidenceId/);
  assert.match(client, /thumbnailRef/);
  assert.doesNotMatch(client, /learnerId.*organizationId.*tenantId/s);
});

test("Studio proof bridge exposes Add to Portfolio as an explicit action", () => {
  assert.match(bridge, /createPortfolioArtifactFromEvidence/);
  assert.match(bridge, /Add to Portfolio/);
  assert.match(bridge, /Already in/);
  assert.match(bridge, /\/curriculum\/asl\/portfolio/);
});
