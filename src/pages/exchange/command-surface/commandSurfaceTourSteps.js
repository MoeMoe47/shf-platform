export const commandSurfaceTourSteps = [
  {
    id: "command-surface-header",
    target: "[data-tour='command-surface-header']",
    title: "Step 1 — Understand the Command Surface",
    content: {
      primary:
        "This is the SHS Command Surface. Use it to see the live operating state, trusted proof status, verification strength, analyst guidance, and next-best action.",
      why:
        "This page is not just a dashboard. It is the control layer that turns activity into proof, decisions, reporting readiness, and audit confidence.",
      action:
        "Start here by checking the header and confirming you are on the correct SHS command surface.",
    },
  },
  {
    id: "command-surface-kpis",
    target: "[data-tour='command-surface-kpis']",
    title: "Step 2 — Read the System Pulse",
    content: {
      primary:
        "Read these KPI cards from left to right: entities under watch, verified outcomes, open contradictions, trust coverage, and recommendation confidence.",
      why:
        "This tells you whether the system is healthy, trusted, and ready for decisions.",
      action:
        "If contradictions are high or trust coverage is low, slow down before exporting or publishing reports.",
    },
  },
  {
    id: "command-surface-live-situation",
    target: "[data-tour='command-surface-live-situation']",
    title: "Step 3 — Check the Live Situation",
    content: {
      primary:
        "This block tells you the active case, selected panel, audience, and latest change summary.",
      why:
        "Before making a decision, you need to know what case the system is focused on and what changed.",
      action:
        "Read the active case and change summary before moving into the map or analyst panels.",
    },
  },
  {
    id: "command-surface-left-rail",
    target: "[data-tour='command-surface-left-rail']",
    title: "Step 4 — Review Intake, Queue, and Alerts",
    content: {
      primary:
        "The left rail shows intake status, priority queue items, contradictions, alerts, and system change summary.",
      why:
        "This is where the operator sees what may block progress or require review.",
      action:
        "Check this rail first when there are contradictions, flagged entities, or pending verification.",
    },
  },
  {
    id: "command-surface-map",
    target: "[data-tour='command-surface-map']",
    title: "Step 5 — Read the Intelligence Surface",
    content: {
      primary:
        "The center surface shows the statewide intelligence view. It helps operators understand where activity, risk, and signals are concentrated.",
      why:
        "A command system needs more than tables. It needs a visual operating surface so patterns are easier to understand.",
      action:
        "Use this section to understand where the system is focused before choosing the next action.",
    },
  },
  {
    id: "command-surface-right-rail",
    target: "[data-tour='command-surface-right-rail']",
    title: "Step 6 — Review Oracle, Analyst, and Trust",
    content: {
      primary:
        "The right rail contains the Oracle Truth Package, AI Analyst Narrative, and Trust & Verification panels.",
      why:
        "This is where SHS explains whether the data is trusted, what the analyst recommends, and whether proof is strong enough.",
      action:
        "Do not act only from the map. Check the Oracle and Trust panels before making a decision.",
    },
  },
  {
    id: "command-surface-recommendation",
    target: "[data-tour='command-surface-recommendation']",
    title: "Step 7 — Read the Recommended Next Move",
    content: {
      primary:
        "This strip explains the recommended next move and why the system is recommending it.",
      why:
        "This turns the command surface from a display into an action system.",
      action:
        "Read the recommendation reason, then decide whether the action is ready to execute.",
    },
  },
  {
    id: "command-surface-decision-actions",
    target: "[data-tour='command-surface-decision-actions']",
    title: "Step 8 — Choose the Decision Action",
    content: {
      primary:
        "This action bar is where the operator chooses or changes the active action state.",
      why:
        "A command surface should lead to a clear decision, not leave the user staring at signals.",
      action:
        "Choose the action that matches the current command state and evidence strength.",
    },
  },
  {
    id: "command-surface-reporting",
    target: "[data-tour='command-surface-reporting']",
    title: "Step 9 — Use the Reporting Dock",
    content: {
      primary:
        "The Reporting Dock lets the operator generate or open a decision-grade brief tied to the current command state.",
      why:
        "This is where SHS turns operational state into a reportable asset.",
      action:
        "Use reporting actions only after the proof, trust, and recommendation state are clear.",
    },
  },
  {
    id: "command-surface-status",
    target: "[data-tour='command-surface-status']",
    title: "Step 10 — Confirm System Status",
    content: {
      primary:
        "The System Status panel confirms whether live command data loaded, whether there are errors, the selected action, and the current panel mode.",
      why:
        "This prevents operators from acting on stale or broken state.",
      action:
        "Before trusting the command surface, confirm there is no active load error.",
    },
  },
];
