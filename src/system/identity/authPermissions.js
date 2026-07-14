export const BOS_AUTH_PERMISSIONS = Object.freeze({
  EXECUTIVE_READ: "bos.executive.read",
  ORCHESTRATOR_READ: "bos.orchestrator.read",
  ORCHESTRATOR_REVIEW: "bos.orchestrator.review",
  COMMAND_PREVIEW: "bos.command.preview",
  COMMAND_APPROVE: "bos.command.approve",
  SCHEDULER_READ: "bos.scheduler.read",
  SCHEDULER_MANAGE_LOCAL: "bos.scheduler.manage_local",
  NOTIFICATIONS_READ: "bos.notifications.read",
  NOTIFICATIONS_REVIEW: "bos.notifications.review",
  PERSISTENCE_READ: "bos.persistence.read",
  PERSISTENCE_MIGRATE_LOCAL: "bos.persistence.migrate_local",
  TRACKING_READ: "bos.tracking.read",
  REGISTRY_READ: "bos.registry.read",
  AGENTS_READ: "bos.agents.read",
  AGENTS_APPROVE: "bos.agents.approve",
  REPORTS_READ: "bos.reports.read",
  DIRECT_CONNECT_READ: "bos.direct_connect.read",
  GOVERNANCE_READ: "bos.governance.read",
  IDENTITY_READ: "bos.identity.read",
  IDENTITY_MANAGE: "bos.identity.manage",
});

export const SHS_ADMIN_BOS_PERMISSIONS = Object.freeze(Object.values(BOS_AUTH_PERMISSIONS));
export const CLIENT_ADMIN_BOS_PERMISSIONS = Object.freeze([BOS_AUTH_PERMISSIONS.REPORTS_READ]);

