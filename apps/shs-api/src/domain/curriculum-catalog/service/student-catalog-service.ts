// SHF Curriculum Phase 5.5 — student-facing read projection over the
// curriculum catalog. Every consumer (Learning landing, Course
// Workspace) must call through here rather than re-deriving "which
// courses is this student in" or "how far have they gotten" in the
// frontend — this wraps and reuses assignment-entitlement-service.ts's
// real entitlement/progress machinery (Phase 3) rather than inventing a
// parallel one.
//
// There is no course-enrollment concept anywhere in this codebase — the
// only real signal of "this student belongs to this course" is a real
// assignment (Phase 3 curriculum-release binding) entitled to them. So
// "my courses" here means exactly that: the distinct set of courses with
// at least one assignment resolveAssignmentWork() has already proven
// this actor can see. This is an honest substitute for a course-
// enrollment model, not a fabricated one — documented rather than
// silent, per Phase 5.5's no-fabrication requirement.
import { CurriculumCatalogRepo } from "../repo/curriculum-catalog-repo.js";
import * as entitlement from "../../assignments/service/assignment-entitlement-service.js";
import type { ActorUser } from "../../assignments/service/assignment-service.js";
import type { CurriculumReleaseSnapshot } from "../model/curriculum-catalog.js";

const catalogRepo = new CurriculumCatalogRepo();

export type LessonStatus = "completed" | "in_progress" | "upcoming";

export interface StudentLessonSummary {
  unitStableKey: string;
  lessonStableKey: string;
  title: string;
  sequence: number;
  status: LessonStatus;
}

export interface StudentUnitSummary {
  stableKey: string;
  title: string;
  sequence: number;
  lessons: StudentLessonSummary[];
  completedCount: number;
  totalCount: number;
}

export interface StudentCourseSummary {
  courseId: string;
  stableKey: string;
  title: string;
  shortDescription: string | null;
  unitCount: number;
  lessonCount: number;
  completedCount: number;
  progressPercent: number | null; // null = no published release to measure against
  currentUnitTitle: string | null;
  nextLesson: { unitStableKey: string; lessonStableKey: string; title: string } | null;
}

export interface StudentResourceSummary {
  resourceId: string;
  title: string;
  resourceType: string;
  description: string | null;
  externalUrl: string | null;
  lessonTitle: string;
}

export interface StudentCourseDetail extends StudentCourseSummary {
  units: StudentUnitSummary[];
  resources: StudentResourceSummary[];
}

function summarizeCourse(
  courseId: string,
  stableKey: string,
  title: string,
  shortDescription: string | null,
  snapshot: CurriculumReleaseSnapshot,
  completed: Set<string>,
): StudentCourseDetail {
  const units = [...snapshot.units].sort((a, b) => a.sequence - b.sequence);

  let seenIncomplete = false;
  let nextLesson: StudentCourseDetail["nextLesson"] = null;
  let currentUnitTitle: string | null = null;
  let totalCount = 0;
  let completedCount = 0;

  const resources: StudentResourceSummary[] = [];
  const unitSummaries: StudentUnitSummary[] = units.map((unit) => {
    const lessons = [...unit.lessons].sort((a, b) => a.sequence - b.sequence);
    let unitCompleted = 0;
    const lessonSummaries: StudentLessonSummary[] = lessons.map((lesson) => {
      totalCount += 1;
      const isComplete = completed.has(lesson.stableKey);
      if (isComplete) {
        completedCount += 1;
        unitCompleted += 1;
      }
      let status: LessonStatus = isComplete ? "completed" : "upcoming";
      if (!isComplete && !seenIncomplete) {
        status = "in_progress";
        seenIncomplete = true;
        nextLesson = { unitStableKey: unit.stableKey, lessonStableKey: lesson.stableKey, title: lesson.title };
        currentUnitTitle = unit.title;
      }
      for (const r of lesson.resources || []) {
        resources.push({ resourceId: r.resourceId, title: r.title, resourceType: r.resourceType, description: r.description, externalUrl: r.externalUrl, lessonTitle: lesson.title });
      }
      return { unitStableKey: unit.stableKey, lessonStableKey: lesson.stableKey, title: lesson.title, sequence: lesson.sequence, status };
    });
    return { stableKey: unit.stableKey, title: unit.title, sequence: unit.sequence, lessons: lessonSummaries, completedCount: unitCompleted, totalCount: lessons.length };
  });

  return {
    courseId,
    stableKey,
    title,
    shortDescription,
    unitCount: units.length,
    lessonCount: totalCount,
    completedCount,
    progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : null,
    currentUnitTitle,
    nextLesson,
    units: unitSummaries,
    resources,
  };
}

function emptyCourse(courseId: string, stableKey: string, title: string, shortDescription: string | null): StudentCourseDetail {
  return {
    courseId,
    stableKey,
    title,
    shortDescription,
    unitCount: 0,
    lessonCount: 0,
    completedCount: 0,
    progressPercent: null,
    currentUnitTitle: null,
    nextLesson: null,
    units: [],
    resources: [],
  };
}

export async function listMyCourses(actor: ActorUser): Promise<StudentCourseSummary[]> {
  const work = await entitlement.listAssignedWork(actor);
  const courseKeys = new Set<string>();
  for (const w of work) {
    if (w.curriculumRelease) courseKeys.add(w.curriculumRelease.courseStableKey);
  }

  const summaries: StudentCourseSummary[] = [];
  for (const stableKey of courseKeys) {
    const course = await catalogRepo.findCourseByStableKey(actor.organization_id, stableKey);
    if (!course) continue; // honest skip — a stale/mismatched binding, never guessed
    const release = await catalogRepo.findLatestPublishedRelease(actor.organization_id, course.courseId);
    const detail = release
      ? summarizeCourse(
          course.courseId,
          course.stableKey,
          course.title,
          course.shortDescription,
          release.snapshot as CurriculumReleaseSnapshot,
          await entitlement.completedLessonKeys(actor.organization_id, actor.user_id, stableKey),
        )
      : emptyCourse(course.courseId, course.stableKey, course.title, course.shortDescription);
    const { units, resources, ...summary } = detail;
    summaries.push(summary);
  }
  return summaries;
}

export async function getCourseDetail(actor: ActorUser, courseStableKey: string): Promise<StudentCourseDetail | null> {
  const course = await catalogRepo.findCourseByStableKey(actor.organization_id, courseStableKey);
  if (!course) return null;

  // Entitlement check mirrors listMyCourses' signal exactly — a known
  // course id for a course this student has no real assignment in 404s
  // the same as one that doesn't exist, never a distinguishable
  // "exists but forbidden" response.
  const work = await entitlement.listAssignedWork(actor);
  const entitled = work.some((w) => w.curriculumRelease?.courseStableKey === courseStableKey);
  if (!entitled) return null;

  const release = await catalogRepo.findLatestPublishedRelease(actor.organization_id, course.courseId);
  if (!release) return emptyCourse(course.courseId, course.stableKey, course.title, course.shortDescription);

  const completed = await entitlement.completedLessonKeys(actor.organization_id, actor.user_id, courseStableKey);
  return summarizeCourse(course.courseId, course.stableKey, course.title, course.shortDescription, release.snapshot as CurriculumReleaseSnapshot, completed);
}
