export function lessonCoursePosition(lesson) {
  const value = lesson?.coursePosition;

  if (!value || typeof value !== "object") {
    return null;
  }

  const unitNumber = Number(value.unitNumber);
  const unitCount = Number(value.unitCount);
  const lessonNumber = Number(value.lessonNumber);
  const lessonCount = Number(value.lessonCount);

  if (
    !Number.isFinite(unitNumber) ||
    !Number.isFinite(unitCount) ||
    !Number.isFinite(lessonNumber) ||
    !Number.isFinite(lessonCount)
  ) {
    return null;
  }

  return {
    courseTitle: String(value.courseTitle || "").trim(),
    unitNumber,
    unitCount,
    unitTitle: String(value.unitTitle || "").trim(),
    lessonNumber,
    lessonCount,
    lessonCode:
      String(value.lessonCode || "").trim() ||
      `${unitNumber}.${lessonNumber}`,
  };
}
