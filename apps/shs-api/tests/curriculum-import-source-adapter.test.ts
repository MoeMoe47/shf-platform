import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readStructuredSource } from "../src/domain/curriculum-catalog/service/curriculum-import-source-adapter.ts";

const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src/content/lessons");
function countSourceFiles(prefix: string) {
  return fs.readdirSync(contentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${prefix}-`) && entry.name.endsWith("-student"))
    .reduce((total, entry) => total + fs.readdirSync(path.join(contentRoot, entry.name)).filter((name) => name.endsWith(".json")).length, 0);
}

test("real ASL source preserves every lesson exactly once across deterministic units", () => {
  const first = readStructuredSource("asl");
  const second = readStructuredSource("asl");
  const lessons = first.units.flatMap((unit) => unit.lessons);
  assert.equal(lessons.length, countSourceFiles("asl"));
  assert.equal(first.units.length, 11);
  assert.deepEqual(first, second);
  assert.equal(new Set(lessons.map((lesson) => lesson.stableKey)).size, lessons.length);
  assert.ok(lessons.every((lesson) => lesson.sourceReference && lesson.sourceHash && lesson.raw));
});

test("real Data Center source remains multi-unit and preserves full lesson payload", () => {
  const source = readStructuredSource("data-center");
  const lessons = source.units.flatMap((unit) => unit.lessons);
  assert.equal(lessons.length, countSourceFiles("data-center"));
  assert.equal(source.units.length, 12);
  assert.ok(source.units.length > 1);
  assert.equal(source.units.filter((unit) => unit.stableKey.endsWith("-12")).length, 6);
  assert.equal(new Set(lessons.map((lesson) => lesson.stableKey)).size, lessons.length);
  assert.ok(lessons.some((lesson) => "practice" in lesson.raw));
  assert.ok(lessons.some((lesson) => "reflectionPrompt" in lesson.raw));
  assert.ok(lessons.every((lesson) => lesson.sourceReference && lesson.sourceHash && lesson.raw));
});
