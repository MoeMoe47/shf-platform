export const REGISTRY_PROVIDER = "local_test_registry";
export const REGISTRY_SUBMISSION_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUIRED", "ACCEPTED", "REJECTED", "FAILED", "WITHDRAWN"] as const;
export type RegistrySubmissionStatus = typeof REGISTRY_SUBMISSION_STATUSES[number];

export interface RegistrySubmissionResult {
  status: Extract<RegistrySubmissionStatus, "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "CHANGES_REQUIRED" | "REJECTED">;
  registryReference: string | null;
  message?: string | null;
}

export interface RegistrySubmissionPackage {
  packageId: string;
  packageVersion: number;
  packageHash: string;
  packageJson: Record<string, unknown>;
}

export function registryStudentStatus(status: RegistrySubmissionStatus) {
  return ({ SUBMITTED: "Submitted to Registry", UNDER_REVIEW: "Under Review", CHANGES_REQUIRED: "Changes Requested", ACCEPTED: "Accepted by Test Registry", REJECTED: "Rejected by Test Registry", FAILED: "Submission Failed", WITHDRAWN: "Withdrawn" } as const)[status] || "Not Submitted";
}
