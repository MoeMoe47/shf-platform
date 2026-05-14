export const unifiedTruthCommandTourSteps = [
  {
    id: "utc-header",
    target: "[data-tour='utc-header']",
    title: "Step 1 — Understand the SHS Command Surface",
    content: {
      primary:
        "This is the SHS Command Surface. Use it to see system status, verification strength, Oracle truth, reporting readiness, and the next actions the operator should take.",
      why:
        "This page is the operating control layer for SHS. It turns raw activity into proof, decisions, reports, and audit-ready records.",
      action:
        "Start by confirming the header chips show Oracle, verification, contradictions, reporting readiness, and ledger sync status.",
    },
  },
  {
    id: "utc-rail",
    target: "[data-tour='utc-rail']",
    title: "Step 2 — Use the Left Command Navigation",
    content: {
      primary:
        "The left rail shows the command areas: Overview, Intake, Aggregation, Verification, Reconciliation, Oracle, Analyst, Actions, Reports, Audit Ledger, and Settings.",
      why:
        "This tells the operator which layer of the SHS truth pipeline they are working in.",
      action:
        "Use this rail to understand the workflow order: intake data, aggregate it, verify it, reconcile contradictions, judge truth, then report.",
    },
  },
  {
    id: "utc-kpis",
    target: "[data-tour='utc-kpis']",
    title: "Step 3 — Read the Command KPIs",
    content: {
      primary:
        "Read these cards from left to right: People Served, Verified Outcomes, Programs Active, Funding Deployed, Risk Alerts, and Grant Readiness.",
      why:
        "These cards explain the current state of the system before the operator goes deeper.",
      action:
        "If Risk Alerts are high or Grant Readiness is low, slow down and review Oracle, verification, and action recommendations before reporting.",
    },
  },
  {
    id: "utc-context-banner",
    target: "[data-tour='utc-context-banner']",
    title: "Step 4 — Read the Command Context",
    content: {
      primary:
        "The command context banner explains what the system is focused on and what the current recommendation means.",
      why:
        "This prevents the operator from guessing why the page is asking for action.",
      action:
        "Read this before choosing an action. It explains the situation the command surface is reacting to.",
    },
  },
  {
    id: "utc-intake",
    target: "[data-tour='utc-intake']",
    title: "Step 5 — Review Intake and Queue Pressure",
    content: {
      primary:
        "This panel shows incoming cases, flagged entities, pending verification, unresolved contradictions, and priority actions.",
      why:
        "This is the first pressure point. It tells the operator what work is entering the system and what is waiting.",
      action:
        "If pending verification or contradictions are high, review them before releasing reports.",
    },
  },
  {
    id: "utc-map",
    target: "[data-tour='utc-map']",
    title: "Step 6 — Read the Statewide Intelligence Map",
    content: {
      primary:
        "The map shows the statewide intelligence picture, including impact intensity, active programs, risk, and data gaps.",
      why:
        "The map helps the operator see where impact and risk are concentrated instead of reading only tables.",
      action:
        "Use the map to understand geographic focus before acting on a county, program, or report.",
    },
  },
  {
    id: "utc-oracle",
    target: "[data-tour='utc-oracle']",
    title: "Step 7 — Check Oracle Truth and Trust",
    content: {
      primary:
        "This right-side stack contains the Oracle Truth Package, AI Analyst Narrative, and Trust & Verification panel.",
      why:
        "This is where SHS explains whether the information is trusted, verified, and ready for action.",
      action:
        "Do not publish or export until Oracle truth, trust, verification, and analyst guidance look strong enough.",
    },
  },
  {
    id: "utc-actions",
    target: "[data-tour='utc-actions']",
    title: "Step 8 — Choose Recommended Next Actions",
    content: {
      primary:
        "This section gives the operator recommended actions like requesting a case packet, escalating verification, triggering follow-up, or releasing a board brief.",
      why:
        "A command surface should not only show information. It should tell the operator what to do next.",
      action:
        "Choose the action that fits the current risk, confidence, requirement, and expected result.",
    },
  },
  {
    id: "utc-guidance",
    target: "[data-tour='utc-guidance']",
    title: "Step 9 — Use the Context Guidance Drawer",
    content: {
      primary:
        "The guidance drawer explains why the system is recommending a move and how the operator should think about it.",
      why:
        "This makes the system easier to understand and keeps users from blindly clicking actions.",
      action:
        "Open this drawer when the user needs help understanding the recommendation or workflow.",
    },
  },
  {
    id: "utc-activity",
    target: "[data-tour='utc-activity']",
    title: "Step 10 — Confirm Recent Command Activity",
    content: {
      primary:
        "Recent Command Activity shows confirmed operator actions logged from the command workflow.",
      why:
        "This creates accountability and helps prove what happened after the system recommended an action.",
      action:
        "After logging an action, check this panel to confirm it was recorded.",
    },
  },
  {
    id: "utc-reporting",
    target: "[data-tour='utc-reporting']",
    title: "Step 11 — Use the Reporting Dock",
    content: {
      primary:
        "The Reporting Dock turns verified system state into executive briefs, institutional reports, grant narratives, public snapshots, technical appendices, and custom reports.",
      why:
        "This is one of the strongest SHS value points: verified activity becomes funder-ready and leadership-ready reporting.",
      action:
        "Use reporting only after verification, Oracle truth, and command actions are clear.",
    },
  },
  {
    id: "utc-lower",
    target: "[data-tour='utc-lower']",
    title: "Step 12 — Complete the Command Workflow",
    content: {
      primary:
        "The lower workflow area ties actions, activity, reporting, and system outputs together.",
      why:
        "This is where the command surface becomes an operating system instead of a static dashboard.",
      action:
        "Use this area to move from insight to action to report-ready proof.",
    },
  },
];
