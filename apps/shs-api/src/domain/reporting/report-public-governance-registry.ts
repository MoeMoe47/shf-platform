export type PublicReportGovernanceRegistration = Readonly<{
  report_id: string;
  report_version: number;
  metric_id: string;
  metric_version: number;
  domain: string;
  public_governance_status: "ACTIVE" | "POLICY_REQUIRED";
  required_policy_key: string;
  snapshot_representation_type: string;
  semantic_label: string;
  semantic_class: string;
  truth_public_population_required: boolean;
  publication_projection_type: string;
  public_read_model_id: string;
  registration_version: number;
  status: "ACTIVE";
  result_reference_prefix: string;
  disclosure_evaluator: "CURRICULUM_EDUCATION_ACTIVITY_V1" | "HUB_REFERRAL_ACTIVITY_V1" | null;
}>;

export const PUBLIC_REPORT_GOVERNANCE_REGISTRATIONS: ReadonlyArray<PublicReportGovernanceRegistration> = Object.freeze([
  Object.freeze({
    report_id: "report.curriculum.lesson_completion_count.v1",
    report_version: 1,
    metric_id: "curriculum.lesson.completion_count.v1",
    metric_version: 1,
    domain: "CURRICULUM",
    public_governance_status: "ACTIVE",
    required_policy_key: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY",
    snapshot_representation_type: "PUBLIC_SAFE_AGGREGATE",
    semantic_label: "Verified Lesson Completions",
    semantic_class: "LESSON_COMPLETION_ACTIVITY",
    truth_public_population_required: true,
    publication_projection_type: "SHF_PUBLIC_IMPACT_PROJECTION",
    public_read_model_id: "curriculum-lesson-completions",
    registration_version: 1,
    status: "ACTIVE",
    result_reference_prefix: "curriculum.lesson_completion_count:v1",
    disclosure_evaluator: "CURRICULUM_EDUCATION_ACTIVITY_V1",
  }),
  Object.freeze({
    report_id: "report.hub.referral.created_count.v1",
    report_version: 1,
    metric_id: "hub.referral.created_count.v1",
    metric_version: 1,
    domain: "HUB",
    public_governance_status: "POLICY_REQUIRED",
    required_policy_key: "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY",
    snapshot_representation_type: "PUBLIC_SAFE_AGGREGATE",
    semantic_label: "Hub Referrals Created",
    semantic_class: "REFERRAL_CREATION_ACTIVITY",
    truth_public_population_required: true,
    publication_projection_type: "SHF_PUBLIC_IMPACT_PROJECTION",
    public_read_model_id: "hub-referral-created-count",
    registration_version: 1,
    status: "ACTIVE",
    result_reference_prefix: "hub.referral.created_count:v1",
    disclosure_evaluator: "HUB_REFERRAL_ACTIVITY_V1",
  }),
]);

export function getPublicReportGovernanceRegistration(reportId: string, reportVersion: number) {
  return PUBLIC_REPORT_GOVERNANCE_REGISTRATIONS.find(
    (registration) => registration.report_id === reportId && registration.report_version === Number(reportVersion),
  ) || null;
}

export function requirePublicReportGovernanceRegistration(reportId: string, reportVersion: number) {
  const registration = getPublicReportGovernanceRegistration(reportId, reportVersion);
  if (!registration) throw new Error("Report is not authorized for public governance");
  return registration;
}
