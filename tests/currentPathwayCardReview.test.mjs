import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const card = fs.readFileSync(new URL("../src/pages/curriculum/sections/CurrentPathwayCard.jsx", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumDashboard.jsx", import.meta.url), "utf8");

test("CurrentPathwayCard is mounted on the curriculum dashboard", () => {
  assert.match(dashboard, /import CurrentPathwayCard from "\.\/sections\/CurrentPathwayCard\.jsx"/);
  assert.match(dashboard, /<CurrentPathwayCard \/>/);
});

test("pathway percentage is an isolated static demo value with no metric formula", () => {
  assert.match(card, /percentComplete: 68/);
  assert.match(card, /Math\.max\(0, Math\.min\(100, CURRENT_PATHWAY\.percentComplete\)\)/);
  assert.doesNotMatch(card, /\b(?:window\.)?localStorage\s*\./);
  assert.doesNotMatch(card, /\bprogressClient\s*\./);
  assert.equal(card.includes("curriculum.lesson.completion_count.v1"), false);
  assert.equal(card.includes("\.length"), false);
  assert.equal(card.includes("reduce("), false);
  assert.doesNotMatch(card, /percentComplete\s*\/|\/\s*percentComplete/);
});

test("pathway percentage has no authoritative numerator or denominator", () => {
  assert.match(card, /no connected[\s\S]+pathway-progress source/);
  assert.equal(card.includes("completedItems"), false);
  assert.equal(card.includes("totalItems"), false);
  assert.equal(card.includes("denominator"), false);
});
