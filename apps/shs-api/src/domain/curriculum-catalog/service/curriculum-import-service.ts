// SHF Lesson + Assignment + Curriculum Ingestion — Phase 2 (Steps 20-22).
//
// Reads the existing static student lesson JSON (src/content/lessons/
// *-student/*.json — the same real content the Curriculum app still
// renders directly; this importer does not touch or require changing
// that renderer) and turns it into DRAFT curriculum_courses/units/lessons
// rows. Import NEVER publishes, NEVER assigns, NEVER writes
// curriculum_lesson_completions, and NEVER touches Truth Spine/Evidence —
// it only creates draft catalog rows an authorized actor can later
// review and publish through the normal lifecycle.
//
// Defaults to dryRun: true (an explicit `dryRun: false` is required to
// actually write) — Step 20's "a dry-run importer may be preferable."
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCourse, createUnit, createLesson, type CatalogActor } from "./curriculum-catalog-service.js";
import { CurriculumCatalogRepo } from "../repo/curriculum-catalog-repo.js";

const repo = new CurriculumCatalogRepo();

// Exported for Phase 4.5A's curriculum-import-source-adapter.ts, which
// needs the identical *-student folder resolution logic to build lossless
// candidate payloads (see Step 21: reuse, do not duplicate, this
// resolution — and do not reuse browser-only studentLoader.js from Node).
export function resolveContentRoot(): string | null {
  // apps/shs-api/src/domain/curriculum-catalog/service/ -> repo root is
  // six directories up, then into src/content/lessons.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.resolve(here, "../../../../../../src/content/lessons");
  return fs.existsSync(candidate) ? candidate : null;
}

export function listImportableCurricula(): string[] {
  const root = resolveContentRoot();
  if (!root) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith("-student"))
    .map((entry) => entry.name.replace(/-student$/, ""))
    .sort();
}

interface StaticLessonFile {
  filename: string; // routable slug, per studentLoader.js's own documented rule
  title: string;
  estMinutes?: number;
  objectives?: string[];
}

function readCurriculumLessonFiles(curriculumId: string): StaticLessonFile[] {
  const root = resolveContentRoot();
  if (!root) throw new Error("static lesson content directory not found");
  const folder = path.join(root, `${curriculumId}-student`);
  if (!fs.existsSync(folder)) throw new Error(`no static content folder for curriculum "${curriculumId}"`);
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".json")).sort();
  return files.map((filename) => {
    const raw = JSON.parse(fs.readFileSync(path.join(folder, filename), "utf8"));
    return {
      filename: filename.replace(/\.json$/, ""),
      title: String(raw?.title || filename),
      estMinutes: typeof raw?.estMinutes === "number" ? raw.estMinutes : undefined,
      objectives: Array.isArray(raw?.objectives) ? raw.objectives.filter((o: unknown) => typeof o === "string") : [],
    };
  });
}

export interface ImportPreview {
  curriculumId: string;
  courseTitle: string;
  courseExists: boolean;
  lessonCount: number;
  lessons: Array<{ stableKey: string; title: string }>;
}

export async function previewImport(actor: CatalogActor, curriculumId: string): Promise<ImportPreview> {
  const lessons = readCurriculumLessonFiles(curriculumId);
  const stableKey = curriculumId.toLowerCase();
  const existingCourses = await repo.listCourses(actor.organizationId);
  const existing = existingCourses.find((c) => c.stableKey === stableKey);
  return {
    curriculumId,
    courseTitle: `${curriculumId.toUpperCase()} Curriculum`,
    courseExists: !!existing,
    lessonCount: lessons.length,
    lessons: lessons.map((l) => ({ stableKey: l.filename, title: l.title })),
  };
}

export interface ImportResult {
  dryRun: boolean;
  preview: ImportPreview;
  courseId?: string;
  unitId?: string;
  lessonIds?: string[];
}

// dryRun defaults to true: callers must explicitly pass `dryRun: false`
// to write anything. Import always creates DRAFT records only — never
// PUBLISHED, never assigned, never a completion/Truth Spine/Evidence fact.
export async function importStaticCurriculum(actor: CatalogActor, curriculumId: string, options: { dryRun?: boolean } = {}): Promise<ImportResult> {
  const dryRun = options.dryRun !== false;
  const preview = await previewImport(actor, curriculumId);
  if (dryRun) return { dryRun: true, preview };

  if (preview.courseExists) {
    throw new Error(`a course with stable key "${curriculumId.toLowerCase()}" already exists in this organization — import is one-time per curriculum id`);
  }

  const lessons = readCurriculumLessonFiles(curriculumId);
  const course = await createCourse(actor, { title: preview.courseTitle, stableKey: curriculumId.toLowerCase() });
  const unit = await createUnit(actor, course.courseId, { title: "All Lessons", stableKey: "all-lessons" });
  const lessonIds: string[] = [];
  for (const lesson of lessons) {
    const created = await createLesson(actor, unit.unitId, {
      title: lesson.title,
      stableKey: lesson.filename,
      objectives: lesson.objectives,
      estimatedDurationMinutes: lesson.estMinutes ?? null,
    });
    lessonIds.push(created.lessonId);
  }
  return { dryRun: false, preview, courseId: course.courseId, unitId: unit.unitId, lessonIds };
}
