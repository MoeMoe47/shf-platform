import { isStudioProjectType, type StudioProjectType } from "./studio-lifecycle.js";
import { validateStudioWorkspaceWork, type StudioAgentWork, type StudioWebsiteWork, type StudioWorkspaceWork } from "./studio-workspace.js";

export const STUDIO_QA_RUN_STATUSES = ["PENDING", "RUNNING", "PASSED", "FAILED", "ERROR"] as const;
export type StudioQaRunStatus = typeof STUDIO_QA_RUN_STATUSES[number];
export const STUDIO_QA_CHECK_STATUSES = ["PASS", "FAIL", "WARN", "NOT_APPLICABLE", "ERROR"] as const;
export type StudioQaCheckStatus = typeof STUDIO_QA_CHECK_STATUSES[number];
export const STUDIO_QA_RULESET_VERSION = "studio-qa-v1";

export interface StudioQaFinding {
  checkId: string;
  title: string;
  status: StudioQaCheckStatus;
  message: string;
  category: "STRUCTURE" | "CONTENT" | "SAFETY";
  studentGuidance: string;
  requirementReference?: string | null;
}

export interface StudioQaSummary {
  total: number;
  pass: number;
  fail: number;
  warn: number;
  notApplicable: number;
  error: number;
}

export interface StudioQaRun {
  qaRunId: string;
  projectId: string;
  organizationId: string;
  tenantId: string;
  projectType: StudioProjectType;
  workspaceRevision: number;
  studioRevisionId: string | null;
  artifactId?: string | null;
  status: StudioQaRunStatus;
  rulesetVersion: string;
  summary: StudioQaSummary;
  findings: readonly StudioQaFinding[];
  createdByUserId: string;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

function finding(checkId: string, title: string, status: StudioQaCheckStatus, message: string, category: StudioQaFinding["category"], studentGuidance: string): StudioQaFinding {
  return { checkId, title, status, message, category, studentGuidance };
}

function structuralFailure(projectType: StudioProjectType, error: unknown): StudioQaFinding {
  return finding(
    projectType === "WEBSITE" ? "WEB_WORKSPACE_SHAPE_VALID" : "AGENT_WORKSPACE_SHAPE_VALID",
    "Project work has a supported shape",
    "ERROR",
    "The saved project work could not be checked safely.",
    "STRUCTURE",
    "Reload your project and try the check again.",
  );
}

export function evaluateStudioQa(projectType: StudioProjectType, work: unknown, hasSavedWorkspace: boolean): { status: StudioQaRunStatus; summary: StudioQaSummary; findings: StudioQaFinding[] } {
  if (!isStudioProjectType(projectType)) throw new Error("QA_PROJECT_TYPE_INVALID");
  const findings: StudioQaFinding[] = [];
  if (!hasSavedWorkspace) {
    findings.push(finding("WORKSPACE_SAVED", "Project work has been saved", "FAIL", "No saved project work is available yet.", "STRUCTURE", "Save your project before checking it."));
  }
  let validated: StudioWorkspaceWork;
  try {
    validated = validateStudioWorkspaceWork(projectType, work);
  } catch (error) {
    findings.push(structuralFailure(projectType, error));
    return resultFor(findings);
  }
  if (projectType === "WEBSITE") {
    const page = (validated as StudioWebsiteWork).pages[0];
    findings.push(finding("WEB_WORKSPACE_SHAPE_VALID", "Website work has a supported shape", "PASS", "The saved Website work uses the supported project structure.", "STRUCTURE", "Continue building from this project structure."));
    const titlePresent = Boolean(page?.title.trim());
    findings.push(finding("WEB_PAGE_TITLE_PRESENT", "Home page has a title", titlePresent ? "PASS" : "FAIL", titlePresent ? "A page title is present." : "The Home page needs a title.", "CONTENT", titlePresent ? "No action needed for this check." : "Add a clear title to the Home page."));
    const contentPresent = Boolean(page?.content.trim());
    findings.push(finding("WEB_PAGE_CONTENT_PRESENT", "Home page has content", contentPresent ? "PASS" : "FAIL", contentPresent ? "Home page content is present." : "The Home page needs content.", "CONTENT", contentPresent ? "No action needed for this check." : "Add the main content for the Home page."));
    findings.push(finding("WEB_FORBIDDEN_SECRET_FIELDS_ABSENT", "No unsupported secret fields are present", "PASS", "The saved Website work contains no unsupported secret fields.", "SAFETY", "No action needed for this check."));
  } else {
    findings.push(finding("AGENT_WORKSPACE_SHAPE_VALID", "Agent work has a supported shape", "PASS", "The saved AI Agent work uses the supported project structure.", "STRUCTURE", "Continue shaping your agent."));
    const agent = validated as StudioAgentWork;
    const namePresent = Boolean(agent.name.trim());
    findings.push(finding("AGENT_NAME_PRESENT", "Agent has a name", namePresent ? "PASS" : "FAIL", namePresent ? "An agent name is present." : "The agent needs a name.", "CONTENT", namePresent ? "No action needed for this check." : "Add a name that describes your agent."));
    const instructionsPresent = Boolean(agent.instructions.trim());
    findings.push(finding("AGENT_INSTRUCTIONS_PRESENT", "Agent has instructions", instructionsPresent ? "PASS" : "FAIL", instructionsPresent ? "Agent instructions are present." : "The agent needs instructions.", "CONTENT", instructionsPresent ? "No action needed for this check." : "Describe what your agent should do."));
    findings.push(finding("AGENT_FORBIDDEN_SECRET_FIELDS_ABSENT", "No unsupported secret fields are present", "PASS", "The saved Agent work contains no unsupported secret fields.", "SAFETY", "No action needed for this check."));
  }
  return resultFor(findings);
}

function resultFor(findings: StudioQaFinding[]) {
  const summary: StudioQaSummary = {
    total: findings.length,
    pass: findings.filter((item) => item.status === "PASS").length,
    fail: findings.filter((item) => item.status === "FAIL").length,
    warn: findings.filter((item) => item.status === "WARN").length,
    notApplicable: findings.filter((item) => item.status === "NOT_APPLICABLE").length,
    error: findings.filter((item) => item.status === "ERROR").length,
  };
  const status: StudioQaRunStatus = summary.error ? "ERROR" : summary.fail ? "FAILED" : "PASSED";
  return { status, summary, findings };
}

export function rowToStudioQaRun(row: any): StudioQaRun {
  return {
    qaRunId: row.qa_run_id,
    projectId: row.project_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    projectType: row.project_type,
    workspaceRevision: Number(row.workspace_revision),
    studioRevisionId: row.studio_revision_id ?? null,
    artifactId: row.artifact_id ?? null,
    status: row.status,
    rulesetVersion: row.ruleset_version,
    summary: row.summary_json || { total: 0, pass: 0, fail: 0, warn: 0, notApplicable: 0, error: 0 },
    findings: row.findings_json || [],
    createdByUserId: row.created_by_user_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
