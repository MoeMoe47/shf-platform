export const STUDIO_TERMINOLOGY = Object.freeze({
  handoff: "Start Project",
  project: "My Project",
  library: "Project Resources",
  buildPacket: "Project Plan / Requirements",
  qa: "Check My Project",
  delivery: "Submit / Publish / Finish",
  evidence: "What You Proved",
});

export const STUDIO_EXPERIENCE_MODES = Object.freeze({ BEGINNER: "BEGINNER", ADVANCED: "ADVANCED" });

export function projectTypeLabel(projectType) {
  return projectType === "AI_AGENT" ? "AI Agent" : "Website";
}

export function stageLabel(status) {
  return {
    DRAFT: "Start",
    PLANNING: "Plan",
    BUILDING: "Build",
    READY_FOR_CHECK: "Check",
    CHANGES_REQUIRED: "Improve",
    READY_FOR_REVIEW: "Review",
    APPROVED: "Review complete",
    DELIVERY_READY: "Finish",
    DELIVERED: "Submitted",
  }[status] || "Start";
}

// This resolver reads canonical project facets only. It never writes status,
// completion, QA, review, delivery, Evidence, or progress facts.
export function resolveStudioNextAction(project) {
  if (!project) return { key: "create", label: "Start a project", description: "Choose a Website or AI Agent to begin.", href: "/studio/new" };
  if (project.status === "DRAFT") return { key: "describe", label: "Tell us what you want to build", description: "Give your project a clear starting point.", href: null };
  if (project.status === "PLANNING") return { key: "plan", label: "Review your project plan", description: "Your requirements are the guide for this project.", href: null };
  if (project.status === "BUILDING") return { key: "build", label: "Continue building your project", description: "Keep shaping the work toward your project requirements.", href: null };
  if (project.status === "READY_FOR_CHECK") return { key: "check", label: "Check your project", description: "Review the project checks when that workspace is available.", href: null };
  if (project.status === "CHANGES_REQUIRED") return { key: "improve", label: "Fix the remaining project checks", description: "Make the requested improvements before review.", href: null };
  if (project.status === "READY_FOR_REVIEW") return { key: "review", label: "Review your project", description: "Your project is ready for the next review step.", href: null };
  if (project.status === "APPROVED") return { key: "finish", label: "Your project is ready to submit", description: "Continue when the submission step is available.", href: null };
  if (project.status === "DELIVERY_READY") return { key: "finish", label: "Finish your project", description: "Complete the final submission step when available.", href: null };
  if (project.status === "DELIVERED") return { key: "prove", label: "See what you proved", description: "Evidence and portfolio connections will appear when available.", href: null };
  return { key: "start", label: "Continue your project", description: "Open your Studio workspace to keep going.", href: null };
}

export function deriveStudioProgress(project) {
  const status = project?.status || "DRAFT";
  const stages = ["Start", "Plan", "Build", "Check", "Review", "Finish", "Prove"];
  const index = { DRAFT: 0, PLANNING: 1, BUILDING: 2, READY_FOR_CHECK: 3, CHANGES_REQUIRED: 2, READY_FOR_REVIEW: 4, APPROVED: 4, DELIVERY_READY: 5, DELIVERED: 5 }[status] ?? 0;
  return { currentStage: stageLabel(status), stages, completedStages: stages.slice(0, index), remainingStages: stages.slice(index + 1), blocked: status === "CHANGES_REQUIRED", explanation: status === "CHANGES_REQUIRED" ? "A project check needs attention before you continue." : `Your project is in the ${stageLabel(status).toLowerCase()} stage.` };
}

export function deriveLearningProgress(context) {
  const statuses = context?.statuses || {};
  const stages = ["Build", "QA", "Submit", "Review", "Complete"];
  let index = 0;
  if (statuses.completion === "COMPLETE") index = 4;
  else if (["SUBMITTED", "CHANGES_REQUESTED", "APPROVED"].includes(statuses.review)) index = 3;
  else if (statuses.qa === "PASSED") index = 2;
  else if (context?.currentRevision) index = 1;
  const currentStage = stages[index];
  return { stages, currentStage, completedStages: stages.slice(0, index), remainingStages: stages.slice(index + 1), blocked: statuses.review === "CHANGES_REQUESTED" || statuses.qa === "FAILED", explanation: statuses.review === "CHANGES_REQUESTED" ? `Changes were requested on Revision ${context.changesRequested?.revision || "the submitted revision"}.` : `Your project is in the ${currentStage.toLowerCase()} stage.` };
}

export function resolveLearningNextAction(context) {
  if (!context) return { key: "context-error", label: "Reload project context", description: "Your project context could not be loaded. Try again." };
  const statuses = context.statuses || {};
  if (statuses.completion === "COMPLETE") return { key: "complete", label: "Assignment complete", description: "Your verified completion is recorded." };
  if (statuses.review === "CHANGES_REQUESTED") return { key: "changes", label: "Review feedback", description: `Create Revision ${context.changesRequested?.nextRevision || "the next revision"}, run QA again, and resubmit.` };
  if (statuses.qa === "FAILED") return { key: "qa-failed", label: "Fix QA issues", description: "Address the reported checks before submitting for Review." };
  if (statuses.qa !== "PASSED") return { key: "qa", label: "Run QA", description: "Check the current revision before submitting it for Review." };
  if (statuses.review === "NOT_SUBMITTED") return { key: "submit", label: "Submit for Review", description: "Your current revision has passed QA and is ready for Review." };
  if (["SUBMITTED", "APPROVED"].includes(statuses.review)) return { key: "review", label: "Review in progress", description: "Your submitted revision remains with the Review process." };
  return { key: "build", label: "Continue building", description: "Keep shaping the current revision." };
}

export function toStudioCompanionContext({ project, context = null, route = "/studio", nextAction = resolveStudioNextAction(project), progress = deriveStudioProgress(project), resources = [] } = {}) {
  if (!project) return { route, project: null, nextAction: nextAction.label, currentStage: "Start", availableRequirements: [], authority: "read-only" };
  return {
    route,
    authority: "read-only",
    project: { id: project.projectId, title: project.title, type: projectTypeLabel(project.projectType), origin: project.origin },
    assignment: context?.assignment || (project.assignmentId ? { id: project.assignmentId, releaseId: project.curriculumReleaseId } : null),
    currentStage: progress.currentStage,
    nextAction: nextAction.label,
    availableRequirements: [],
    qaBlockers: [],
    resources: resources.map((resource) => ({ id: resource.id, title: resource.title, type: resource.type, description: resource.description, sourceLabel: resource.sourceLabel })).slice(0, 12),
  };
}
