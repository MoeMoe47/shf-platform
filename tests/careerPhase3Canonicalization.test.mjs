import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { careerToPathway } from "../src/shared/career/careerAdapter.js";

const pathwayHook = await readFile(new URL("../src/hooks/usePathways.js", import.meta.url), "utf8");
const planner = await readFile(new URL("../src/pages/CareerPlanner.jsx", import.meta.url), "utf8");
const pathwaysPage = await readFile(new URL("../src/pages/CareerPathways.jsx", import.meta.url), "utf8");
const pathwaysExplore = await readFile(new URL("../src/pages/PathwaysExplore.jsx", import.meta.url), "utf8");
const careerRoutes = await readFile(new URL("../src/router/CareerRoutes.jsx", import.meta.url), "utf8");
const detailDrawer = await readFile(new URL("../src/components/PathwayDetailDrawer.jsx", import.meta.url), "utf8");
const careerDetail = await readFile(new URL("../src/pages/career/CareerDetail.jsx", import.meta.url), "utf8");
const lesson = JSON.parse(await readFile(new URL("../src/content/lessons/data-center-foundations-student/data-center-foundations-introduction.json", import.meta.url), "utf8"));

test("canonical career adapter preserves API facts without inventing workforce metadata", () => {
  const result = careerToPathway({
    career_id: "career_data_center_technician",
    slug: "data-center-technician",
    title: "Data Center Technician",
    description: "Canonical description",
    career_family_id: "career_family_data_center_ai_infrastructure",
    family_name: "Data Center & AI Infrastructure",
  }, [{ lesson_id: lesson.id, requirement_type: "recommended", min_grade: 6, max_grade: 8, developmental_stage: "DISCOVER" }]);

  assert.deepEqual(result, {
    id: "career_data_center_technician",
    slug: "data-center-technician",
    title: "Data Center Technician",
    description: "Canonical description",
    cluster: "Data Center & AI Infrastructure",
    careerFamilyId: "career_family_data_center_ai_infrastructure",
    canonicalCareer: true,
    curriculumRequirements: [{ lesson_id: lesson.id, requirement_type: "recommended", min_grade: 6, max_grade: 8, developmental_stage: "DISCOVER" }],
    modules: [],
    jobsMeta: {},
    skills: [],
  });
});

test("active pathway consumers use the canonical API hook and have no static fallback import", () => {
  assert.match(pathwayHook, /listCareers/);
  assert.doesNotMatch(pathwayHook, /data\/pathways\.json/);
  assert.match(planner, /usePathways/);
  assert.match(pathwaysPage, /usePathways/);
  assert.match(pathwaysExplore, /useCanonicalCareers/);
  for (const source of [planner, pathwaysPage, pathwaysExplore]) {
    assert.doesNotMatch(source, /(?:import\s+.*from\s+|import\s*\()\s*["'][^"']*(?:pathways|career-pathways)\.json|(?:import\s+.*from\s+|import\s*\()\s*["'][^"']*data\/careers\.js/);
  }
  assert.doesNotMatch(careerRoutes, /@\/pages\/CareerPlanner\.jsx/);
  assert.match(careerRoutes, /import\("@\/pages\/CareerPathways\.jsx"\)/);
  assert.match(careerRoutes, /path="pathways" element=\{<PathwaysExplore \/>/);
  assert.match(careerRoutes, /path="career\/pathways" element=\{<Navigate to=\{CAREER_PATHWAYS\} replace \/>/);
  assert.match(detailDrawer, /\/curriculum\.html#\/curriculum\/lessons\/\$\{encodeURIComponent\(requirement\.lesson_id\)\}/);
});

test("the Data Center lesson uses the canonical student lesson identity and grade band", () => {
  assert.equal(lesson.id, "data-center-foundations-introduction");
  assert.equal(lesson.slug, lesson.id);
  assert.equal(lesson.curriculum, "data-center-foundations");
  assert.deepEqual(lesson.gradeBand, { minGrade: 6, maxGrade: 8, stage: "DISCOVER" });
});

test("public Career Detail uses canonical API data and does not invent unavailable domains", () => {
  assert.match(careerRoutes, /path="careers\/:careerSlug" element=\{<CareerDetail \/>\}/);
  assert.match(careerRoutes, /import\("@\/pages\/career\/CareerDetail\.jsx"\)/);
  assert.match(careerDetail, /getCareer\(careerSlug\)/);
  assert.match(careerDetail, /getCareerCurriculum\(careerSlug\)/);
  assert.match(careerDetail, /Public skill relationships are not published/);
  assert.match(careerDetail, /No public pathway connection is available/);
  assert.match(careerDetail, /Public opportunity, wage, demand, employer, and regional workforce data are not available/);
  assert.doesNotMatch(careerDetail, /median|salary|projected growth|employer count|readiness score/i);
});

test("Phase 4 public pathway and discovery routes remain separate from personal planning", async () => {
  const routes = await readFile(new URL("../src/router/CareerRoutes.jsx", import.meta.url), "utf8");
  const pathwayDetail = await readFile(new URL("../src/pages/career/PathwayDetail.jsx", import.meta.url), "utf8");
  const discovery = await readFile(new URL("../src/pages/career/CareerDiscovery.jsx", import.meta.url), "utf8");
  const sidebar = await readFile(new URL("../src/components/career/CareerSidebar.jsx", import.meta.url), "utf8");
  assert.match(routes, /path="pathways\/:pathwaySlug" element=\{<PathwayDetail \/>\}/);
  assert.match(routes, /path="discovery" element=\{<CareerDiscovery \/>\}/);
  assert.match(pathwayDetail, /getCareer\(pathwaySlug\)/);
  assert.match(pathwayDetail, /Program relationship/);
  assert.match(pathwayDetail, /Public organization program mappings are not available/);
  assert.match(discovery, /not a psychological, aptitude, or validated career assessment/i);
  assert.match(discovery, /View Career Detail/);
  assert.match(discovery, /Continue in My Career Planner/);
  assert.doesNotMatch(discovery, /highest_placement|placement|salary|wage|demand|employer/i);
  assert.match(sidebar, /label: "Career Discovery"/);
});
