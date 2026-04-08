export function mapIEPAlertToRisk(student) {
  if (!student.alert) return null;

  let type = "general_risk";
  let severity = "medium";
  let confidence = 0.7;

  if (student.alert.toLowerCase().includes("low engagement")) {
    type = "low_engagement";
    severity = "high";
    confidence = 0.84;
  }

  if (student.alert.toLowerCase().includes("missed")) {
    type = "attendance_gap";
    severity = "medium";
    confidence = 0.76;
  }

  return {
    id: `risk_${student.id}`,
    studentId: student.id,
    studentName: student.name,
    type,
    severity,
    confidence,
    recommendedAction: student.nextStep || "review_case"
  };
}
