export const tourSteps = [
  {
    id: "kpis",
    target: "[data-tour='kpis']",
    placement: "bottom",
    title: "System Pulse",
    content: {
      primary:
        "These KPIs give a quick read on scale, verified impact, funding movement, and current operating state.",
      why:
        "This is the fastest way to understand whether the foundation is healthy before going deeper.",
      action:
        "Next, move into the Ohio impact view to see where activity is concentrated.",
    },
  },
  {
    id: "map",
    target: "[data-tour='map']",
    placement: "right",
    title: "Geographic Impact",
    content: {
      primary:
        "This map section shows where programs, funding, and measurable outcomes are concentrated across Ohio.",
      why:
        "Geography helps turn impact into visible territory, not just abstract reporting.",
      action:
        "Next, review the analyst layer to see what the system recommends.",
    },
  },
  {
    id: "analyst",
    target: "[data-tour='analyst']",
    placement: "left",
    title: "AI Analyst",
    content: {
      primary:
        "This panel surfaces recommended actions, priorities, and what leadership should pay attention to next.",
      why:
        "This is the decision layer that turns visibility into guided action.",
      action:
        "Finally, confirm trust and verification strength.",
    },
  },
  {
    id: "trust",
    target: "[data-tour='trust']",
    placement: "top",
    title: "Trust, Proof & Verification",
    content: {
      primary:
        "This section validates reporting coverage, audit integrity, and proof readiness.",
      why:
        "This is what makes the command center funder-grade instead of just visually impressive.",
      action:
        "Tour complete. From here, explore the command center with context.",
    },
  },
];
