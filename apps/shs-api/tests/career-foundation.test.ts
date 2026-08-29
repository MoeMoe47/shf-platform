import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validateGradeBand } from "../src/domain/careers/model/career.ts";
import { CareerService } from "../src/domain/careers/service/career-service.ts";

const migration = await readFile(new URL("../migrations/033_career_workforce_foundation.sql", import.meta.url), "utf8");
const lesson = JSON.parse(await readFile(new URL("../../../src/content/lessons/data-center-foundations-student/data-center-foundations-introduction.json", import.meta.url), "utf8"));

test("career foundation migration owns one minimal Data Center proof record", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS career_families/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS careers/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS career_curriculum_requirements/);
  assert.match(migration, /career_data_center_technician/);
  assert.match(migration, /data-center-ai-infrastructure/);
  assert.match(migration, /min_grade, max_grade, developmental_stage/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS employers/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS participants/);
});

test("grade bands accept only grade 6 through 12 ordered ranges", () => {
  assert.deepEqual(validateGradeBand({ min_grade: 6, max_grade: 8, developmental_stage: "DISCOVER" }), {
    min_grade: 6, max_grade: 8, developmental_stage: "DISCOVER",
  });
  assert.throws(() => validateGradeBand({ min_grade: 8, max_grade: 6, developmental_stage: "DISCOVER" }), /invalid_grade_band/);
  assert.throws(() => validateGradeBand({ min_grade: 5, max_grade: 8, developmental_stage: "DISCOVER" }), /invalid_grade_band/);
  assert.throws(() => validateGradeBand({ min_grade: 6, max_grade: 8, developmental_stage: "UNKNOWN" as any }), /invalid_developmental_stage/);
});

test("career service exposes canonical career and curriculum references without copying lesson content", async () => {
  const repo = {
    async getBySlug(slug: string) {
      return slug === "data-center-technician" ? { career_id: "career_data_center_technician", slug, status: "active" } : null;
    },
    async listCurriculumRequirements() {
      return [{ curriculum_id: "data-center-foundations", lesson_id: "data-center-foundations-introduction", requirement_type: "recommended", min_grade: 6, max_grade: 8, developmental_stage: "DISCOVER" }];
    },
    async listActive() { return []; },
  };
  const result = await new CareerService(repo as any).getCurriculumRequirements("data-center-technician");
  assert.equal(result?.career.career_id, "career_data_center_technician");
  assert.equal(result?.requirements[0].lesson_content, undefined);
  assert.equal(result?.requirements[0].min_grade, 6);
});

test("the proof requirement resolves to a real student lesson identity", () => {
  assert.equal(lesson.slug, "data-center-foundations-introduction");
  assert.equal(lesson.curriculum, "data-center-foundations");
  assert.deepEqual(lesson.gradeBand, { minGrade: 6, maxGrade: 8, stage: "DISCOVER" });
  assert.match(lesson.title, /What Is a Data Center/);
  assert.equal(lesson.objectives.length, 4);
  assert.equal(lesson.quiz.answer, "Networking, electricity, cooling, or security");
});
