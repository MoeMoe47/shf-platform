import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumDashboard.jsx", import.meta.url), "utf8");
const progressCard = fs.readFileSync(new URL("../src/pages/curriculum/sections/LearningProgressCard.jsx", import.meta.url), "utf8");
const weeklyCard = fs.readFileSync(new URL("../src/pages/curriculum/sections/WeeklySummaryCard.jsx", import.meta.url), "utf8");
const streakEngine = fs.readFileSync(new URL("../src/shared/engagement/streaks.js", import.meta.url), "utf8");

test("dashboard mounts both curriculum Streak renderings", () => {
  assert.match(dashboard, /LearningProgressCard/);
  assert.match(dashboard, /WeeklySummaryCard/);
  assert.match(progressCard, /Day streak/);
  assert.match(weeklyCard, /Streak/);
});

test("dashboard Streak values are static/mock and do not use the local streak engine", () => {
  assert.match(progressCard, /streakDays: 12/);
  assert.match(weeklyCard, /readMock\("__mockStreakDays", 12\)/);
  assert.doesNotMatch(progressCard, /shared\/engagement\/streaks/);
  assert.doesNotMatch(weeklyCard, /shared\/engagement\/streaks/);
});

test("the separate streak engine is browser-local and based on local calendar days", () => {
  assert.match(streakEngine, /localStorage\.getItem/);
  assert.match(streakEngine, /localStorage\.setItem/);
  assert.match(streakEngine, /startOfLocalDay/);
  assert.match(streakEngine, /diffDays === 1/);
  assert.match(streakEngine, /else next = 1/);
  assert.doesNotMatch(streakEngine, /fetch\(/);
});
