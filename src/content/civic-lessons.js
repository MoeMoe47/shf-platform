// src/content/civic-lessons.js
// Universal, shell-free lesson data you can reuse across apps.

export const CIVIC_LESSONS = [
  {
    id: "intro-civic",
    title: "Welcome to SHF Civic",
    estMins: 5,
    tags: ["orientation", "start-here"],
    summary:
      "Quick tour of every page in the Civic app and how missions feed your Portfolio and Rewards.",
    steps: [
      {
        type: "text",
        title: "What this app does",
        body:
          "Civic gives students a safe sandbox for real-world governance: missions, proposals, elections, and a treasury simulator.",
      },
      {
        type: "task",
        title: "Open the main Dashboard",
        body: "Look for KPIs, quick links, and your points.",
        ctaLabel: "Go to Dashboard",
        href: "/civic.html#/dashboard",
      },
      {
        type: "task",
        title: "Peek at Northstar",
        body: "See outcome-level KPIs and activity trend.",
        ctaLabel: "Open Northstar",
        href: "/civic.html#/dashboard-ns",
      },
      {
        type: "task",
        title: "Try a Treasury scenario",
        body:
          "Move the sliders, watch the balance, and **Save Snapshot**. You’ll see it later in Snapshots.",
        ctaLabel: "Open Treasury Simulator",
        href: "/civic.html#/treasury-sim",
      },
      {
        type: "task",
        title: "Where do my artifacts live?",
        body:
          "Open your **Portfolio**. This is where snapshots, proposals, and profile results can be saved.",
        ctaLabel: "Open Portfolio",
        href: "/civic.html#/portfolio",
      },
      {
        type: "text",
        title: "Earn rewards",
        body:
          "Completing lessons/missions bumps KPIs and can award points. Check the Rewards Wallet any time.",
      },
    ],
  },

  {
    id: "page-explainer",
    title: "What Each Civic Page Is For",
    estMins: 8,
    tags: ["how-to"],
    summary:
      "A plain-language guide for every sidebar item so students always know what to do next.",
    steps: [
      { type: "text", title: "Assignments", body: "Your lesson list. Start here." },
      { type: "text", title: "Lesson", body: "The in-app reader. Opens a specific lesson." },
      { type: "text", title: "Elections", body: "Run mock campaigns; vote on outcomes." },
      { type: "text", title: "Proposals", body: "Author policy ideas; submit to vote." },
      { type: "text", title: "Treasury Simulator", body: "Allocate budgets; save snapshots." },
      { type: "text", title: "Issue Survey", body: "Capture stances; feed your Profile." },
      { type: "text", title: "Profile Results", body: "See your positions and change over time." },
      { type: "text", title: "Portfolio", body: "All saved artifacts in one place." },
      { type: "task", title: "Jump to Assignments", ctaLabel: "Open Assignments", href: "/civic.html#/assignments" },
    ],
  },
];
