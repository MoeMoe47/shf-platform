const DEFAULT_API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  import.meta?.env?.VITE_SHF_API_BASE ||
  "http://127.0.0.1:8000";

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return res.json();
}

function normalizeRiskLevel(riskBand, riskScore = 0) {
  const band = String(riskBand || "").toLowerCase();
  if (band === "high" || riskScore >= 0.75) return "critical";
  if (band === "medium" || riskScore >= 0.4) return "medium";
  return "low";
}

function normalizeAnomalyLevel(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical" || s === "high") return "critical";
  if (s === "medium" || s === "warning") return "medium";
  return "low";
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function buildHeader(summary, efficiency) {
  return {
    title: "Silicon Heartland Outcomes Exchange",
    subtitle: "Operational Command Center",
    classification: "Unclassified / Operational Data",
    status: "LIVE",
    syncLabel: "Live sync",
    quickStats: [
      {
        label: "Programs",
        value: Number(summary?.pool_count || 0),
      },
      {
        label: "Open Disputes",
        value: Number(summary?.open_dispute_count || 0),
      },
      {
        label: "Capital Deployed",
        value: formatCurrency(efficiency?.capital_deployed || 0),
      },
    ],
  };
}

function buildProofMetrics(summary, riskItems, anomalyItems, efficiency) {
  return {
    verifiedOutcomes: Number(efficiency?.verified_outcomes || 0),
    capitalDeployed: Number(efficiency?.capital_deployed || 0),
    costPerOutcome: Number(efficiency?.cost_per_outcome || 0),
    activeHolds: 0,
    executedActions: 0,
    highRiskParticipants: riskItems.filter(
      (r) => String(r.risk_band || "").toLowerCase() === "high"
    ).length,
    anomalyCount: anomalyItems.length,
    poolCount: Number(summary?.pool_count || 0),
    openDisputeCount: Number(summary?.open_dispute_count || 0),
    topProgram: efficiency?.program_id || "program_workforce_pilot",
    topEfficiencyScore: Number(efficiency?.efficiency_score || 0),
  };
}

function buildLeftRail(riskItems, anomalyItems, priorityItems = []) {
  const topRisk = riskItems[0];
  const topAnomaly = anomalyItems[0];

  return {
    situation: {
      title: "Threats to Outcome Integrity",
      detectedBy: topAnomaly ? "Watchtower" : "AAL",
      severity: topAnomaly
        ? normalizeAnomalyLevel(topAnomaly.severity)
        : topRisk
        ? normalizeRiskLevel(topRisk.risk_band, topRisk.dropout_risk_score)
        : "low",
      description: topAnomaly
        ? `${topAnomaly.anomaly_type || "Anomaly"} detected for ${topAnomaly.entity_id || "program node"}.`
        : topRisk
        ? `High participant risk detected for ${topRisk.participant_id}.`
        : "No critical integrity threat detected.",
    },
    intelligenceSignals: riskItems.slice(0, 6).map((r, idx) => ({
      id: r.risk_id || `risk_${idx}`,
      name: r.participant_id || `participant_${idx + 1}`,
      count: `${Math.round(Number(r.dropout_risk_score || 0) * 100)}`,
      level: normalizeRiskLevel(r.risk_band, r.dropout_risk_score),
      meta: `${String(r.risk_band || "low").toUpperCase()} risk`,
    })),
    alerts: anomalyItems.slice(0, 5).map((a, idx) => ({
      id: a.anomaly_id || `anomaly_${idx}`,
      title: a.anomaly_type || "Anomaly",
      entityId: a.entity_id || "entity",
      severity: normalizeAnomalyLevel(a.severity),
    })),
    responsePlans:
      priorityItems.length > 0
        ? priorityItems.slice(0, 3).map((item, idx) => ({
            id: item.queue_id || `plan_${idx}`,
            title: item.recommended_action || "Response Plan",
            status: String(item.priority_band || "READY").toUpperCase(),
            meta: item.entity_id || "AAL priority queue",
          }))
        : [
            {
              id: "default_plan",
              title: "Job90 Payment Inquiry",
              status: "READY",
              meta: "Proposed by AAL",
            },
          ],
  };
}

function buildMapNodes(flow, pools, proofMetrics, riskItems) {
  const nodes = [
    {
      id: "county_franklin",
      label: "Franklin County",
      sub: `${proofMetrics.highRiskParticipants} high-risk participants`,
      x: "52%",
      y: "52%",
      kind: "primary",
      entityType: "county",
    },
    {
      id: "program_workforce_pilot",
      label: "Workforce Pilot",
      sub: `${proofMetrics.verifiedOutcomes} verified outcomes`,
      x: "69%",
      y: "42%",
      kind: "program",
      entityType: "program",
    },
    {
      id: "funding_pool_main",
      label: "Workforce Funding Pool",
      sub: formatCurrency(proofMetrics.capitalDeployed),
      x: "38%",
      y: "81%",
      kind: "pool",
      entityType: "pool",
    },
  ];

  (pools || []).slice(0, 2).forEach((pool, idx) => {
    nodes.push({
      id: pool.pool_id || `pool_${idx}`,
      label: pool.name || pool.pool_id || `Pool ${idx + 1}`,
      sub: formatCurrency(pool.committed_amount || 0),
      x: idx === 0 ? "74%" : "28%",
      y: idx === 0 ? "63%" : "45%",
      kind: "pool",
      entityType: "pool",
    });
  });

  (riskItems || []).slice(0, 2).forEach((r, idx) => {
    nodes.push({
      id: r.participant_id || `participant_${idx}`,
      label: r.participant_id || `Participant ${idx + 1}`,
      sub: `${String(r.risk_band || "low").toUpperCase()} risk`,
      x: idx === 0 ? "75%" : "73%",
      y: idx === 0 ? "73%" : "31%",
      kind: "secondary",
      entityType: "participant",
    });
  });

  return nodes;
}

function buildMapArcs(proofMetrics, riskItems) {
  const arcs = [
    {
      from: ["52%", "52%"],
      to: ["38%", "81%"],
      color: "orange",
      bend: -80,
      type: "capital_flow",
    },
    {
      from: ["52%", "52%"],
      to: ["69%", "42%"],
      color: "blue",
      bend: 120,
      type: "outcome_flow",
    },
  ];

  (riskItems || []).slice(0, 2).forEach((r, idx) => {
    arcs.push({
      from: ["52%", "52%"],
      to: idx === 0 ? ["75%", "73%"] : ["73%", "31%"],
      color: "blue",
      bend: idx === 0 ? 60 : 140,
      type: "participant_risk",
      entityId: r.participant_id,
    });
  });

  if (proofMetrics.capitalDeployed > 0) {
    arcs.push({
      from: ["38%", "81%"],
      to: ["69%", "42%"],
      color: "orange",
      bend: 70,
      type: "payment_route",
    });
  }

  return arcs;
}

function buildRightPanel(proofMetrics, anomalyItems) {
  const hasAnomaly = anomalyItems.length > 0;
  const onHold = proofMetrics.activeHolds > 0;

  return {
    title: "Job90 Payment Inquiry",
    status: onHold ? "ON HOLD" : "READY",
    proposedBy: "AAL",
    metrics: {
      timeEstimate: "5.7 hrs",
      severity: hasAnomaly ? "MEDIUM" : "LOW",
      confidence: "8.1x",
      complexity: "MEDIUM",
    },
    requirements: [
      { label: "Verifier Needed", value: "Readied", ok: true },
      { label: "Funding Pool", value: "Workforce Pool A", ok: true },
      { label: "Contract", value: "Workforce Job90", ok: true },
      { label: "Feasibility", value: "Initial Review", ok: true },
    ],
    summary: [
      hasAnomaly
        ? "Outcome integrity alerts detected and require review."
        : "No blocking anomaly cluster detected.",
      `Capital line visible: ${formatCurrency(proofMetrics.capitalDeployed)}`,
      `${proofMetrics.verifiedOutcomes} verified outcomes linked to this program.`,
      `Efficiency score: ${Number(proofMetrics.topEfficiencyScore || 0).toFixed(4)}`,
    ],
  };
}

function buildTimeline(proofMetrics, anomalyItems) {
  return [
    {
      label: "risk signal",
      meta: "AAL",
      state: proofMetrics.highRiskParticipants > 0 ? "warning" : "ok",
    },
    {
      label: anomalyItems.length > 0 ? "anomaly detected" : "anomaly clear",
      meta: "Watchtower",
      state: anomalyItems.length > 0 ? "critical" : "ok",
    },
    {
      label: proofMetrics.activeHolds > 0 ? "hold active" : "verification inquiry",
      meta: "Control",
      state: proofMetrics.activeHolds > 0 ? "critical" : "info",
    },
    {
      label: proofMetrics.executedActions > 0 ? "action executed" : "action queued",
      meta: "Execution",
      state: proofMetrics.executedActions > 0 ? "ok" : "info",
    },
    {
      label: proofMetrics.verifiedOutcomes > 0 ? "outcome verified" : "outcome pending",
      meta: "Outcome",
      state: proofMetrics.verifiedOutcomes > 0 ? "ok" : "warning",
    },
    {
      label: proofMetrics.capitalDeployed > 0 ? "payment release" : "payment pending",
      meta: "Funding",
      state: proofMetrics.capitalDeployed > 0 ? "ok" : "warning",
    },
  ];
}

export async function loadCommandCenterData(apiBase = DEFAULT_API_BASE) {
  const requests = await Promise.allSettled([
    fetchJson(`${apiBase}/api/v1/operator/summary`),
    fetchJson(`${apiBase}/api/v1/operator/flow`),
    fetchJson(`${apiBase}/api/v1/operator/pools`),
    fetchJson(`${apiBase}/api/v1/aal/participant-risk`),
    fetchJson(`${apiBase}/api/v1/aal/program-health`),
    fetchJson(`${apiBase}/api/v1/aal/anomalies`),
    fetchJson(`${apiBase}/api/v1/aal/priority-queue`),
    fetchJson(`${apiBase}/api/v1/efficiency/program/program_workforce_pilot`),
  ]);

  const [
    summaryRes,
    flowRes,
    poolsRes,
    riskRes,
    programRes,
    anomalyRes,
    priorityRes,
    efficiencyRes,
  ] = requests;

  const summary =
    summaryRes.status === "fulfilled" ? summaryRes.value.summary || {} : {};
  const flow =
    flowRes.status === "fulfilled" ? flowRes.value.flow || {} : {};
  const pools =
    poolsRes.status === "fulfilled" ? poolsRes.value.items || [] : [];
  const riskItems =
    riskRes.status === "fulfilled" ? riskRes.value.items || [] : [];
  const programItems =
    programRes.status === "fulfilled" ? programRes.value.items || [] : [];
  const anomalyItems =
    anomalyRes.status === "fulfilled" ? anomalyRes.value.items || [] : [];
  const priorityItems =
    priorityRes.status === "fulfilled" ? priorityRes.value.items || [] : [];
  const efficiency =
    efficiencyRes.status === "fulfilled" ? efficiencyRes.value.result || {} : {};

  const proofMetrics = buildProofMetrics(
    summary,
    riskItems,
    anomalyItems,
    efficiency
  );

  return {
    header: buildHeader(summary, efficiency),
    proofMetrics,
    leftRail: buildLeftRail(riskItems, anomalyItems, priorityItems),
    centerMap: {
      nodes: buildMapNodes(flow, pools, proofMetrics, riskItems),
      arcs: buildMapArcs(proofMetrics, riskItems),
    },
    rightPanel: buildRightPanel(proofMetrics, anomalyItems),
    bottomTimeline: buildTimeline(proofMetrics, anomalyItems),
    raw: {
      summary,
      flow,
      pools,
      riskItems,
      programItems,
      anomalyItems,
      priorityItems,
      efficiency,
    },
  };
}

