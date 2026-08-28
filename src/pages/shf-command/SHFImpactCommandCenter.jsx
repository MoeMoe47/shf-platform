import React, {useCallback, useEffect, useMemo, useState} from "react";
import { useSelectedEntity } from "@/system/context/SelectedEntityContext";
import "./shf-impact-command-center.css";
import { resolveCountyFromEntity } from "@/system/resolvers/entityToCounty";
import { fetchWorkforceEmploymentStartedVerifiedCountReport } from "@/shared/reporting/workforceEmploymentReportingClient";
import {
  authorizeDonorSummaryDistribution,
  createDonorSummaryArtifact,
  listApprovedDonorDisclosures,
  listAuthorizedReportRecipients,
} from "@/shared/reporting/donorSummaryAuthorizationClient";


const SELF_AUDIT_BASE = "http://127.0.0.1:8090";

const ORACLE_BASE = "http://127.0.0.1:8091";

const ORACLE_ENDPOINTS = {
  truth: "/oracle/truth",
  compare: "/oracle/compare",
  priority: "/oracle/priority",
};

async function fetchOracleBundle({ entityId, county }) {
  const ids = entityId ? `${entityId},test_case_002` : "test_case_001,test_case_002";

  const truthUrl = entityId
    ? `${ORACLE_BASE}${ORACLE_ENDPOINTS.truth}/${encodeURIComponent(entityId)}`
    : null;

  const compareUrl = `${ORACLE_BASE}${ORACLE_ENDPOINTS.compare}?ids=${encodeURIComponent(ids)}`;
  const priorityUrl = `${ORACLE_BASE}${ORACLE_ENDPOINTS.priority}?ids=${encodeURIComponent(ids)}`;

  const [truthRes, compareRes, priorityRes] = await Promise.allSettled([
    truthUrl ? fetch(truthUrl) : Promise.resolve(null),
    fetch(compareUrl),
    fetch(priorityUrl),
  ]);

  async function readSettled(res) {
    if (!res || res.status !== "fulfilled") return null;
    if (!res.value || !res.value.ok) return null;
    try {
      return await res.value.json();
    } catch {
      return null;
    }
  }

  return {
    truth: await readSettled(truthRes),
    compare: await readSettled(compareRes),
    priority: await readSettled(priorityRes),
  };
}


function SHFAIAnalystTruthDrawer({ drawerState, onClose }) {
  if (!drawerState?.open) return null;

  const context = drawerState.truthContext || {};
  const mapContext = drawerState.mapContext || {};
  const source = drawerState.source || "ai_analyst_panel";

  const rows = [
    ["Truth Status", context.truthStatus || "unknown"],
    ["Verification", context.verificationStatus || "unknown"],
    ["Readiness", context.readinessStatus || "unknown"],
    ["Risk Level", context.riskLevel || "unknown"],
    ["Decision Posture", context.decisionPosture || "unknown"],
    ["Confidence", context.confidenceScore != null ? `${context.confidenceScore} (${context.confidenceBand || "unknown"})` : "—"],
    ["Trust Envelope", context.trustEnvelopePresent ? "present" : "missing"],
    ["Trace Coverage", context.traceCoverageStatus || "unknown"],
    ["Trace ID", context.traceId || "—"],
    ["Publication Mode", context.publicationMode || "internal"],
    ["Selected County", context.selectedCounty || mapContext.selected_county || mapContext.county || "Ohio"],
    ["Selected Entity", context.selectedEntityId || "shf-impact-command-center"],
    ["Source", source],
  ];

  return (
    <div
      className="shf-ai-truth-drawer-backdrop"
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(2, 6, 23, 0.58)",
        backdropFilter: "blur(4px)",
      }}
    >
      <aside
        className="shf-ai-truth-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="AI Analyst Truth Context"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "fixed",
          top: 18,
          right: 18,
          bottom: 18,
          width: "min(520px, calc(100vw - 36px))",
          zIndex: 9999,
          borderRadius: 24,
          border: "1px solid rgba(125, 211, 252, 0.25)",
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
          color: "#e5eefb",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
          padding: 22,
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                color: "#7dd3fc",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              AI Analyst Drawer V1
            </div>
            <h2 style={{ margin: "6px 0 0", fontSize: 24 }}>
              Truth Spine Context
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(203, 213, 225, 0.86)",
                lineHeight: 1.55,
              }}
            >
              This drawer shows the certified context the analyst is using before recommending action.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid rgba(148, 163, 184, 0.3)",
              background: "rgba(15, 23, 42, 0.85)",
              color: "#e5eefb",
              borderRadius: 999,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(34, 197, 94, 0.22)",
            background: "rgba(34, 197, 94, 0.08)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: "#bbf7d0",
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            Recommended Next Move
          </div>
          <div style={{ lineHeight: 1.6 }}>
            {context.recommendation || "Await verified Truth Spine context before action."}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "150px 1fr",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 14,
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(148, 163, 184, 0.14)",
              }}
            >
              <span style={{ color: "rgba(148, 163, 184, 0.96)", fontSize: 13 }}>
                {label}
              </span>
              <strong style={{ color: "#f8fafc", fontSize: 13 }}>
                {String(value)}
              </strong>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(125, 211, 252, 0.18)",
            background: "rgba(14, 165, 233, 0.07)",
          }}
        >
          <div
            style={{
              color: "#bae6fd",
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Why It Matters
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {(context.whyPoints || []).slice(0, 10).map((point, index) => (
              <li key={`${point}-${index}`}>{point}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}


function normalizeOracleInsight(bundle, county) {
  const truth = bundle?.truth || {};
  const priority = bundle?.priority || {};

  return {
    changedText:
      truth?.recommendedNextAction ||
      "No Oracle insight available",

    whyPoints: [
      `Truth Status: ${truth?.truthStatus || "unknown"}`,
      `Verification: ${truth?.verificationStatus || "unknown"}`,
      `Confidence: ${truth?.confidenceScore || "—"}`,
    ],

    nextMoveText:
      truth?.recommendedNextAction ||
      "Await further validation.",

    actionLabel: "Execute Oracle recommendation",

    confidence:
      truth?.confidenceScore != null
        ? String(truth.confidenceScore)
        : null,

    priorityLabel:
      priority?.priority || "Monitor",

    raw: { truth, priority }
  };
}

async function fetchSelfAuditLatest() {
  const res = await fetch(`${SELF_AUDIT_BASE}/self-audit/latest`);
  if (!res.ok) throw new Error(`latest audit request failed: ${res.status}`);
  return res.json();
}

async function fetchSelfAuditLatestBrief() {
  const res = await fetch(`${SELF_AUDIT_BASE}/self-audit/latest/brief`);
  if (!res.ok) throw new Error(`latest brief request failed: ${res.status}`);
  return res.json();
}

async function runSelfAuditNow() {
  const res = await fetch(`${SELF_AUDIT_BASE}/self-audit/run?requested_by=command_center`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`manual self-audit failed: ${res.status}`);
  return res.json();
}

function formatAuditDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

import TourProvider from "@/system/tour/TourProvider";
import ImpactKpiBand from "./sections/ImpactKpiBand";
import AIAnalystPanel from "./sections/AIAnalystPanel";
import TrustVerificationPanel from "./sections/TrustVerificationPanel";

const SHF_COMMAND_LOGO_SRC = "/assets/shf-command/brand/shf-globe-logo.png";
const SHF_REPORT_GENERATOR_HREF = import.meta.env.DEV
  ? "http://127.0.0.1:5174/foundation/impact-report"
  : "/foundation/impact-report";

const SHF_COMMAND_TOUR_STEPS = [
  {
    number: "01",
    target: "header",
    selector: "[data-tour-section='header'], .shf-brand",
    title: "Start With the Command Header",
    body: "Use the header first. Confirm this is the SHF Impact Command Center, set the reporting period, confirm the Ohio statewide scope, and save Export Report for the end.",
    why: "The header sets the operating context for every number and recommendation on the page.",
    action: "Confirm reporting period and scope before reading the dashboard."
  },
  {
    number: "02",
    target: "kpis",
    selector: ".shf-kpi-grid, .shf-kpi-row, .shf-metrics-grid",
    title: "Read the KPI Row Before You Drill Down",
    body: "Use the KPI cards as the executive snapshot: people served, active programs, verified outcomes, funding deployed, risk alerts, and grant readiness.",
    why: "This tells you whether the system is healthy before you inspect counties or reports.",
    action: "Start with Risk Alerts and Grant Readiness. If either is weak, investigate before export."
  },
  {
    number: "03",
    target: "state",
    selector: ".shf-command-state-strip, .shf-command-context-strip",
    title: "Confirm the System Context",
    body: "This area shows what the system thinks is selected: entity, county, Oracle state, last map action, last drawer action, and readiness.",
    why: "A report is only trustworthy if the selected context matches what the operator is reviewing.",
    action: "Check that the county, entity, and Oracle state match your current decision."
  },
  {
    number: "04",
    target: "map",
    selector: ".shf-map-panel, .shf-impact-map-root, .shf-impact-map-stage",
    title: "Use the Ohio Map as the Control Surface",
    body: "Click a county to move from statewide mode into county focus. The selected county should glow, the regional layer should open, and the AI Analyst should update.",
    why: "The map is the main operator control for moving from statewide oversight into local county action.",
    action: "Click a county, then confirm the AI Analyst shows the same county."
  },
  {
    number: "05",
    target: "county",
    selector: ".shf-regional-detail-panel, .shf-impact-map-stage",
    title: "Use County Focus for Local Decisions",
    body: "County focus shows the selected county, risk state, funding state, confidence, and next county packet step.",
    why: "This turns the statewide map into a local decision surface.",
    action: "Use county focus to decide whether the county needs review, funding analysis, or a county packet."
  },
  {
    number: "06",
    target: "ai",
    selector: ".shf-ai-analyst-panel",
    title: "Use the AI Analyst After Selecting a County",
    body: "The AI Analyst explains what changed, why it matters, and what to do next based on map, drawer, and Oracle context.",
    why: "The analyst is strongest after the map and selected county are synchronized.",
    action: "If Oracle is unknown, refresh Oracle before treating the recommendation as final."
  },
  {
    number: "07",
    target: "impact",
    selector: "[data-tour-section='impact'], .shf-impact-overview, .shf-overview-panel",
    title: "Read the Impact Overview",
    body: "Use the impact overview to explain verification, funding, governance, reporting, audit, reserves, and community impact.",
    why: "This gives leadership and funders a simple view of the ecosystem’s proof structure.",
    action: "Use this section when preparing leadership or funder explanations."
  },
  {
    number: "08",
    target: "programs",
    selector: ".shf-program-health, [data-tour-section='programs']",
    title: "Review Program Health",
    body: "Review which programs are expanding, growing, in progress, or need intervention.",
    why: "Program health tells operators where to focus before reports are generated.",
    action: "Prioritize rows marked intervention, elevated risk, or low readiness."
  },
  {
    number: "09",
    target: "reports",
    selector: "[data-tour-section='reports'], .shf-reports-briefings",
    title: "Review Reports and Briefings",
    body: "This section shows whether leadership-ready materials are available: board brief, grant narrative, donor summary, public impact snapshot, and program health memo.",
    why: "Different audiences need different report types.",
    action: "Only export when the report needed for the audience is ready."
  },
  {
    number: "10",
    target: "proof",
    selector: "[data-tour-section='proof'], .shf-trust-verification-panel, .shf-proof-layer",
    title: "Confirm the Proof Layer",
    body: "The proof layer checks reporting coverage, audit integrity, ledger sync, missing reports, and memo readiness.",
    why: "This prevents weak or incomplete proof from becoming a formal report.",
    action: "Fix missing reports or evidence gaps before export."
  },
  {
    number: "11",
    target: "audit",
    selector: ".shf-self-audit-card, .shf-self-audit-panel, .shf-self-audit",
    title: "Run the Self-Audit",
    body: "The Daily Integrity Cycle checks whether the system is in a healthy operating state before major decisions.",
    why: "The self-audit protects the institution before board, funder, or public-facing outputs.",
    action: "Run Audit Now before important exports or executive summaries."
  },
  {
    number: "12",
    target: "footer",
    selector: ".shf-command-footer",
    title: "Finish With the Operating Footer",
    body: "The footer confirms this page is part of the Silicon Heartland Foundation impact system powered by SHS infrastructure.",
    why: "It closes the workflow by reinforcing the verified outcomes and infrastructure story.",
    action: "Finish only after outcomes, readiness, Oracle truth, proof layer, and reports are checked."
  }
];

import ReportsBriefingsPanel from "./sections/ReportsBriefingsPanel";
import ImpactOverviewWheelPanel from "./sections/ImpactOverviewWheelPanel";
import SHFImpactOhioMap from "./components/SHFImpactOhioMap";

const KPIS = [
  { key: "people", label: "People Served", value: "12,482", delta: "+ 8.2%", sublabel: "Last 30 Days" },
  { key: "programs", label: "Programs Active", value: "18", delta: "+ 1", sublabel: "System Wide" },
  { key: "verified", label: "Verified Outcomes", value: "8,217", delta: "+ 6.4%", sublabel: "Last 30 Days" },
  { key: "funding", label: "Funding Deployed", value: "$29.5M", delta: "+ $1.2M", sublabel: "Last 30 Days" },
  { key: "risk", label: "Risk Alerts", value: "3", delta: "", sublabel: "Priority Watchlist" },
  { key: "readiness", label: "Grant Readiness", value: "91%", delta: "Readiness", sublabel: "Institutional Score" },
];
const REPORTING_DATA_AVAILABLE = false;

const COUNTIES = [
  { id: "franklin", name: "Franklin County", x: 58, y: 33, shade: "high", programs: 5, people: "3,824", funding: "$4.5M", topOutcome: "82%", risk: "Stable" },
  { id: "cuyahoga", name: "Cuyahoga County", x: 66, y: 18, shade: "high", programs: 4, people: "2,406", funding: "$3.2M", topOutcome: "79%", risk: "Watch" },
  { id: "hamilton", name: "Hamilton County", x: 34, y: 66, shade: "mid", programs: 3, people: "1,955", funding: "$2.1M", topOutcome: "74%", risk: "Stable" },
  { id: "summit", name: "Summit County", x: 63, y: 28, shade: "mid", programs: 2, people: "1,240", funding: "$1.4M", topOutcome: "71%", risk: "Opportunity" },
  { id: "montgomery", name: "Montgomery County", x: 40, y: 52, shade: "mid", programs: 2, people: "1,112", funding: "$1.1M", topOutcome: "69%", risk: "Stable" },
  { id: "lucas", name: "Lucas County", x: 52, y: 8, shade: "mid", programs: 2, people: "913", funding: "$940K", topOutcome: "67%", risk: "Stable" },
  { id: "delaware", name: "Delaware County", x: 58, y: 27, shade: "low", programs: 1, people: "622", funding: "$610K", topOutcome: "73%", risk: "Stable" },
  { id: "licking", name: "Licking County", x: 65, y: 37, shade: "low", programs: 1, people: "508", funding: "$525K", topOutcome: "66%", risk: "Watch" },
];

const PROGRAMS = [
  {
    id: "career-launchpad",
    name: "Career Launchpad",
    status: "Expanding",
    locations: 20,
    funding: "$5.45M",
    trend: "+4.6M",
    risk: "Low",
    served: "5,450",
    note: "Strong placement momentum and high grant narrative value.",
  },
  {
    id: "recovery-housing",
    name: "Recovery Housing Pilot",
    status: "Intervene",
    locations: 8,
    funding: "$1,208",
    trend: "+3.8M",
    risk: "Elevated",
    served: "1,280",
    note: "Retention dip requires operator review and client-flow analysis.",
  },
  {
    id: "barber-pathway",
    name: "Barber Licensure Pathway",
    status: "In Progress",
    locations: 12,
    funding: "$1,434",
    trend: "+5.3M",
    risk: "Moderate",
    served: "980",
    note: "Healthy demand and certification path appeal.",
  },
  {
    id: "autism-awareness",
    name: "Autism Awareness Initiative",
    status: "Growing",
    locations: 9,
    funding: "$338",
    trend: "+2.6M",
    risk: "Low",
    served: "742",
    note: "Strong public narrative value and sponsor alignment potential.",
  },
];

function getActionsForCounty(selectedCounty) {
  const countyName = selectedCounty?.name || "Selected County";
  const countyShort = countyName.replace(/\s+County$/i, "").trim();

  return [
    `Expand Career Launchpad in ${countyName}`,
    `Intervene in the ${countyShort} Recovery Housing network due to declining client retention rates.`,
    `Prepare grant summary for Autism Awareness Initiative in ${countyName}.`,
    `Verify missing placement reports submitted by the ${countyShort} workforce network.`,
    `Generate donor brief for Barber Licensure Pathway activity in ${countyName}.`,
  ];
}

function getSimulationScenario(action, selectedCounty) {
  const normalized = String(action || "").toLowerCase();
  const countyName = selectedCounty?.name || "Unknown County";
  const region = countyName.replace(/\s+County$/i, "").trim();

  let program = "general_program";
  let issue = "Outcome risk + intervention flow";
  let priority = "MEDIUM";
  let demoCase = "emily";

  if (normalized.includes("career launchpad")) {
    program = "career_launchpad";
    issue = "Workforce placement expansion + funding readiness";
    priority = "HIGH";
    demoCase = "jason";
  } else if (normalized.includes("recovery housing")) {
    program = "recovery_housing";
    issue = "Retention decline + intervention pressure";
    priority = "HIGH";
    demoCase = "sophia";
  } else if (normalized.includes("autism")) {
    program = "autism_awareness";
    issue = "Grant narrative + sponsor alignment";
    priority = "MEDIUM";
    demoCase = "emily";
  } else if (normalized.includes("barber")) {
    program = "barber_licensure";
    issue = "Program visibility + donor brief readiness";
    priority = "MEDIUM";
    demoCase = "emily";
  }

  return {
    case: demoCase,
    contextCaseLabel: `${countyName} | ${program} | ${action}`,
    region,
    issue,
    priority,
    county: countyName,
    program,
    action,
  };
}
function buildAiActionPayload(action, selectedCounty) {
  const normalized = String(action || "").toLowerCase();

  if (normalized.includes("expand")) {
    return {
      title: "AI Recommended Action",
      summary: action,
      priority: "High",
      confidence: "90%",
      urgency: "IMMEDIATE",
      nextOutcome: "FUNDED",
      reasonSignals: [
        "Placement demand is rising in target county",
        "Projected outcome lift exceeds intervention cost",
        "Funding readiness is strong for expansion"
      ],
      metrics: [
        { label: "Priority", value: "High" },
        { label: "Confidence", value: "90%" },
        { label: "Urgency", value: "Immediate" },
        { label: "Next Outcome", value: "Funded" }
      ],
      actions: [
        "Open affected record",
        "Generate expansion memo",
        "Assign county rollout review"
      ],
      simulationScenario: getSimulationScenario(action, selectedCounty),
    };
  }

  if (normalized.includes("intervene")) {
    return {
      title: "AI Recommended Action",
      summary: action,
      priority: "Medium",
      confidence: "83%",
      urgency: "MONITOR",
      nextOutcome: "STABILIZED",
      reasonSignals: [
        "Retention trend has weakened",
        "Program condition shows intervention pressure",
        "Delay could reduce funding efficiency"
      ],
      metrics: [
        { label: "Priority", value: "Medium" },
        { label: "Confidence", value: "83%" },
        { label: "Urgency", value: "Monitor" },
        { label: "Next Outcome", value: "Stabilized" }
      ],
      actions: [
        "Open affected record",
        "Generate intervention memo",
        "Assign operations review"
      ],
      simulationScenario: getSimulationScenario(action, selectedCounty),
    };
  }

  return {
    title: "AI Recommended Action",
    summary: action,
    priority: "Low",
    confidence: "76%",
    urgency: "QUEUE",
    nextOutcome: "REVIEWED",
    reasonSignals: [
      "Action is valuable but not urgent",
      "Current system pressure is limited",
      "Can be handled in the next review cycle"
    ],
    metrics: [
      { label: "Priority", value: "Low" },
      { label: "Confidence", value: "76%" },
      { label: "Urgency", value: "Queue" },
      { label: "Next Outcome", value: "Reviewed" }
    ],
    actions: [
      "Open affected record",
      "Generate summary memo",
      "Queue for later review"
    ],
    simulationScenario: getSimulationScenario(action, selectedCounty),
  };
}

const TRUST_ITEMS = [
  { key: "coverage", label: "Reporting Coverage", value: "92%" },
  { key: "audit", label: "Audit Integrity", value: "PASS" },
  { key: "ledger", label: "Ledger Sync", value: "ACTIVE" },
  { key: "missing", label: "Missing Reports", value: "2" },
  { key: "memo", label: "Program Health Memo", value: "READY" },
];

const EXPORT_ITEMS = [
  { label: "Board Brief", subtitle: "Verified Employment Starts", value: "Unavailable" },
  { label: "Grant Narrative", value: "PASS" },
  { label: "Donor Summary", value: "Unavailable" },
  { label: "Public Impact Snapshot", value: "" },
  { label: "Program Health Memo", value: "" },
];



function buildAIInsight() {
  return null;
}


const WHEEL_SEGMENTS = [
  { label: "Outcome Verification", value: "18%", tone: "seg-1" },
  { label: "Funding", value: "17%", tone: "seg-2" },
  { label: "Funding", value: "17%", tone: "seg-3" },
  { label: "Funding", value: "10%", tone: "seg-4" },
  { label: "Community Impact", value: "9%", tone: "seg-5" },
  { label: "Community Impact", value: "9%", tone: "seg-6" },
  { label: "Community Impact", value: "10%", tone: "seg-7" },
  { label: "Funding Engine", value: "11%", tone: "seg-8" },
  { label: "Reporting", value: "10%", tone: "seg-9" },
  { label: "Governance", value: "10%", tone: "seg-10" },
  { label: "Outcome Verification", value: "14%", tone: "seg-11" },
];

function DonorSummaryAuthorityDrawer({ selected, onClose }) {
  const [artifact, setArtifact] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [disclosures, setDisclosures] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [disclosureId, setDisclosureId] = useState("");
  const [phase, setPhase] = useState(selected?.workforceReportLoading ? "LOADING" : selected?.workforceReportError ? "UNAVAILABLE" : "READY_TO_GENERATE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestKey = React.useRef(null);

  const workforceValue = selected?.workforceReport?.metric_results?.[0]?.value;
  const reportReady = !selected?.workforceReportLoading && !selected?.workforceReportError && Number.isFinite(workforceValue);

  async function generateArtifact() {
    if (!reportReady || busy) return;
    setBusy(true);
    setError("");
    requestKey.current ||= `donor-summary-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
    try {
      const created = await createDonorSummaryArtifact(requestKey.current);
      setArtifact(created);
      setPhase("ARTIFACT_GENERATED");
      const [authorizedRecipients, approvedDisclosures] = await Promise.all([
        listAuthorizedReportRecipients(),
        listApprovedDonorDisclosures(created.artifact_id, created.artifact_version),
      ]);
      setRecipients(authorizedRecipients);
      setDisclosures(approvedDisclosures);
      setPhase(authorizedRecipients.length ? (approvedDisclosures.length ? "READY_TO_AUTHORIZE" : "DISCLOSURE_REQUIRED") : "RECIPIENT_REQUIRED");
    } catch (err) {
      setPhase("AUTHORIZATION_FAILED");
      setError(err?.message || "Donor Summary artifact unavailable");
    } finally {
      setBusy(false);
    }
  }

  async function authorize() {
    if (!artifact || !recipientId || !disclosureId || busy) return;
    setBusy(true);
    setError("");
    try {
      await authorizeDonorSummaryDistribution(artifact.artifact_id, {
        artifact_version: artifact.artifact_version,
        recipient_authorization_id: recipientId,
        disclosure_decision_id: disclosureId,
        idempotency_key: `${requestKey.current}:authorize`,
      });
      setPhase("AUTHORIZED_FOR_DISTRIBUTION");
    } catch (err) {
      setPhase("AUTHORIZATION_FAILED");
      setError(err?.message || "Authorization unavailable");
      setRecipients([]);
      setDisclosures([]);
    } finally {
      setBusy(false);
    }
  }

  const phaseLabel = phase === "AUTHORIZED_FOR_DISTRIBUTION"
    ? "Authorized for Distribution"
    : phase === "UNAVAILABLE" || phase === "AUTHORIZATION_FAILED"
      ? "Unavailable"
      : phase === "RECIPIENT_REQUIRED"
        ? "Recipient Authorization Required"
        : phase === "DISCLOSURE_REQUIRED"
          ? "Disclosure Approval Required"
          : phase === "LOADING"
            ? "Loading..."
            : "Generate Restricted Donor Summary";

  return (
    <div className="shf-detail-drawer__backdrop" onClick={onClose}>
      <aside className="shf-detail-drawer shf-detail-drawer--command" role="dialog" aria-modal="true" aria-labelledby="donor-summary-title" onClick={(event) => event.stopPropagation()}>
        <div className="shf-detail-drawer__header">
          <div>
            <div className="shf-detail-drawer__eyebrow">RESTRICTED INTERNAL AUTHORITY</div>
            <h2 id="donor-summary-title">Donor Summary</h2>
          </div>
          <button type="button" className="shf-detail-drawer__close" onClick={onClose} aria-label="Close drawer">×</button>
        </div>

        <div className="shf-detail-drawer__section">
          <div className="shf-detail-drawer__section-title">Verified Employment Starts</div>
          <p>Historical verified employment starts recorded during the reporting period.</p>
          <strong>{reportReady ? String(workforceValue) : phase === "LOADING" ? "Loading..." : "Unavailable"}</strong>
        </div>

        {artifact ? <div className="shf-detail-drawer__section"><div className="shf-detail-drawer__section-title">Artifact</div><p>Canonical Donor Summary artifact generated. Distribution authorization remains separate.</p></div> : null}

        {phase !== "UNAVAILABLE" && phase !== "AUTHORIZATION_FAILED" && phase !== "LOADING" && phase !== "AUTHORIZED_FOR_DISTRIBUTION" && !artifact ? (
          <button type="button" onClick={generateArtifact} disabled={!reportReady || busy}>{busy ? "Generating..." : "Generate Restricted Donor Summary"}</button>
        ) : null}

        {artifact && phase !== "AUTHORIZED_FOR_DISTRIBUTION" ? (
          <div className="shf-detail-drawer__section">
            <label htmlFor="donor-recipient">Recipient</label>
            <select id="donor-recipient" value={recipientId} onChange={(event) => setRecipientId(event.target.value)} disabled={busy || !recipients.length}>
              <option value="">{recipients.length ? "Select authorized recipient" : "Recipient Authorization Required"}</option>
              {recipients.map((item) => <option key={item.recipient_authorization_id} value={item.recipient_authorization_id}>{item.recipient_organization_ref} ({item.audience_type})</option>)}
            </select>
            <label htmlFor="donor-disclosure">Approved Disclosure</label>
            <select id="donor-disclosure" value={disclosureId} onChange={(event) => setDisclosureId(event.target.value)} disabled={busy || !disclosures.length}>
              <option value="">{disclosures.length ? "Select approved disclosure" : "Disclosure Approval Required"}</option>
              {disclosures.map((item) => <option key={item.disclosure_decision_id} value={item.disclosure_decision_id}>{item.policy_reference}</option>)}
            </select>
            <button type="button" onClick={authorize} disabled={busy || !recipientId || !disclosureId}>{busy ? "Authorizing..." : "Authorize for Distribution"}</button>
          </div>
        ) : null}

        {phase === "AUTHORIZED_FOR_DISTRIBUTION" ? <div className="shf-detail-drawer__section" role="status"><strong>Authorized for Distribution</strong><p>Authorization recorded. Delivery is handled separately.</p></div> : null}
        {error ? <p role="alert">{error}</p> : null}
      </aside>
    </div>
  );
}

function DetailDrawer({ selected, onClose }) {
  const [simulation, setSimulation] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function runSimulation() {
      if (!selected?.simulationScenario) {
        setSimulation(null);
        setSimError("");
        return;
      }

      setSimLoading(true);
      setSimError("");

      try {
        const res = await fetch("http://127.0.0.1:8090/simulate-outcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case: selected.simulationScenario?.case || "emily",
            region: selected.simulationScenario?.region || "Unknown region",
            issue: selected.simulationScenario?.issue || "Outcome risk + intervention flow",
            priority: selected.simulationScenario?.priority || "MEDIUM",
          }),
        });

        if (!res.ok) {
          throw new Error(`Simulation HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) setSimulation(data);
      } catch (err) {
        if (!cancelled) {
          setSimulation(null);
          setSimError(String(err.message || err));
        }
      } finally {
        if (!cancelled) setSimLoading(false);
      }
    }

    if (selected) {
      runSimulation();
    } else {
      setSimulation(null);
      setSimError("");
      setSimLoading(false);
    }
return () => {
      cancelled = true;
    };
  }, [selected]);

  if (!selected) return null;
  if (selected.donorSummary) return <DonorSummaryAuthorityDrawer selected={selected} onClose={onClose} />;

  const metrics = Array.isArray(selected.metrics) ? selected.metrics : [];
  const actions = Array.isArray(selected.actions) ? selected.actions : [];
  const reasonSignals = selected.reasonSignals || [];

  const priorityMetric = selected.priority;
  const confidenceMetric = selected.confidence;

  function pct(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";

    const num = Number(value);

    if (num > 1) return `${Math.round(num)}%`;
    return `${Math.round(num * 100)}%`;
  }
return (
    <div className="shf-detail-drawer__backdrop" onClick={onClose}>
      <aside
        className="shf-detail-drawer shf-detail-drawer--command"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shf-detail-drawer__header">
          <div style={{
            marginBottom: 8,
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(121,104,90,0.82)",
            fontWeight: 700
          }}>
            DRAWER PACKET
          </div>
          <div>
            <div className="shf-detail-drawer__eyebrow">COMMAND DETAIL</div>
            <h2>{selected.title || "AI Recommended Action"}</h2>
          </div>

          <button
            type="button"
            className="shf-detail-drawer__close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        <div className="shf-drawer-command-hero">
          <div className="shf-drawer-command-hero__topline">
            <span className="shf-command-chip">SYSTEM RECOMMENDS</span>
            <span className="shf-command-urgency">{selected.urgency}</span>
          </div>

          <h3>{selected.summary}</h3>

          <div className="shf-drawer-command-hero__metrics">
            <div className="shf-drawer-command-hero__metric">
              <span>Priority</span>
              <strong>{priorityMetric}</strong>
            </div>

            <div className="shf-drawer-command-hero__metric">
              <span>Confidence</span>
              <strong>{confidenceMetric}</strong>
            </div>
          </div>
        </div>

        {selected.simulationScenario ? (
          <div className="shf-sim-input-summary">
            <span>Simulation Input</span>
            <strong>{selected.simulationScenario.county || "Unknown County"}</strong>
            <em>
              {selected.simulationScenario.program || "general_program"} • {selected.simulationScenario.region || "Unknown region"} • {selected.simulationScenario.priority || "MEDIUM"}
            </em>
          </div>
        ) : null}

        <div className="shf-detail-drawer__section">
          <div className="shf-detail-drawer__section-title">WHY THIS ACTION WAS SELECTED</div>

          {reasonSignals.length ? (
            <ul className="shf-detail-drawer__list">
              {reasonSignals.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p>
              This action ranks highest due to risk pressure, outcome improvement potential,
              and projected funding impact.
            </p>
          )}
        </div>

        {metrics.length ? (
          <div className="shf-detail-drawer__section">
            <div className="shf-detail-drawer__section-title">KEY METRICS</div>
            <div className="shf-detail-drawer__metric-grid">
              {metrics.map((metric) => (
                <div key={metric.label} className="shf-detail-drawer__metric-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="shf-detail-drawer__section">
          <div className="shf-detail-drawer__section-title">SIMULATION OUTPUT</div>

          {simLoading ? (
            <div className="shf-sim-loading">Running simulation...</div>
          ) : simError ? (
            <div className="shf-sim-error">Simulation unavailable: {simError}</div>
          ) : simulation ? (
            <>
              <div className="shf-detail-drawer__metric-grid">
                <div className="shf-detail-drawer__metric-card">
                  <span>Risk Now</span>
                  <strong>{pct(simulation.output?.riskNow)}</strong>
                </div>
                <div className="shf-detail-drawer__metric-card">
                  <span>Risk If Action</span>
                  <strong>{pct(simulation.output?.riskIfAction)}</strong>
                </div>
                <div className="shf-detail-drawer__metric-card">
                  <span>Risk If No Action</span>
                  <strong>{pct(simulation.output?.riskIfNoAction)}</strong>
                </div>
                <div className="shf-detail-drawer__metric-card">
                  <span>Confidence</span>
                  <strong>{pct((simulation.output?.ai?.confidence ?? 0) / 100)}</strong>
                </div>
                <div className="shf-detail-drawer__metric-card">
                  <span>Funding If Action</span>
                  <strong>{simulation.output?.fundingIfAction ?? "—"}</strong>
                </div>
                <div className="shf-detail-drawer__metric-card">
                  <span>Funding If No Action</span>
                  <strong>{simulation.output?.fundingIfNoAction ?? "—"}</strong>
                </div>
              </div>

              <div className="shf-delta-grid">
                <div className="shf-delta-card shf-delta-card--positive">
                  <span>Risk Reduction</span>
                  <strong>
                    {simulation.output?.riskNow != null && simulation.output?.riskIfAction != null
                      ? `${Math.max(0, Math.round(simulation.output.riskNow - simulation.output.riskIfAction))}%`
                      : "—"}
                  </strong>
                </div>

                <div className="shf-delta-card shf-delta-card--negative">
                  <span>Risk Increase if No Action</span>
                  <strong>
                    {simulation.output?.riskNow != null && simulation.output?.riskIfNoAction != null
                      ? `${Math.max(0, Math.round(simulation.output.riskIfNoAction - simulation.output.riskNow))}%`
                      : "—"}
                  </strong>
                </div>

                <div className="shf-delta-card">
                  <span>Recommended Strategy</span>
                  <strong>{simulation.output?.ai?.game_theory?.recommended_strategy ?? "—"}</strong>
                </div>

                <div className="shf-delta-card">
                  <span>Time Sensitivity</span>
                  <strong>{simulation.output?.ai?.time_sensitivity ?? simulation.output?.urgency ?? "—"}</strong>
                </div>
              </div>
            </>
          ) : (
            <p>No simulation data available.</p>
          )}
        </div>

        {actions.length ? (
          <div className="shf-detail-drawer__section">
            <div className="shf-detail-drawer__section-title">EXECUTION STEPS</div>
            <ul className="shf-detail-drawer__list">
              {actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="shf-detail-drawer__section shf-detail-drawer__section--next">
          <div className="shf-detail-drawer__section-title">NEXT MOVE AFTER EXECUTION</div>
          <p>
            Next likely outcome: <strong>{selected.nextOutcome}</strong>. System will re-evaluate the affected record, compare outcome performance against funding allocation, adjust intervention strategy, and issue the next optimized recommendation cycle.
          </p>
        </div>
      </aside>
    </div>
  );
}


function normalizeCountyName(name = "") {
  return String(name).replace(/\s+County$/i, "").trim().toLowerCase();
}


function buildDrawerPayload({
  title = "Command Detail",
  summary = "No summary provided.",
  metrics = [],
  actions = [],
  reason = "No command rationale provided.",
  priority = "Monitor",
  confidence = "—",
  nextOutcome = "REVIEWED",
  simulationScenario = null,
  reasonSignals = [],
  donorSummary = false,
  workforceReport = null,
  workforceReportLoading = false,
  workforceReportError = null,
}) {
  return {
    title,
    summary,
    metrics: Array.isArray(metrics) ? metrics : [],
    actions: Array.isArray(actions) ? actions : [],
    reason,
    priority,
    confidence,
    nextOutcome,
    simulationScenario,
    reasonSignals: Array.isArray(reasonSignals) ? reasonSignals : [],
    donorSummary,
    workforceReport,
    workforceReportLoading,
    workforceReportError,
  };
}

function buildCountyFallback(county) {
  const rawName =
    county?.name ||
    county?.county ||
    county?.label ||
    county?.properties?.name ||
    county?.properties?.NAME ||
    "Unknown County";

  const properName = /county$/i.test(rawName) ? rawName : `${rawName} County`;

  return {
    id: normalizeCountyName(properName).replace(/\s+/g, "-"),
    name: properName,
    x: county?.x ?? 50,
    y: county?.y ?? 50,
    shade: county?.shade ?? "low",
    programs: county?.programs ?? 1,
    people: county?.people ?? "—",
    funding: county?.funding ?? "—",
    topOutcome: county?.topOutcome ?? "—",
    risk: county?.risk ?? "Stable",
  };
}

function resolveCountyRecord(county, counties) {
  const rawName =
    county?.name ||
    county?.county ||
    county?.label ||
    county?.properties?.name ||
    county?.properties?.NAME ||
    county ||
    "";

  const clickedNorm = normalizeCountyName(rawName);

  const found = counties.find((item) => {
return (
      normalizeCountyName(item.name) === clickedNorm ||
      String(item.id || "").toLowerCase() === clickedNorm
    );
  });

  return found || buildCountyFallback(county);
}



export default function SHFImpactCommandCenter() {
  const [aiTruthDrawer, setAiTruthDrawer] = useState({ open: false });
  const [workforceReport, setWorkforceReport] = useState(null);
  const [workforceReportLoading, setWorkforceReportLoading] = useState(true);
  const [workforceReportError, setWorkforceReportError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchWorkforceEmploymentStartedVerifiedCountReport()
      .then((report) => {
        if (!active) return;
        setWorkforceReport(report);
        setWorkforceReportError(false);
      })
      .catch(() => {
        if (active) setWorkforceReportError(true);
      })
      .finally(() => {
        if (active) setWorkforceReportLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleAIAnalystDrawerRequest(event) {
      const detail = event?.detail || {};
      setAiTruthDrawer({
        open: true,
        source: detail.source || "ai_analyst_panel",
        surface: detail.surface || "impact_command_center",
        action: detail.action || "open_ai_drawer",
        truthContext: detail.truthContext || null,
        mapContext: detail.mapContext || null,
        drawerContext: detail.drawerContext || null,
        timestamp: detail.timestamp || new Date().toISOString(),
      });
    }

    window.addEventListener("shf:ai-drawer-request", handleAIAnalystDrawerRequest);

    return () => {
      window.removeEventListener("shf:ai-drawer-request", handleAIAnalystDrawerRequest);
    };
  }, []);


  const [tourOpen, setTourOpen] = useState(false);
  const [tourSpotlightRect, setTourSpotlightRect] = useState(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const activeTourStep = SHF_COMMAND_TOUR_STEPS[tourStepIndex] || SHF_COMMAND_TOUR_STEPS[0];
  const tourProgress = `${tourStepIndex + 1} / ${SHF_COMMAND_TOUR_STEPS.length}`;

  useEffect(() => {
    document.querySelectorAll(".shf-tour-highlight").forEach((node) => {
      node.classList.remove("shf-tour-highlight");
    });

    if (!tourOpen || !activeTourStep?.selector) {
      setTourSpotlightRect(null);
      return;
    }

    const findTarget = () => {
      const selectors = activeTourStep.selector
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      for (const selector of selectors) {
        const found = document.querySelector(selector);
        if (found) return found;
      }

      return null;
    };

    const updateTarget = () => {
      const target = findTarget();

      if (!target) {
        setTourSpotlightRect(null);
        return;
      }

      target.classList.add("shf-tour-highlight");

      const rect = target.getBoundingClientRect();
      const pad = 12;

      setTourSpotlightRect({
        top: Math.max(rect.top - pad, 14),
        left: Math.max(rect.left - pad, 14),
        width: Math.min(rect.width + pad * 2, window.innerWidth - 28),
        height: Math.min(rect.height + pad * 2, window.innerHeight - 28),
      });
    };

    const target = findTarget();

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    const timer = window.setTimeout(updateTarget, 380);

    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);

      document.querySelectorAll(".shf-tour-highlight").forEach((node) => {
        node.classList.remove("shf-tour-highlight");
      });
    };
  }, [tourOpen, tourStepIndex, activeTourStep]);


  const goToNextTourStep = () => {
    setTourStepIndex((current) => Math.min(current + 1, SHF_COMMAND_TOUR_STEPS.length - 1));
  };

  const goToPreviousTourStep = () => {
    setTourStepIndex((current) => Math.max(current - 1, 0));
  };

  const closeTour = () => {
    setTourOpen(false);
    setTourStepIndex(0);
  };

  // DAY 7 STABILITY CHECKPOINT: core command surface normalized through Days 1–7.
  const { selectedEntityId, lastEntityAction, selectedEntity } = useSelectedEntity();

  const [selected, setSelected] = useState(null);
  
  

  const [oracleBundle, setOracleBundle] = useState(null);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState("");
const [lastCountyClick, setLastCountyClick] = useState(null);
  const [lastDrawerTitle, setLastDrawerTitle] = useState(null);
const [selfAudit, setSelfAudit] = useState(null);
  const [selfAuditBrief, setSelfAuditBrief] = useState(null);
  const [selfAuditLoading, setSelfAuditLoading] = useState(false);
  const [selfAuditError, setSelfAuditError] = useState("");

  const selectedCounty = useMemo(() => {
    return resolveCountyFromEntity(selectedEntity);
  }, [selectedEntity]);

  const oracleInsight = useMemo(() => {
    if (!oracleBundle) return null;
    return normalizeOracleInsight(oracleBundle, selectedCounty);
  }, [oracleBundle, selectedCounty]);


  const selectedCountyRecord = useMemo(() => {
    if (!selectedCounty) return null;
    return resolveCountyRecord(selectedCounty, COUNTIES);
  }, [selectedCounty]);


  const countyActions = useMemo(() => {
    return getActionsForCounty(selectedCountyRecord || selectedCounty);
  }, [selectedCountyRecord, selectedCounty]);


  const oracleStatusLabel = useMemo(() => {
    if (oracleLoading) return "ORACLE SYNCING";
    if (oracleError) return "ORACLE FALLBACK MODE";
    if (oracleBundle?.truth || oracleBundle?.compare || oracleBundle?.priority) {
      return "ORACLE ACTIVE";
    }
    return "SYSTEM READY";
  }, [oracleLoading, oracleError, oracleBundle]);


  const surfaceReady = useMemo(() => {
    return Boolean(
      selectedEntityId !== undefined &&
      selectedCounty !== undefined &&
      oracleInsight &&
      countyActions
    );
  }, [selectedEntityId, selectedCounty, oracleInsight, countyActions]);


  const aiDisplayInsight = useMemo(() => {
    const countyName =
      selectedCountyRecord?.name ||
      selectedCounty ||
      "Unknown County";

    return {
      changedText: `${oracleInsight?.changedText || "No Oracle insight available"} Current county context: ${countyName}.`,
      whyPoints: [
        ...(oracleInsight?.whyPoints || []),
        `Map context is currently bound to ${countyName}.`,
      ],
      nextMoveText: oracleInsight?.nextMoveText || "Await further validation.",
    };
  }, [oracleInsight, selectedCountyRecord, selectedCounty]);

  const trendPoints = useMemo(() => {
    return [8, 12, 10, 14, 18, 16, 20, 24, 22, 28, 26, 30, 34, 33, 38, 42];
  }, []);

  const loadSelfAudit = useCallback(async () => {
    setSelfAuditLoading(true);
    setSelfAuditError("");
    try {
      const [latest, brief] = await Promise.all([
        fetchSelfAuditLatest(),
        fetchSelfAuditLatestBrief().catch(() => null),
      ]);
      setSelfAudit(latest);
      setSelfAuditBrief(brief);
    } catch (err) {
      setSelfAuditError(err?.message || "Unable to load self-audit");
    } finally {
      setSelfAuditLoading(false);
    }
  }, []);

  const handleRunSelfAudit = useCallback(async () => {
    setSelfAuditLoading(true);
    setSelfAuditError("");
    try {
      const latest = await runSelfAuditNow();
      setSelfAudit(latest);
      try {
        const brief = await fetchSelfAuditLatestBrief();
        setSelfAuditBrief(brief);
      } catch {
        // keep audit payload even if brief fetch lags
      }
    } catch (err) {
      setSelfAuditError(err?.message || "Unable to run self-audit");
    } finally {
      setSelfAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSelfAudit();
  }, [loadSelfAudit]);

  const selfAuditStatus = selfAudit?.status || "unknown";
  const selfAuditScore = selfAudit?.scores?.institutional_integrity ?? "—";
  const selfAuditTopChange =
    selfAudit?.changes_since_prior?.[0]?.message || "No recent changes recorded.";
  const selfAuditTopAction =
    selfAudit?.recommended_actions?.[0]?.message || "No action needed.";

  const openDrawer = (payload) => {
    const normalized = buildDrawerPayload(payload || {});
    setLastDrawerTitle(normalized.title || null);
    setSelected(normalized);
  };

  const onKpiClick = (kpi) => {
    openDrawer({
      title: kpi.label,
      summary: `${kpi.label} is being tracked at the institutional layer for SHF command visibility.`,
      metrics: [
        { label: "Current Value", value: kpi.value },
        { label: "Change", value: kpi.delta || "—" },
        { label: "Context", value: kpi.sublabel || "System Wide" },
      ],
      actions: [
        "Review trend context",
        "Compare to previous cycle",
        "Include in export brief",
      ],
      reason: "KPI movement helps operators understand funding pressure, outcome momentum, and institutional readiness.",
      priority: "Monitor",
      confidence: "—",
      nextOutcome: "REVIEWED",
    });
  };

  const onCountyClick = (county) => {
    const resolvedCounty = resolveCountyRecord(county, COUNTIES);
    setLastCountyClick(resolvedCounty.name);

    openDrawer({
      title: resolvedCounty.name,
      summary: `${resolvedCounty.name} is the active SHF command region for simulation context, measurable program activity, and funding movement.`,
      metrics: [
        { label: "Programs Active", value: String(resolvedCounty.programs) },
        { label: "People Served", value: resolvedCounty.people },
        { label: "Funding Deployed", value: resolvedCounty.funding },
        { label: "Top Outcome", value: resolvedCounty.topOutcome },
        { label: "Risk Signal", value: resolvedCounty.risk },
      ],
      actions: [
        `Open ${resolvedCounty.name} profile`,
        `Review ${resolvedCounty.name} operators`,
        `Generate ${resolvedCounty.name} brief`,
      ],
      reason: "County drilldowns help leadership see where to expand, intervene, verify, or report.",
      priority: resolvedCounty.risk === "Watch" ? "High" : "Monitor",
      confidence: "—",
      nextOutcome: "REVIEWED",
      reasonSignals: [
        `${resolvedCounty.name} selected from map surface`,
        `County programs: ${resolvedCounty.programs}`,
        `County funding: ${resolvedCounty.funding}`,
      ],
    });
  };

  const onProgramClick = (program) => {
    openDrawer({
      title: program.name,
      summary: program.note,
      metrics: [
        { label: "Status", value: program.status },
        { label: "Locations", value: String(program.locations) },
        { label: "Funding", value: program.funding },
        { label: "Trend", value: program.trend },
        { label: "Risk", value: program.risk },
        { label: "Served", value: program.served },
      ],
      actions: [
        "Open program command view",
        "Generate donor brief",
        "Review reporting completeness",
      ],
      reason: "Program health drives expansion, intervention, and funding narrative quality.",
      priority: program.risk === "Low" ? "Monitor" : "High",
      confidence: "—",
      nextOutcome: "REVIEWED",
    });
  };

  const onAiActionClick = async (action) => {
    if (!selectedEntityId || !action) return;

    await fetch("http://127.0.0.1:8091/oracle/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: selectedEntityId,
        action,
      }),
    });

    await fetch("http://127.0.0.1:8090/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: {
          entity_id: selectedEntityId,
          action,
          source: "command_center",
        },
      }),
    });

    try {
      const bundle = await fetchOracleBundle({
        entityId: selectedEntityId,
        county: selectedCounty,
      });
      setOracleBundle(bundle);
      setOracleError("");
    } catch (err) {
      setOracleError(err?.message || "Unable to refresh Oracle bundle after action.");
    }
  };

  const onTrustClick = (item) => {
    openDrawer({
      title: item.label,
      summary: `${item.label} is part of the SHF proof and trust layer.`,
      metrics: [
        { label: "Status", value: item.value },
        { label: "Last Refresh", value: "Today" },
      ],
      actions: [
        "Open verification detail",
        "Review exceptions",
        "Generate trust memo",
      ],
      reason: "This layer separates SHF from ordinary dashboards by proving integrity, not just claiming it.",
      priority: "Monitor",
      confidence: "—",
      nextOutcome: "REVIEWED",
    });
  };

  const onImpactOverviewClick = () => {
    openDrawer({
      title: "Impact Overview Wheel",
      summary: "The outcome wheel visualizes the SHF operating balance across verification, funding, reporting, governance, and community impact.",
      metrics: WHEEL_SEGMENTS.map((seg) => ({ label: seg.label, value: seg.value })),
      actions: [
        "Open segment breakdown",
        "Compare weighting model",
        "Generate strategic summary",
      ],
      reason: "This signature visual helps leadership understand how the institutional ecosystem is weighted and performing.",
      priority: "Monitor",
      confidence: "—",
      nextOutcome: "REVIEWED",
    });
  };

  const onExportClick = (item) => {
    if (item.label === "Donor Summary") {
      openDrawer({
        title: "Donor Summary",
        donorSummary: true,
        workforceReport,
        workforceReportLoading,
        workforceReportError,
      });
      return;
    }
    openDrawer({
      title: item.label,
      summary: `${item.label} can be generated from the command center export system.`,
      metrics: [
        { label: "Status", value: item.value || "Available" },
        {
          label: "Format",
          value: item.label.includes("Snapshot") ? "PDF / Share" : "PDF",
        },
      ],
      actions: ["Generate now", "Preview content", "Send to leadership"],
      reason: "Exports turn command-center intelligence into board, donor, and grant-ready materials.",
      priority: "Monitor",
      confidence: "—",
      nextOutcome: "REVIEWED",
    });
  };

  const boardBriefItem = {
    ...EXPORT_ITEMS[0],
    value: workforceReportLoading
      ? "Loading..."
      : workforceReportError
        ? "Unavailable"
        : String(workforceReport?.metric_results?.[0]?.value),
  };
  const grantNarrativeItem = {
    ...EXPORT_ITEMS[1],
    value: workforceReportLoading
      ? "Loading..."
      : workforceReportError
        ? "Unavailable"
        : `${String(workforceReport?.metric_results?.[0]?.value)} verified employment starts were recorded during the reporting period.`,
  };
  const programHealthMemoItem = {
    ...EXPORT_ITEMS[4],
    subtitle: "Historical Workforce Outcome",
    value: workforceReportLoading
      ? "Loading..."
      : workforceReportError
        ? "Unavailable"
        : `${String(workforceReport?.metric_results?.[0]?.value)} verified employment starts were recorded during the reporting period.`,
  };
  const briefingItems = [boardBriefItem, grantNarrativeItem, ...EXPORT_ITEMS.slice(2, 4), programHealthMemoItem];

  if (!REPORTING_DATA_AVAILABLE) {
    return (
      <main className="shf-page" role="status">
        <section className="shf-shell">
          <header className="shf-topbar">
            <div className="shf-brand__text">Silicon Heartland</div>
            <h1>SHF Impact Command Center</h1>
          </header>
          <section className="shf-panel" style={{ margin: 24, padding: 24 }}>
            <h2>Data pending verification</h2>
            <p>Impact metrics and exports are suppressed until approved canonical Truth data is available.</p>
          </section>
          <ReportsBriefingsPanel
            items={[boardBriefItem, grantNarrativeItem, programHealthMemoItem]}
            onExportClick={onExportClick}
          />
        </section>
      </main>
    );
  }

  return (
    <>
    <div className="shf-page">
      <div className="shf-shell">
        <header className="shf-topbar">
          <div
              className="shf-brand shf-brand-home-link"
              data-tour-section="header"
              role="button"
              tabIndex={0}
              title="Go to Silicon Heartland Foundation home page"
              onClick={() => {
                window.location.href = "/foundation.html";
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  window.location.href = "/foundation.html";
                }
              }}
            >
            <div className="shf-brand__mark">
              <span className="shf-brand__mark-top" />
              <span className="shf-brand__mark-bottom" />
            </div>
            <img
              src={SHF_COMMAND_LOGO_SRC}
              alt="Silicon Heartland Foundation globe"
              className="shf-command-logo"
            />
            <div className="shf-brand__text">Silicon Heartland</div>
            <div className="shf-brand__divider" />
            <h1>SHF Impact Command Center</h1>
          </div>

          <div className="shf-topbar__controls">
            <select className="shf-select" defaultValue="reporting">
              <option value="reporting">Reporting Period</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Last 12 Months</option>
            </select>

            <select className="shf-select" defaultValue="ohio">
              <option value="ohio">Ohio : Statewide</option>
              <option>Franklin County</option>
              <option>Cuyahoga County</option>
              <option>Hamilton County</option>
            </select>

            <a
              className="shf-export-btn"
              href={SHF_REPORT_GENERATOR_HREF}
            >
              Generate SHF Impact Report
            </a>

            <button
              className="shf-export-btn"
              type="button"
              onClick={() =>
                openDrawer({
                  title: "Export Report",
                  summary: "Generate executive, donor, grant, and public-facing report outputs from this command surface.",
                  metrics: [
                    { label: "Exports Ready", value: "5" },
                    { label: "PDF Engine", value: "Connected" },
                  ],
                  actions: [
                    "Generate Executive Brief",
                    "Generate Donor Summary",
                    "Generate Grant Narrative",
                  ],
                  reason: "This is where command-center insight becomes a real funding and reporting asset.",
                })
              }
            >
              Export Report
            </button>
          </div>
        </header>

        <ImpactKpiBand kpis={KPIS} onKpiClick={onKpiClick} />


        <div className="shf-command-debug-strip" style={{
          margin: "12px 0 0",
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid rgba(145,118,92,0.24)",
          background: "rgba(255,255,255,0.45)",
          color: "rgba(47,38,33,0.88)",
          fontSize: 13,
          fontWeight: 600
        }}>
          STATE CHAIN • entity: {selectedEntityId || "none"} • county: {selectedCounty || "none"}
        </div>


        <div className="shf-command-status-strip" data-tour-section="state">
          <span><strong>Surface</strong> SHF Command Center</span>
          <span><strong>Entity</strong> {selectedEntityId || "none"}</span>
          <span><strong>County</strong> {selectedCountyRecord?.name || selectedCounty || "none"}</span>
          <span><strong>Oracle</strong> {oracleStatusLabel}</span>
          <span><strong>Map</strong> {lastCountyClick || "none"}</span>
          <span><strong>Drawer</strong> {lastDrawerTitle || "none"}</span>
          <span><strong>Ready</strong> {surfaceReady ? "YES" : "NO"}</span>
        </div>

        <main className="shf-main-grid">
          <section className="shf-left-col">
            <div className="shf-panel shf-map-panel">
              <div className="shf-panel__header">
                <h2>Ohio Impact</h2>
                <button type="button" className="shf-mini-filter">
                  STATEWIDE
                </button>
              </div>

              <div className="shf-map-stage shf-map-stage--real">
                <SHFImpactOhioMap
                  selectedCounty={selectedCounty}
                  onCountyClick={onCountyClick}
                />
              </div>
            </div>

            <div className="shf-panel shf-program-table-panel">
              <div className="shf-panel__header">
                <h2>Program Health</h2>
                <div className="shf-table-filters">
                  <button type="button" className="shf-mini-filter">STAGE</button>
                  <button type="button" className="shf-mini-filter">LOCATIONS</button>
                  <button type="button" className="shf-mini-filter">FUNDING</button>
                </div>
              </div>

              <div className="shf-program-table">
                {PROGRAMS.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    className="shf-program-row"
                    onClick={() => onProgramClick(program)}
                  >
                    <div className="shf-program-row__name">
                      <strong>{program.name}</strong>
                      <span>{program.served} served</span>
                    </div>

                    <div className={`shf-status-pill shf-status-pill--${program.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {program.status}
                    </div>

                    <div className="shf-program-row__metric">
                      <span>Locations</span>
                      <strong>{program.locations}</strong>
                    </div>

                    <div className="shf-program-row__metric">
                      <span>Funding</span>
                      <strong>{program.funding}</strong>
                    </div>

                    <div className="shf-program-row__metric">
                      <span>Trend</span>
                      <strong>{program.trend}</strong>
                    </div>

                    <div className="shf-program-row__metric shf-program-row__metric--risk">
                      <span>Risk Level</span>
                      <strong>{program.risk}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="shf-middle-col">
            <ImpactOverviewWheelPanel
              wheelSegments={WHEEL_SEGMENTS}
              trendPoints={trendPoints}
              onWheelClick={onImpactOverviewClick}
            />

            <ReportsBriefingsPanel
              items={briefingItems}
              onExportClick={onExportClick}
            />

            <section className="shf-self-audit-card">
              <div className="shf-self-audit-card__header">
                <div>
                  <div className="shf-self-audit-card__eyebrow">Institutional Self-Audit Control</div>
                  <h3 className="shf-self-audit-card__title">Daily Integrity Cycle</h3>
                </div>
                <div className={`shf-self-audit-card__status shf-self-audit-card__status--${selfAuditStatus}`}>
                  {selfAuditStatus}
                </div>
              </div>

              <div className="shf-self-audit-card__scoreband">
                <div className="shf-self-audit-card__score">
                  <span className="shf-self-audit-card__score-value">{selfAuditScore}</span>
                  <span className="shf-self-audit-card__score-label">Institutional Integrity</span>
                </div>
                <div className="shf-self-audit-card__meta">
                  <div><span>Last Run</span><strong>{formatAuditDate(selfAudit?.metadata?.last_run_at || selfAudit?.timestamp)}</strong></div>
                  <div><span>Next Run</span><strong>{formatAuditDate(selfAudit?.metadata?.next_scheduled_run)}</strong></div>
                </div>
              </div>

              {selfAuditError ? (
                <div className="shf-self-audit-card__error">{selfAuditError}</div>
              ) : null}

              <div className="shf-self-audit-card__body">
                <div className="shf-self-audit-card__section">
                  <div className="shf-self-audit-card__section-label">Top Change</div>
                  <div className="shf-self-audit-card__section-text">{selfAuditTopChange}</div>
                </div>

                <div className="shf-self-audit-card__section">
                  <div className="shf-self-audit-card__section-label">Recommended Action</div>
                  <div className="shf-self-audit-card__section-text">{selfAuditTopAction}</div>
                </div>

                <div className="shf-self-audit-card__section">
                  <div className="shf-self-audit-card__section-label">Executive Summary</div>
                  <div className="shf-self-audit-card__section-text">
                    {selfAuditBrief?.executive_summary || "Brief not available yet."}
                  </div>
                </div>
              </div>

              <div className="shf-self-audit-card__actions">
                <button
                  type="button"
                  className="shf-self-audit-card__button shf-self-audit-card__button--primary"
                  onClick={handleRunSelfAudit}
                  disabled={selfAuditLoading}
                >
                  {selfAuditLoading ? "Running..." : "Run Audit Now"}
                </button>

                <button
                  type="button"
                  className="shf-self-audit-card__button shf-self-audit-card__button--secondary"
                  onClick={loadSelfAudit}
                  disabled={selfAuditLoading}
                >
                  Refresh
                </button>
              </div>
            </section>
          </section>

          <aside className="shf-right-col">
            <AIAnalystPanel
              entityId={selectedEntityId}
              oracleTruth={oracleBundle?.truth || null}
              changedText={aiDisplayInsight.changedText}
              whyPoints={aiDisplayInsight.whyPoints}
              nextMoveText={aiDisplayInsight.nextMoveText}
              actionLabel={
                oracleLoading
                  ? "Refreshing Oracle..."
                  : oracleInsight?.actionLabel || "Execute Oracle recommendation"
              }
              onAction={() => onAiActionClick(oracleInsight?.nextMoveText || "request_data")}
            />

            <TrustVerificationPanel entityId={selectedEntityId}
              items={TRUST_ITEMS}
              onTrustClick={onTrustClick}
            />
          </aside>
        
      <footer className="shf-command-footer">
        <div className="shf-command-footer__brand">
          <img
            src={SHF_COMMAND_LOGO_SRC}
            alt="Silicon Heartland Foundation globe"
            className="shf-footer-globe-logo"
          />
          <div>
            <strong>Silicon Heartland Foundation</strong>
            <p>Powered by Silicon Heartland Solutions infrastructure.</p>
          </div>
        </div>

        <div className="shf-command-footer__links">
          <span>Verified Outcomes</span>
          <span>Funding Readiness</span>
          <span>Oracle Truth Layer</span>
          <span>Impact Command System</span>
        </div>
      </footer>
{tourOpen ? (
        <div className="shf-command-tour-overlay" role="dialog" aria-modal="true" aria-label="SHF Command Tour">
          <div className="shf-command-tour-backdrop" onClick={closeTour} />

          {tourSpotlightRect ? (
            <div
              className="shf-command-tour-spotlight"
              style={{
                top: `${tourSpotlightRect.top}px`,
                left: `${tourSpotlightRect.left}px`,
                width: `${tourSpotlightRect.width}px`,
                height: `${tourSpotlightRect.height}px`,
              }}
            />
          ) : null}

          <aside className="shf-command-tour-card">
            <div className="shf-command-tour-card__top">
              <span>Command Tour</span>
              <strong>{tourProgress}</strong>
            </div>

            <h3>{activeTourStep.title}</h3>
            <p>{activeTourStep.body}</p>

            {activeTourStep.why ? (
              <div className="shf-command-tour-action shf-command-tour-action--why">
                <span>Why it matters</span>
                <strong>{activeTourStep.why}</strong>
              </div>
            ) : null}

            <div className="shf-command-tour-action">
              <span>Operator action</span>
              <strong>{activeTourStep.action}</strong>
            </div>

            <div className="shf-command-tour-controls">
              <button
                type="button"
                onClick={() => setTourStepIndex((current) => Math.max(current - 1, 0))}
                disabled={tourStepIndex === 0}
              >
                Back
              </button>

              {tourStepIndex >= SHF_COMMAND_TOUR_STEPS.length - 1 ? (
                <button type="button" onClick={closeTour}>
                  Finish Tour
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setTourStepIndex((current) =>
                      Math.min(current + 1, SHF_COMMAND_TOUR_STEPS.length - 1)
                    )
                  }
                >
                  Next Step
                </button>
              )}
            </div>

            <button type="button" className="shf-command-tour-close" onClick={closeTour}>
              Close
            </button>
          </aside>
        </div>
      ) : null}
      <button
        type="button"
        className="shf-command-tour-floating-button shf-command-tour-floating-button--high"
        onClick={() => setTourOpen(true)}
      >
        Start Tour
      </button>

      {tourOpen ? (
        <div className="shf-command-tour-overlay" role="dialog" aria-modal="true" aria-label="SHF Command Tour">
          <div className="shf-command-tour-soft-backdrop" />

          {tourSpotlightRect ? (
            <div
              className="shf-command-tour-spotlight"
              style={{
                top: `${tourSpotlightRect.top}px`,
                left: `${tourSpotlightRect.left}px`,
                width: `${tourSpotlightRect.width}px`,
                height: `${tourSpotlightRect.height}px`,
              }}
            />
          ) : null}

          <aside className="shf-command-tour-card">
            <div className="shf-command-tour-card__top">
              <span>SHF Guided Command Tour</span>
              <strong>Step {tourStepIndex + 1} of {SHF_COMMAND_TOUR_STEPS.length}</strong>
            </div>

            <h3>{activeTourStep.title}</h3>
            <p>{activeTourStep.body}</p>

            {activeTourStep.why ? (
              <div className="shf-command-tour-action shf-command-tour-action--why">
                <span>Why it matters</span>
                <strong>{activeTourStep.why}</strong>
              </div>
            ) : null}

            <div className="shf-command-tour-action">
              <span>Operator action</span>
              <strong>{activeTourStep.action}</strong>
            </div>

            <div className="shf-command-tour-controls">
              <button
                type="button"
                onClick={() => setTourStepIndex((current) => Math.max(current - 1, 0))}
                disabled={tourStepIndex === 0}
              >
                Back
              </button>

              <button type="button" onClick={closeTour}>
                End
              </button>

              {tourStepIndex >= SHF_COMMAND_TOUR_STEPS.length - 1 ? (
                <button type="button" onClick={closeTour}>
                  Finish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setTourStepIndex((current) =>
                      Math.min(current + 1, SHF_COMMAND_TOUR_STEPS.length - 1)
                    )
                  }
                >
                  Next
                </button>
              )}
            </div>

            <button type="button" className="shf-command-tour-close" onClick={closeTour}>
              Close
            </button>
          </aside>
        </div>
      ) : null}

    </main>
      </div>

      <DetailDrawer selected={selected} onClose={() => setSelected(null)} />
    </div>

      <SHFAIAnalystTruthDrawer
        drawerState={aiTruthDrawer}
        onClose={() => setAiTruthDrawer({ open: false })}
      />
    </>

  );
}
