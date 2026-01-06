// src/utils/northstarAdapter.js
/**
 * Adapts your *old* dashboard objects (whatever shape they were)
 * into the standard Northstar seed used by the new dashboards.
 *
 * This is defensive: pass partial/unknown shapes and you'll still
 * get a valid seed back.
 */
export function adaptCareerOldToNS(old = {}) {
    const m = old.metrics || old.meta || old; // support nested shapes
    const stepsDone = Number(m?.fundingStepsCompleted ?? m?.funding_done ?? 0);
    const stepsTotal = Number(m?.fundingStepsTotal ?? m?.funding_total ?? 4);
  
    return {
      kpis: [
        {
          id: "readiness",
          label: "Program Readiness",
          value: Number(m?.readinessPct ?? m?.readiness ?? 0),
          unit: "%",
          goal: 100,
          higherIsBetter: true,
        },
        {
          id: "fundingSteps",
          label: "Funding Steps",
          value: stepsDone,
          unit: `of ${stepsTotal}`,
          goal: stepsTotal || 4,
          higherIsBetter: true,
        },
        {
          id: "placement",
          label: "Placement Score",
          value: Number(m?.placementScore ?? m?.placement ?? 0),
          unit: "",
          goal: 100,
          higherIsBetter: true,
        },
      ],
      nextActions: arr(old.nextActions, old.actions, old.todos, [
        "Book career coach call",
        "Upload updated résumé",
        "Submit internship preferences",
      ]),
      milestones: arr(old.milestones, old.events, [
        "Completed Unit 2",
        "Uploaded Portfolio Artifact",
        "Joined live mentor session",
      ]),
      links: linkify(
        old.links,
        [
          { to: "/planner", label: "Open Planner" },
          { to: "/portfolio", label: "View Portfolio" },
          { to: "/learn", label: "Continue Learning" },
        ]
      ),
    };
  }
  
  export function adaptDebtOldToNS(old = {}) {
    const m = old.metrics || old.meta || old;
    return {
      kpis: [
        {
          id: "totalDebt",
          label: "Total Debt",
          value: Number(m?.totalDebt ?? m?.debt ?? 0),
          unit: "$",
          goal: 0,
          higherIsBetter: false,
        },
        {
          id: "utilization",
          label: "Utilization",
          value: Number(m?.utilPct ?? m?.utilizationPct ?? 0),
          unit: "%",
          goal: 30,
          higherIsBetter: false,
        },
        {
          id: "payoffVelocity",
          label: "Payoff Velocity",
          value: Number(m?.streakMonths ?? m?.payoffStreak ?? 0),
          unit: "mo",
          goal: 12,
          higherIsBetter: true,
        },
      ],
      nextActions: arr(old.nextActions, old.todos, [
        "Enable round-up payments",
        "Queue snowball transfer",
        "Confirm autopay date",
      ]),
      milestones: arr(old.milestones, [
        "Paid off Store Card",
        "Reduced APR via negotiation",
        "3 on-time payments recorded",
      ]),
      links: linkify(old.links, [
        { to: "/plan", label: "Open Repayment Plan" },
        { to: "/ledger", label: "View Ledger" },
      ]),
    };
  }
  
  /* ---------------- helpers ---------------- */
  function arr(...candidates) {
    for (const c of candidates) {
      if (Array.isArray(c) && c.length) return c.map(String);
    }
    return [];
  }
  
  function linkify(source, fallback) {
    if (Array.isArray(source) && source.length) {
      return source
        .filter(Boolean)
        .map((x) =>
          typeof x === "string" ? { to: x, label: x } : { to: x.to, label: x.label }
        );
    }
    return fallback || [];
  }
  