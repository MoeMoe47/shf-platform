import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { careerToPathway } from "../src/shared/career/careerAdapter.js";

const pathwayHook = await readFile(new URL("../src/hooks/usePathways.js", import.meta.url), "utf8");
const planner = await readFile(new URL("../src/pages/CareerPlanner.jsx", import.meta.url), "utf8");
const pathwaysPage = await readFile(new URL("../src/pages/CareerPathways.jsx", import.meta.url), "utf8");
const pathwaysExplore = await readFile(new URL("../src/pages/PathwaysExplore.jsx", import.meta.url), "utf8");
const detailDrawer = await readFile(new URL("../src/components/PathwayDetailDrawer.jsx", import.meta.url), "utf8");
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
  assert.match(detailDrawer, /\/curriculum\.html#\/curriculum\/lessons\/\$\{encodeURIComponent\(requirement\.lesson_id\)\}/);
});

test("the Data Center lesson uses the canonical student lesson identity and grade band", () => {
  assert.equal(lesson.id, "data-center-foundations-introduction");
  assert.equal(lesson.slug, lesson.id);
  assert.equal(lesson.curriculum, "data-center-foundations");
  assert.deepEqual(lesson.gradeBand, { minGrade: 6, maxGrade: 8, stage: "DISCOVER" });
});
