import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { assertValidDataCenterCurriculumMap, validateDataCenterCurriculumMap } from "../src/utils/validateDataCenterCurriculumMap.js";

const map = JSON.parse(await readFile(new URL("../src/content/curriculum/data-center-pathway-map.json", import.meta.url), "utf8"));
const lesson = JSON.parse(await readFile(new URL("../src/content/lessons/data-center-foundations-student/data-center-foundations-introduction.json", import.meta.url), "utf8"));
const lessonDir = new URL("../src/content/lessons/data-center-foundations-student/", import.meta.url);
const gradeSevenLessonDir = new URL("../src/content/lessons/data-center-systems-7-student/", import.meta.url);
const gradeEightLessonDir = new URL("../src/content/lessons/data-center-design-8-student/", import.meta.url);
const gradeNineLessonDir = new URL("../src/content/lessons/data-center-technical-foundations-9-student/", import.meta.url);
const gradeTenLessonDir = new URL("../src/content/lessons/data-center-reliable-operations-10-student/", import.meta.url);
const gradeElevenLessonDir = new URL("../src/content/lessons/data-center-specialization-11-student/", import.meta.url);
const gradeTwelveLessonDir = new URL("../src/content/lessons/data-center-specialization-12-student/", import.meta.url);

async function readLessons(dir) {
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(file, dir), "utf8"))));
}

test("the canonical pathway contains one valid record for each grade 6 through 12", () => {
  assert.deepEqual(validateDataCenterCurriculumMap(map), []);
  assert.deepEqual(map.courses.map((course) => course.grade), [6, 7, 8, 9, 10, 11, 12, 12, 12, 12, 12, 12, 12]);
});

test("the existing introductory lesson is positioned in Grade 6 DISCOVER", () => {
  const gradeSix = map.courses.find((course) => course.grade === 6);
  assert.equal(gradeSix.courseId, "data-center-foundations");
  assert.equal(gradeSix.lessonIds.length, 10);
  assert.ok(gradeSix.lessonIds.includes(lesson.id));
  assert.equal(lesson.curriculum, gradeSix.courseId);
  assert.deepEqual(lesson.gradeBand, { minGrade: 6, maxGrade: 8, stage: "DISCOVER" });
});

test("every executable Grade 6 lesson reference resolves through the student lesson loader shape", async () => {
  const gradeSix = map.courses.find((course) => course.grade === 6);
  const lessons = await readLessons(lessonDir);
  const byId = new Map(lessons.map((item) => [item.id, item]));
  const orderedLessons = gradeSix.lessonIds.map((id) => byId.get(id));
  assert.deepEqual(new Set(gradeSix.lessonIds), new Set(lessons.map((item) => item.id)));
  for (const item of lessons) {
    assert.equal(item.gradeBand.minGrade, 6);
    assert.equal(item.gradeBand.maxGrade, 8);
    assert.equal(item.gradeBand.stage, "DISCOVER");
    assert.equal(item.curriculum, gradeSix.courseId);
    assert.equal(byId.get(item.id), item);
    assert.ok(Array.isArray(item.sections) && item.sections.length > 0);
    assert.ok(Array.isArray(item.vocab) && item.vocab.length > 0);
    assert.ok(item.quiz && typeof item.quiz.question === "string");
  }
  assert.deepEqual(
    orderedLessons.map((item) => item.nextSlug || null),
    [...gradeSix.lessonIds.slice(1), null],
    "Grade 6 lessons must navigate in canonical map order and stop after the project lesson"
  );
});

test("Grade 7 has one executable DISCOVER course and later grades remain planned", async () => {
  const gradeSeven = map.courses.find((course) => course.grade === 7);
  const lessons = await readLessons(gradeSevenLessonDir);
  const byId = new Map(lessons.map((item) => [item.id, item]));
  assert.equal(gradeSeven.contentStatus, "active");
  assert.equal(gradeSeven.lessonIds.length, 10);
  assert.equal(byId.size, lessons.length, "Grade 7 lesson IDs must be unique");
  assert.deepEqual(new Set(gradeSeven.lessonIds), new Set(lessons.map((item) => item.id)));
  for (const item of lessons) {
    assert.equal(item.curriculum, gradeSeven.courseId);
    assert.deepEqual(item.gradeBand, { minGrade: 7, maxGrade: 7, stage: "DISCOVER" });
    assert.ok(Array.isArray(item.sections) && item.sections.length > 0);
    assert.ok(Array.isArray(item.vocab) && item.vocab.length > 0);
    assert.ok(item.quiz && typeof item.quiz.question === "string");
  }
  assert.deepEqual(
    gradeSeven.lessonIds.map((id) => byId.get(id).nextSlug || null),
    [...gradeSeven.lessonIds.slice(1), null],
    "Grade 7 lessons must navigate in canonical map order and stop after the systems challenge"
  );
  assert.ok(map.courses.filter((course) => course.grade >= 12 && !["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"].includes(course.courseId)).every((course) => course.lessonIds.length === 0 && course.contentStatus === "planned"));
});

test("Grade 8 has one executable design-focused DISCOVER course", async () => {
  const gradeEight = map.courses.find((course) => course.grade === 8);
  const lessons = await readLessons(gradeEightLessonDir);
  const byId = new Map(lessons.map((item) => [item.id, item]));
  assert.equal(gradeEight.courseId, "data-center-design-8");
  assert.equal(gradeEight.contentStatus, "active");
  assert.equal(gradeEight.lessonIds.length, 10);
  assert.equal(byId.size, lessons.length, "Grade 8 lesson IDs must be unique");
  assert.deepEqual(new Set(gradeEight.lessonIds), new Set(lessons.map((item) => item.id)));
  for (const item of lessons) {
    assert.equal(item.curriculum, gradeEight.courseId);
    assert.deepEqual(item.gradeBand, { minGrade: 8, maxGrade: 8, stage: "DISCOVER" });
    assert.ok(Array.isArray(item.sections) && item.sections.length > 0);
    assert.ok(Array.isArray(item.vocab) && item.vocab.length > 0);
    assert.ok(item.quiz && typeof item.quiz.question === "string");
  }
  assert.deepEqual(
    gradeEight.lessonIds.map((id) => byId.get(id).nextSlug || null),
    [...gradeEight.lessonIds.slice(1), null],
    "Grade 8 lessons must navigate in canonical map order and stop after the design project"
  );
  assert.ok(map.courses.filter((course) => course.grade >= 12 && !["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"].includes(course.courseId)).every((course) => course.lessonIds.length === 0 && course.contentStatus === "planned"));
});

test("Grade 9 has one executable EXPLORE course with classified technical labs", async () => {
  const gradeNine = map.courses.find((course) => course.grade === 9);
  const lessons = await readLessons(gradeNineLessonDir);
  const byId = new Map(lessons.map((item) => [item.id, item]));
  assert.equal(gradeNine.courseId, "data-center-technical-foundations-9");
  assert.equal(gradeNine.stage, "EXPLORE");
  assert.equal(gradeNine.contentStatus, "active");
  assert.equal(gradeNine.lessonIds.length, 14);
  assert.equal(byId.size, lessons.length, "Grade 9 lesson IDs must be unique");
  assert.deepEqual(new Set(gradeNine.lessonIds), new Set(lessons.map((item) => item.id)));
  for (const item of lessons) {
    assert.equal(item.curriculum, gradeNine.courseId);
    assert.deepEqual(item.gradeBand, { minGrade: 9, maxGrade: 9, stage: "EXPLORE" });
    assert.ok(Array.isArray(item.sections) && item.sections.length > 0);
    assert.ok(Array.isArray(item.vocab) && item.vocab.length > 0);
    assert.ok(item.quiz && typeof item.quiz.question === "string");
    assert.ok(item.lab && ["SAFE INDEPENDENT CLASSROOM LAB", "SUPERVISED CLASSROOM LAB", "SIMULATION ONLY", "REQUIRES QUALIFIED PROFESSIONAL TRAINING LATER"].includes(item.lab.safetyClassification));
    assert.ok(Array.isArray(item.futureCompetencyCandidates) && item.futureCompetencyCandidates.length > 0);
    assert.ok(item.futureCompetencyCandidates.every((candidate) => typeof candidate === "string" && !candidate.startsWith("VERIFIED")));
  }
  assert.deepEqual(
    gradeNine.lessonIds.map((id) => byId.get(id).nextSlug || null),
    [...gradeNine.lessonIds.slice(1), null],
    "Grade 9 lessons must navigate in canonical map order and stop before Grade 10"
  );
  assert.ok(map.courses.filter((course) => course.grade >= 12 && !["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"].includes(course.courseId)).every((course) => course.lessonIds.length === 0 && course.contentStatus === "planned"));
});

test("Grade 10 has one executable operations course with classified technical labs", async () => {
  const gradeTen = map.courses.find((course) => course.grade === 10);
  const lessons = await readLessons(gradeTenLessonDir);
  const byId = new Map(lessons.map((item) => [item.id, item]));
  assert.equal(gradeTen.courseId, "data-center-reliable-operations-10");
  assert.equal(gradeTen.stage, "EXPLORE");
  assert.equal(gradeTen.contentStatus, "active");
  assert.equal(gradeTen.lessonIds.length, 14);
  assert.equal(byId.size, lessons.length, "Grade 10 lesson IDs must be unique");
  assert.deepEqual(new Set(gradeTen.lessonIds), new Set(lessons.map((item) => item.id)));
  for (const item of lessons) {
    assert.equal(item.curriculum, gradeTen.courseId);
    assert.deepEqual(item.gradeBand, { minGrade: 10, maxGrade: 10, stage: "EXPLORE" });
    assert.ok(Array.isArray(item.sections) && item.sections.length > 0);
    assert.ok(Array.isArray(item.vocab) && item.vocab.length > 0);
    assert.ok(item.quiz && typeof item.quiz.question === "string");
    assert.ok(item.lab && ["SAFE INDEPENDENT CLASSROOM LAB", "SUPERVISED CLASSROOM LAB", "SIMULATION ONLY", "REQUIRES QUALIFIED PROFESSIONAL TRAINING LATER"].includes(item.lab.safetyClassification));
    assert.ok(Array.isArray(item.futureCompetencyCandidates) && item.futureCompetencyCandidates.length > 0);
    assert.ok(item.futureCompetencyCandidates.every((candidate) => typeof candidate === "string" && !candidate.startsWith("VERIFIED")));
  }
  assert.deepEqual(
    gradeTen.lessonIds.map((id) => byId.get(id).nextSlug || null),
    [...gradeTen.lessonIds.slice(1), null],
    "Grade 10 lessons must navigate in canonical map order and stop before Grade 11"
  );
  assert.ok(map.courses.filter((course) => course.grade >= 12 && !["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"].includes(course.courseId)).every((course) => course.lessonIds.length === 0 && course.contentStatus === "planned"));
});

test("Prepare/Prove architecture defines six branches with shared core and six active specializations", () => {
  const architecture = map.prepareProveArchitecture;
  assert.equal(architecture.stage, "PREPARE_PROVE");
  assert.deepEqual(architecture.executableSharedCoreCourseIds, ["data-center-specialization-11"]);
  assert.equal(architecture.specializationTiming.model, "MODEL_B");
  assert.equal(architecture.specializationTiming.assignmentPolicy, "MODEL_2_LEARNER_REQUEST_AUTHORIZED_STAFF_CONFIRMATION");
  assert.equal(architecture.specializationTiming.grade12EligibilityPolicy.policyVersion, "grade12-entry-v1");
  assert.equal(architecture.specializationTiming.grade12EligibilityPolicy.decision, "MODEL_B_SMALL_EXPLICIT_MINIMUM");
  assert.equal(architecture.specializations.length, 6);
  assert.equal(new Set(architecture.specializations.map((item) => item.specializationId)).size, 6);
  assert.ok(architecture.sharedGrade11Core.length >= 4);
  assert.ok(architecture.specializations.every((item) => item.plannedCourseIds.includes("data-center-specialization-11") && item.plannedCourseIds.includes("data-center-capstone-12")));
  assert.ok(architecture.specializations.every((item) => item.futureEvidenceCandidates.every((candidate) => candidate.status === "PLANNED ONLY")));
  assert.ok(architecture.specializations.every((item) => item.credentialAlignments.every((credential) => credential.status === "NOT ISSUED / PLANNED")));
  assert.equal(architecture.constructionDecision.classification, "ELECTIVE_AND_CAREER_EXPOSURE_TRACK");
  assert.match(architecture.boundaries.competencyStatus, /^IMPLEMENTED: generic evidence and competency review foundation/);
  assert.equal(architecture.boundaries.credentialStatus, "DEFERRED: planning and potential alignment only; nothing is issued");
  assert.equal(architecture.boundaries.employerStatus, "DEFERRED: partner categories are planning references, not commitments");
  assert.equal(map.courses.find((course) => course.grade === 11).activationScope, "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY_AND_AI_CLOUD");
  assert.equal(map.courses.find((course) => course.grade === 12).contentStatus, "planned");
});

test("Prepare/Prove validation rejects duplicate branches and premature executable branch courses", () => {
  const duplicate = structuredClone(map);
  duplicate.prepareProveArchitecture.specializations[1].specializationId = duplicate.prepareProveArchitecture.specializations[0].specializationId;
  assert.throws(() => assertValidDataCenterCurriculumMap(duplicate), /duplicate specializationId/);

  const activated = structuredClone(map);
  activated.courses.find((course) => course.courseId === "data-center-capstone-12").contentStatus = "active";
  assert.throws(() => assertValidDataCenterCurriculumMap(activated), /specialization course must remain planned/);

  const issued = structuredClone(map);
  issued.prepareProveArchitecture.specializations[0].credentialAlignments[0].status = "AUTHORIZED";
  assert.throws(() => assertValidDataCenterCurriculumMap(issued), /credential alignment must remain planned/);
});

test("Grade 11 activates the shared core and six approved specializations", async () => {
  const gradeEleven = map.courses.find((course) => course.grade === 11);
  const gradeTwelve = map.courses.find((course) => course.grade === 12);
  const lessons = await readLessons(gradeElevenLessonDir);
  assert.equal(gradeEleven.contentStatus, "active");
  assert.equal(gradeEleven.activationScope, "SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY_AND_AI_CLOUD");
  assert.equal(gradeEleven.lessonIds.length, 58);
  assert.equal(lessons.length, 58);
  assert.ok(lessons.every((lesson) => lesson.gradeBand?.minGrade === 11 && lesson.gradeBand?.maxGrade === 11 && lesson.gradeBand?.stage === "PREPARE_PROVE"));
  assert.ok(lessons.every((lesson) => lesson.curriculum === gradeEleven.courseId));
  assert.equal(lessons.filter((lesson) => lesson.proofActivity).length, 20);
  assert.ok(lessons.filter((lesson) => lesson.proofActivity).every((lesson) => lesson.proofActivity.safetyClassification === "SIMULATION ONLY"));
  assert.deepEqual(map.prepareProveArchitecture.activeSpecializationIds, ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  assert.equal(map.prepareProveArchitecture.specializations.find((item) => item.specializationId === "technical-operations").activationStatus, "active");
  assert.equal(map.prepareProveArchitecture.specializations.find((item) => item.specializationId === "networking-fiber").activationStatus, "active");
  assert.equal(map.prepareProveArchitecture.specializations.find((item) => item.specializationId === "electrical-infrastructure").activationStatus, "active");
  assert.equal(map.prepareProveArchitecture.specializations.find((item) => item.specializationId === "mechanical-hvac").activationStatus, "active");
  assert.equal(map.prepareProveArchitecture.specializations.find((item) => item.specializationId === "cybersecurity-security").activationStatus, "active");
  assert.equal(map.prepareProveArchitecture.specializations.find((item) => item.specializationId === "ai-cloud-infrastructure").activationStatus, "active");
  assert.ok(map.prepareProveArchitecture.specializations.filter((item) => !["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"].includes(item.specializationId)).every((item) => item.activationStatus !== "active"));
  assert.equal(gradeTwelve.contentStatus, "planned");
  assert.deepEqual(gradeTwelve.lessonIds, []);
});

test("invalid references, stages, duplicate IDs, and prerequisite cycles fail validation", () => {
  const duplicate = structuredClone(map);
  duplicate.courses[1].courseId = duplicate.courses[0].courseId;
  duplicate.courses[1].stage = "EXPLORE";
  duplicate.courses[1].prerequisites = ["missing-course"];
  assert.throws(() => assertValidDataCenterCurriculumMap(duplicate), /duplicate courseId|missing prerequisite|grade\/stage mismatch/);

  const cycle = structuredClone(map);
  cycle.courses[0].prerequisites = [cycle.courses[6].courseId];
  assert.throws(() => assertValidDataCenterCurriculumMap(cycle), /prerequisite is not earlier|prerequisite cycle/);
});

test("planned courses do not claim executable lesson content or credentials", () => {
  assert.equal(map.courses.filter((course) => course.contentStatus === "active").length, 12);
  assert.equal(map.courses.find((course) => course.grade === 11).lessonIds.length, 58);
  assert.equal(map.courses.find((course) => course.courseId === "data-center-capstone-12").lessonIds.length, 0);
  assert.deepEqual(map.transition.notYetImplemented, ["credentials", "internships", "apprenticeships", "employment matching", "readiness scoring"]);
});

test("Grade 12 architecture defines six advanced branches and bounded reference execution", () => {
  const architecture = map.prepareProveArchitecture.grade12Architecture;
  const branchIds = ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"];
  assert.equal(architecture.status, "ARCHITECTURE_DEFINED_WITH_EXECUTABLE_REFERENCE_SLICE");
  assert.equal(architecture.policyVersion, "grade12-entry-v1");
  assert.equal(architecture.sharedCore.decision, "MODEL_B_SMALL_COMMON_CORE");
  assert.equal(architecture.sharedCore.lessonIds.length, 5);
  assert.deepEqual(architecture.advancedBranches.map((branch) => branch.specializationId), branchIds);
  assert.equal(architecture.capstone.title, "Build Ohio's Next AI Data Center");
  assert.equal(architecture.capstone.mode, "MODEL_C_HYBRID");
  assert.deepEqual(architecture.capstone.roleMap, {
    "technical-operations": "Operations",
    "networking-fiber": "Networking",
    "electrical-infrastructure": "Power",
    "mechanical-hvac": "Cooling/Mechanical",
    "cybersecurity-security": "Security",
    "ai-cloud-infrastructure": "Compute/AI Infrastructure",
  });
  assert.deepEqual(architecture.capstone.teamModes, ["COLLABORATIVE_MODE", "INDIVIDUAL_INTEGRATED_MODE"]);
  assert.equal(architecture.capstone.status, "ARCHITECTURE_DEFINED_NON_EXECUTABLE");
  assert.equal(architecture.capstoneEntryPolicy.policyVersion, "grade12-capstone-entry-v1");
  assert.equal(architecture.capstoneEntryPolicy.decision, "DERIVED_FROM_CANONICAL_FACTS");
  assert.equal(architecture.capstoneEntryPolicy.status, "GATE_ONLY_CAPSTONE_NON_EXECUTABLE");
  assert.equal(architecture.capstoneEntryPolicy.competencyRule, "REQUIRE_NARROW_BRANCH_PROOF_NOT_EVERY_FUTURE_COMPETENCY");
  assert.equal(architecture.ownership.noDuplicateStore, true);
  assert.equal(architecture.accessibility.individualEquivalentRequired, true);
  assert.equal(architecture.boundaries.grade12Content, "REFERENCE_SLICE_ONLY_OTHER_CONTENT_NON_EXECUTABLE");
  assert.equal(architecture.boundaries.capstone, "NON_EXECUTABLE");
});

test("Grade 12 validator rejects accidental activation or ownership drift", () => {
  const activated = structuredClone(map);
  activated.prepareProveArchitecture.grade12Architecture.capstone.status = "active";
  assert.throws(() => assertValidDataCenterCurriculumMap(activated), /capstone must remain architecture-defined and non-executable/);

  const missingRole = structuredClone(map);
  delete missingRole.prepareProveArchitecture.grade12Architecture.capstone.roleMap["networking-fiber"];
  assert.throws(() => assertValidDataCenterCurriculumMap(missingRole), /capstone role map must cover all six canonical branches/);

  const duplicate = structuredClone(map);
  duplicate.prepareProveArchitecture.grade12Architecture.advancedBranches[0].specializationId = "networking-fiber";
  assert.throws(() => assertValidDataCenterCurriculumMap(duplicate), /Grade 12 architecture must define all six canonical advanced branches/);
});

test("Phase 30 activates only the Grade 12 common-core and Technical Operations reference slice", async () => {
  const course = map.courses.find((item) => item.courseId === "data-center-technical-operations-12");
  const lessons = await readLessons(gradeTwelveLessonDir);
  const courseLessons = lessons.filter((item) => item.curriculum === course.courseId);
  assert.equal(course.contentStatus, "active");
  assert.equal(course.activationScope, "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS");
  assert.equal(course.lessonIds.length, 12);
  assert.equal(courseLessons.length, 12);
  assert.ok(courseLessons.every((item) => item.gradeBand.minGrade === 12 && item.gradeBand.maxGrade === 12));
  assert.equal(courseLessons.filter((item) => item.proofActivity).length, 1);
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableSpecializationIds, ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  assert.equal(map.prepareProveArchitecture.grade12Architecture.capstone.status, "ARCHITECTURE_DEFINED_NON_EXECUTABLE");
});

test("Phase 33 activates only the Networking/Fiber advanced Grade 12 branch beside the reference branch", async () => {
  const course = map.courses.find((item) => item.courseId === "data-center-networking-fiber-12");
  const lessons = await readLessons(gradeTwelveLessonDir);
  assert.equal(course.contentStatus, "active");
  assert.equal(course.activationScope, "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER");
  assert.equal(course.lessonIds.length, 8);
  for (const id of course.lessonIds) assert.ok(lessons.some((item) => item.id === id));
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableCourseIds, ["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"]);
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableSpecializationIds, ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  assert.equal(map.courses.find((item) => item.courseId === "data-center-capstone-12").contentStatus, "planned");
});

test("Phase 35 activates only the Mechanical/HVAC advanced Grade 12 branch beside the three proven branches", async () => {
  const course = map.courses.find((item) => item.courseId === "data-center-mechanical-hvac-12");
  const lessons = await readLessons(gradeTwelveLessonDir);
  assert.equal(course.contentStatus, "active");
  assert.equal(course.activationScope, "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC");
  assert.equal(course.lessonIds.length, 8);
  for (const id of course.lessonIds) assert.ok(lessons.some((item) => item.id === id));
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableSpecializationIds, ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  assert.ok(map.courses.filter((item) => item.grade === 12 && !["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"].includes(item.courseId)).every((item) => item.contentStatus === "planned" && item.lessonIds.length === 0));
});

test("Phase 34 activates only the Electrical advanced Grade 12 branch beside the two proven branches", async () => {
  const course = map.courses.find((item) => item.courseId === "data-center-electrical-infrastructure-12");
  const lessons = await readLessons(gradeTwelveLessonDir);
  assert.equal(course.contentStatus, "active");
  assert.equal(course.activationScope, "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL");
  assert.equal(course.lessonIds.length, 8);
  for (const id of course.lessonIds) assert.ok(lessons.some((item) => item.id === id));
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableCourseIds, ["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"]);
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableSpecializationIds, ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  assert.ok(map.courses.filter((item) => item.grade === 12 && !["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"].includes(item.courseId)).every((item) => item.contentStatus === "planned" && item.lessonIds.length === 0));
  assert.equal(map.courses.find((item) => item.courseId === "data-center-capstone-12").contentStatus, "planned");
});

test("Phase 36 activates only the defensive Security advanced Grade 12 branch", async () => {
  const course = map.courses.find((item) => item.courseId === "data-center-cybersecurity-security-12");
  const lessons = await readLessons(gradeTwelveLessonDir);
  assert.equal(course.contentStatus, "active");
  assert.equal(course.activationScope, "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY");
  assert.equal(course.lessonIds.length, 8);
  assert.ok(course.lessonIds.every((id) => lessons.some((item) => item.id === id)));
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableCourseIds, ["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"]);
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableSpecializationIds, ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  assert.equal(map.courses.find((item) => item.courseId === "data-center-capstone-12").contentStatus, "planned");
  assert.ok(map.courses.filter((item) => item.grade === 12 && item.courseId !== "data-center-cybersecurity-security-12" && item.courseId !== "data-center-technical-operations-12" && item.courseId !== "data-center-networking-fiber-12" && item.courseId !== "data-center-electrical-infrastructure-12" && item.courseId !== "data-center-mechanical-hvac-12" && item.courseId !== "data-center-ai-cloud-infrastructure-12").every((item) => item.contentStatus === "planned" && item.lessonIds.length === 0));
});

test("Phase 38 activates only the AI/Cloud advanced Grade 12 branch", async () => {
  const course = map.courses.find((item) => item.courseId === "data-center-ai-cloud-infrastructure-12");
  const lessons = await readLessons(gradeTwelveLessonDir);
  assert.equal(course.contentStatus, "active");
  assert.equal(course.activationScope, "GRADE12_SHARED_CORE_AND_TECHNICAL_OPERATIONS_AND_NETWORKING_FIBER_AND_ELECTRICAL_AND_MECHANICAL_HVAC_AND_SECURITY_AND_AI_CLOUD");
  assert.equal(course.lessonIds.length, 8);
  assert.ok(course.lessonIds.every((id) => lessons.some((item) => item.id === id)));
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableCourseIds, ["data-center-technical-operations-12", "data-center-networking-fiber-12", "data-center-electrical-infrastructure-12", "data-center-mechanical-hvac-12", "data-center-cybersecurity-security-12", "data-center-ai-cloud-infrastructure-12"]);
  assert.deepEqual(map.prepareProveArchitecture.grade12Architecture.executableSpecializationIds, ["technical-operations", "networking-fiber", "electrical-infrastructure", "mechanical-hvac", "cybersecurity-security", "ai-cloud-infrastructure"]);
  assert.equal(map.courses.find((item) => item.courseId === "data-center-capstone-12").contentStatus, "planned");
});
