/**
 * SHS Adaptive Experience Layer
 * Official moat role:
 * User-behavior and product-learning layer for SHS/SHF dashboards,
 * command centers, reports, and workflow surfaces.
 *
 * Oracle answers: What is true?
 * Analyst answers: What should happen next?
 * Adaptive Experience answers: What user experience works best?
 */

export const ADAPTIVE_EVENT_TYPES = Object.freeze({
  PAGE_VIEWED: "page_viewed",
  CARD_CLICKED: "card_clicked",
  BUTTON_CLICKED: "button_clicked",
  FORM_STARTED: "form_started",
  FORM_SUBMITTED: "form_submitted",
  FORM_ABANDONED: "form_abandoned",
  REPORT_VIEWED: "report_viewed",
  REPORT_EXPORTED: "report_exported",
  FILE_UPLOADED: "file_uploaded",
  RECOMMENDATION_VIEWED: "recommendation_viewed",
  RECOMMENDATION_ACCEPTED: "recommendation_accepted",
  RECOMMENDATION_IGNORED: "recommendation_ignored",
  ALERT_OPENED: "alert_opened",
  ALERT_DISMISSED: "alert_dismissed",
  HELP_OPENED: "help_opened",
});

export const ADAPTIVE_SURFACES = Object.freeze({
  SHS_WORKSPACE_DASHBOARD: "shs_workspace_dashboard",
  SHS_COMMAND_SURFACE: "shs_command_surface",
  SHF_IMPACT_CENTER: "shf_impact_center",
  HUB_WORKSPACE_DASHBOARD: "hub_workspace_dashboard",
  HUB_INTAKE_NAVIGATOR: "hub_intake_navigator",
  HUB_ACTION_QUEUE: "hub_action_queue",
  HUB_REFERRAL_TRACKER: "hub_referral_tracker",
  HUB_REFERRAL_LIFECYCLE: "hub_referral_lifecycle",
  HUB_FILES_IMPORTS: "hub_files_imports",
  HUB_REPORTS: "hub_reports",
  OUTCOMES_EXCHANGE_FUTURE: "outcomes_exchange_future",
});

export const ADAPTIVE_ROLES = Object.freeze({
  ADMIN: "admin",
  OPERATOR: "operator",
  HUB_OPERATOR: "hub_operator",
  PARTNER: "partner",
  FUNDER: "funder",
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  INVESTOR: "investor",
  VIEWER: "viewer",
  UNKNOWN: "unknown",
});

export const ADAPTIVE_PRIVACY_BLOCKED_KEYS = Object.freeze([
  "password",
  "ssn",
  "social_security_number",
  "bank_account",
  "credit_card",
  "medical_record_number",
  "raw_case_notes",
  "private_message_body",
]);
