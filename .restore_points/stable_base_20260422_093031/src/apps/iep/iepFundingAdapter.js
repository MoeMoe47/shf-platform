export function calculateIEPFunding(students) {
  const improving = students.filter(
    s => s.readingProgress >= 60 || s.mathProgress >= 60
  );

  const projectedFunding = improving.length * 39250;

  return {
    eligibleStudents: improving.length,
    projectedIDEAFunding: projectedFunding,
    verificationStatus: improving.length > 0 ? "partial" : "none",
    readinessScore: Math.min(100, improving.length * 25)
  };
}
