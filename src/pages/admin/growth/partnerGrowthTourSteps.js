export const partnerGrowthTourSteps = [
  {
    id: "pg-command-header",
    target: "[data-tour='pg-command-header']",
    title: "Step 1 — Start With the Growth Question",
    content: {
      primary:
        "Use the Growth Engine after Hub activity starts revealing repeated needs, strong partner interest, service-lane demand, or funding opportunities.",
      why:
        "This page is not the first page a normal client starts with. It is where client admins and SHS admins turn Hub signals into growth opportunities.",
      action:
        "Start by asking: is this a real opportunity, a service gap, a funding lead, a partner bundle, or a pipeline item?",
    },
  },
  {
    id: "pg-sidebar",
    target: "[data-tour='pg-sidebar']",
    title: "Step 2 — Understand This Is an Admin Growth Surface",
    content: {
      primary:
        "The left sidebar organizes growth work across opportunities, referrals, pilots, funding, employers, pharmacy, service lanes, partners, reports, documents, integrations, and settings.",
      why:
        "This page has more power than regular client workflow pages, so Identity Layer access matters.",
      action:
        "Use this page when the role is client_admin or shs_admin. Regular client users should stay in the Hub workflow pages.",
    },
  },
  {
    id: "pg-topbar",
    target: "[data-tour='pg-topbar']",
    title: "Step 3 — Search Before Creating New Work",
    content: {
      primary:
        "Use the top search area to look for partners, opportunities, referrals, or service lanes before creating a new record.",
      why:
        "Searching first prevents duplicate opportunities and keeps the growth pipeline clean.",
      action:
        "Search the partner or opportunity name before clicking Add Opportunity or preparing a new pilot packet.",
    },
  },
  {
    id: "pg-actions",
    target: "[data-tour='pg-actions']",
    title: "Step 4 — Choose the Correct Growth Action",
    content: {
      primary:
        "The main actions let you add an opportunity, create a referral, prepare a pilot packet, or export a growth brief.",
      why:
        "Each button should represent a real business step, not just a UI action.",
      action:
        "Use Add Opportunity for a new lead, Create Referral for operational handoff, Prepare Pilot Packet for a serious pilot, and Export Growth Brief for leadership or partner review.",
    },
  },
  {
    id: "pg-strategy",
    target: "[data-tour='pg-strategy']",
    title: "Step 5 — Check the Strategy Strip",
    content: {
      primary:
        "The strategy strip shows strategic priority, Q2 progress, pipeline value, closed won value, and active partners.",
      why:
        "This helps the user understand whether growth activity is aligned with the current strategy.",
      action:
        "Use this before deciding whether to prioritize a new opportunity or focus on moving existing opportunities forward.",
    },
  },
  {
    id: "pg-kpis",
    target: "[data-tour='pg-kpis']",
    title: "Step 6 — Read the Growth Health Signals",
    content: {
      primary:
        "The KPI row shows active opportunities, referral queue, pilot prospects, funding leads, employer leads, pharmacy leads, service-lane fit, and report-ready partners.",
      why:
        "These signals show where the strongest growth pressure and opportunity value are coming from.",
      action:
        "If pilot prospects are high, prepare pilot packets. If service-lane fit is high, route opportunities to the right lane. If report-ready partners are high, move toward reports and briefs.",
    },
  },
  {
    id: "pg-pipeline",
    target: "[data-tour='pg-pipeline']",
    title: "Step 7 — Move Opportunities Through the Pipeline",
    content: {
      primary:
        "The pipeline moves from New Lead to Discovery, Service Fit, Proposal, Pilot Ready, Contracting, Active, and Reporting.",
      why:
        "Growth should move in stages. A lead should not jump to proposal before service fit and discovery are clear.",
      action:
        "Review where opportunities are stuck. Move early leads into Discovery, serious leads into Service Fit, and ready leads into Proposal or Pilot Ready.",
    },
  },
  {
    id: "pg-content-main",
    target: "[data-tour='pg-content-main']",
    title: "Step 8 — Use the Main Work Area to Decide What to Build",
    content: {
      primary:
        "The main content area contains the service-lane router, opportunity cards, lane summaries, and converted Hub signals.",
      why:
        "This is where Hub signals turn into real growth decisions.",
      action:
        "Review service-lane fit first, then select the opportunity with the strongest priority score, confidence, and next-best action.",
    },
  },
  {
    id: "pg-ai-panel",
    target: "[data-tour='pg-ai-panel']",
    title: "Step 9 — Use the AI Growth Analyst for the Next Move",
    content: {
      primary:
        "The AI Growth Analyst explains adaptive next moves based on lane, selected opportunity, and local feedback events.",
      why:
        "The goal is not just to list opportunities. The goal is to recommend the strongest next action.",
      action:
        "Read the recommendation, check the confidence, then use it to prepare a pilot packet, proposal, brief, or partner follow-up.",
    },
  },
  {
    id: "pg-right-rail",
    target: "[data-tour='pg-right-rail']",
    title: "Step 10 — Use the Right Rail to Catch Risk and Recent Signals",
    content: {
      primary:
        "The right rail shows analyst guidance, referrals, recent growth feed activity, friction, and risk signals.",
      why:
        "Growth decisions should consider timing, referral pressure, partner readiness, and execution risk.",
      action:
        "Check the right rail before committing a lead to pilot, proposal, or contract review.",
    },
  },
  {
    id: "pg-feed",
    target: "[data-tour='pg-feed']",
    title: "Step 11 — Review Recent Growth Activity",
    content: {
      primary:
        "The growth feed shows recent events like pilot approvals, opportunities added, contract risk, referrals received, and briefs exported.",
      why:
        "This helps the user understand what already happened before creating duplicate actions.",
      action:
        "Check the feed before adding a new opportunity, exporting another brief, or escalating a contract risk.",
    },
  },
  {
    id: "pg-friction",
    target: "[data-tour='pg-friction']",
    title: "Step 12 — Check Friction Before Moving Too Fast",
    content: {
      primary:
        "The friction panel shows where opportunities may slow down, such as missing proof, unclear owner, weak service fit, compliance questions, or incomplete discovery.",
      why:
        "A high-value opportunity can still fail if friction is ignored.",
      action:
        "Resolve the biggest friction item before moving to proposal, pilot packet, or contract review.",
    },
  },
  {
    id: "pg-detail-drawer",
    target: "[data-tour='pg-detail-drawer']",
    title: "Step 13 — Use the Detail Drawer for Final Review",
    content: {
      primary:
        "The detail drawer gives a deeper view of the selected opportunity, including value, lane fit, risk, recommendation, and next action.",
      why:
        "This is where the user should confirm whether the opportunity is ready to move forward.",
      action:
        "Open the drawer before converting, routing, or preparing a pilot packet for a major opportunity.",
    },
  },
  {
    id: "pg-learning-drawer",
    target: "[data-tour='pg-learning-drawer']",
    title: "Step 14 — Use Learning Reports to Improve the Engine",
    content: {
      primary:
        "The learning drawer shows adaptive feedback such as recommendation clicks, referral friction, strongest source, fastest lane, and expansion lane.",
      why:
        "The Growth Engine should learn which recommendations and lanes actually produce results.",
      action:
        "Use this report to improve scoring rules, next-best actions, and future Hub-to-growth recommendations.",
    },
  },
  {
    id: "pg-command-header",
    target: "[data-tour='pg-command-header']",
    title: "Step 15 — Know Where Growth Connects Next",
    content: {
      primary:
        "After reviewing growth signals, the next page should usually be Hub Growth Network, Hub Intelligence, Bundle Builder, Opportunities, Sales Pipeline, or Reports.",
      why:
        "The Growth Engine identifies and prioritizes opportunity. The business-network pages help package, score, sell, and track it.",
      action:
        "Use Hub Intelligence for scoring, Bundle Builder for partner packages, Opportunities for deal review, Sales Pipeline for follow-up, and Reports for leadership proof.",
    },
  },
];

export default partnerGrowthTourSteps;
