export const WEBSITE_DEPLOYMENT_STATUSES = ["REQUESTED", "QUEUED", "DEPLOYING", "LIVE", "FAILED", "SUPERSEDED", "UNPUBLISHED"] as const;
export type WebsiteDeploymentStatus = typeof WEBSITE_DEPLOYMENT_STATUSES[number];

export const WEBSITE_DEPLOYMENT_TARGETS = ["TEST"] as const;
export type WebsiteDeploymentTarget = typeof WEBSITE_DEPLOYMENT_TARGETS[number];

export const WEBSITE_DEPLOYMENT_PROVIDER = "local_mock" as const;

export type WebsiteDeploymentFile = { path: string; content: string };
export type WebsiteDeploymentPackage = {
  projectType: "WEBSITE";
  projectId: string;
  revision: number;
  files: WebsiteDeploymentFile[];
  packageHash: string;
};

export const DEPLOYMENT_TRANSITIONS: Readonly<Record<WebsiteDeploymentStatus, readonly WebsiteDeploymentStatus[]>> = {
  REQUESTED: ["QUEUED", "DEPLOYING", "FAILED"],
  QUEUED: ["DEPLOYING", "FAILED"],
  DEPLOYING: ["LIVE", "FAILED"],
  LIVE: ["SUPERSEDED", "UNPUBLISHED"],
  FAILED: [],
  SUPERSEDED: [],
  UNPUBLISHED: [],
};

const SECRET_NAME = /(^|\/)(\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx))$/i;
const SECRET_CONTENT = /(api[_-]?key|access[_-]?token|password|private[_-]?key|client_secret)\s*[:=]/i;

export function validateWebsiteDeploymentPackage(input: unknown): WebsiteDeploymentPackage {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("DEPLOYMENT_PACKAGE_INVALID");
  const value = input as Record<string, unknown>;
  if (value.projectType !== "WEBSITE" || typeof value.projectId !== "string" || !value.projectId) throw new Error("DEPLOYMENT_PACKAGE_TYPE_INVALID");
  if (!Number.isInteger(value.revision) || Number(value.revision) < 1) throw new Error("DEPLOYMENT_PACKAGE_REVISION_INVALID");
  if (!Array.isArray(value.files) || value.files.length > 100) throw new Error("DEPLOYMENT_PACKAGE_FILES_INVALID");
  const files = value.files.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("DEPLOYMENT_PACKAGE_FILE_INVALID");
    const file = raw as Record<string, unknown>;
    const path = file.path;
    const content = file.content;
    if (typeof path !== "string" || !path || path.startsWith("/") || path.includes("..") || path.includes("\\") || SECRET_NAME.test(path)) throw new Error("DEPLOYMENT_PACKAGE_PATH_INVALID");
    if (typeof content !== "string" || content.length > 250_000 || SECRET_CONTENT.test(content)) throw new Error("DEPLOYMENT_PACKAGE_CONTENT_INVALID");
    return { path, content };
  });
  if (JSON.stringify(files).length > 1_000_000) throw new Error("DEPLOYMENT_PACKAGE_TOO_LARGE");
  if (typeof value.packageHash !== "string" || !value.packageHash) throw new Error("DEPLOYMENT_PACKAGE_HASH_REQUIRED");
  return { projectType: "WEBSITE", projectId: value.projectId, revision: Number(value.revision), files, packageHash: value.packageHash };
}

export function canTransition(from: WebsiteDeploymentStatus, to: WebsiteDeploymentStatus) {
  return DEPLOYMENT_TRANSITIONS[from]?.includes(to) || false;
}
