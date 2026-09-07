function asArray(value: any) { return Array.isArray(value) ? value : []; }

function text(value: any, fallback = "Not available") {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function number(value: any) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function currency(value: any) {
  const amount = number(value);
  return amount === null ? "Not available" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function status(value: any) { return text(value, "Not reported").replaceAll("_", " "); }

function recordReference(item: any, fallbackType: string) {
  const id = item?.id || item?.reference || item?.claim_id || item?.finding_id || item?.truth_fact_id || item?.metric_result_id;
  return id ? { type: fallbackType, id: String(id), label: text(item?.label || id) } : null;
}

function uniqueReferences(items: any[], idKey: string, nameKey: string, fallbackName = "Canonical record") {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item?.[idKey] || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).map((item) => ({ reference: String(item[idKey]), name: text(item[nameKey], fallbackName), status: status(item.status), providers: text(item.provider_count, "Canonical detail required"), issues: text(item.open_issue_count, "Canonical detail required") }));
}

export function isExecutiveAssurance(report: any) {
  return String(report?.reportType || report?.report_type || "").toUpperCase() === "EXECUTIVE_ASSURANCE";
}

export function buildExecutiveAssurancePresentation(report: any) {
  const facts = report?.canonicalFacts || {};
  const dashboard = facts.dashboard || {};
  const summary = dashboard.summary || {};
  const funding = asArray(facts.funding);
  const programs = asArray(facts.programs).length ? asArray(facts.programs) : funding;
  const providers = asArray(facts.providers).length ? asArray(facts.providers) : funding;
  const truth = asArray(facts.truth);
  const claims = asArray(facts.claims);
  const findings = asArray(facts.findings);
  const reconciliations = asArray(facts.reconciliations);
  const audits = asArray(facts.audits);
  const sources = asArray(facts.sources);
  const period = report?.scope?.reportingPeriod;
  const periodLabel = typeof period === "object" ? period?.label : period;

  const attention = [
    ...findings.map((item) => ({ type: "Finding", reference: text(item.finding_id), status: status(item.status), detail: text(item.description || item.finding_type, "Finding requires review") })),
    ...reconciliations.map((item) => ({ type: "Data Conflict Review", reference: text(item.reconciliation_case_id || item.case_id), status: status(item.status), detail: text(item.conflict_type, "Source conflict requires review") })),
    ...sources.filter((item) => ["STALE", "DEGRADED"].includes(String(item.current_freshness_state || "").toUpperCase())).map((item) => ({ type: "Source Health", reference: text(item.source_system_id || item.source_id), status: status(item.current_freshness_state), detail: "Source freshness requires review" })),
  ];

  return {
    product: "CivicSure",
    formalName: "CivicSure — Government Program Assurance Platform",
    category: "Government Program Assurance Infrastructure",
    reportTitle: "Executive Assurance Report",
    jurisdiction: text(report?.scope?.jurisdiction, "Jurisdiction not specified"),
    organization: text(report?.scope?.organizationId, "Organization not specified"),
    reportingPeriod: text(periodLabel, "Reporting period not specified"),
    generatedAt: text(report?.generatedAt),
    generatedBy: text(report?.scope?.generatedBy || report?.generatedBy, "System-generated"),
    reportVersion: Number(report?.reportVersion || 2),
    classification: text(report?.classification, "INTERNAL"),
    aiInvolvement: "No",
    summary: {
      funded: currency(summary.fundingAwarded),
      delivered: `${number(summary.programs) ?? 0} programs and ${number(summary.providers) ?? 0} providers in scope`,
      verified: `${number(summary.acceptedTruthFacts) ?? 0} accepted verified facts and ${number(summary.verifiedClaims) ?? 0} verified claims`,
      attention: `${attention.length} item(s) requiring attention`,
      decisions: "Only canonical decision-required records are included; no renderer recommendations are added.",
    },
    scorecard: [
      ["Funding", currency(summary.fundingAwarded), status(summary.fundingAwarded == null ? "NOT_REPORTED" : "REPORTED")],
      ["Programs", number(summary.programs) ?? 0, status(summary.programs == null ? "NOT_REPORTED" : "IN_SCOPE")],
      ["Providers", number(summary.providers) ?? 0, status(summary.providers == null ? "NOT_REPORTED" : "IN_SCOPE")],
      ["Verified Outcomes", number(summary.acceptedTruthFacts) ?? 0, status(summary.acceptedTruthFacts == null ? "NOT_REPORTED" : "ACCEPTED")],
      ["Material Issues", number(summary.openMaterialReconciliations) ?? 0, status(summary.openMaterialReconciliations ? "REQUIRES_REVIEW" : "CLEAR")],
      ["Source Health", number(summary.degradedOrStaleSources) ?? 0, status(summary.degradedOrStaleSources ? "REQUIRES_REVIEW" : "HEALTHY")],
    ].map(([label, value, state]) => ({ label, value, state })),
    funding: {
      totals: [
        ["Funded", currency(summary.fundingAwarded)],
        ["Obligated", currency(summary.fundingObligated)],
        ["Reported / paid", "Canonical detail required"],
        ["Verified expenditure", currency(summary.verifiedExpenditure)],
      ].map(([label, value]) => ({ label, value })),
      rows: funding.slice(0, 40).map((item) => ({
        reference: text(item.funding_reference_id),
        program: text(item.program_reference),
        provider: text(item.provider_organization_reference),
        type: status(item.canonical_record_type),
        amount: currency(item.amount),
        status: status(item.status),
      })),
    },
    programs: uniqueReferences(programs, programs === funding ? "program_reference" : "program_reference", programs === funding ? "program_reference" : "program_name").slice(0, 40),
    providers: uniqueReferences(providers, providers === funding ? "provider_organization_reference" : "provider_reference", providers === funding ? "provider_organization_reference" : "provider_name").map((item) => ({ ...item, findings: item.issues, actions: item.providers })).slice(0, 40),
    verifiedOutcomes: truth.slice(0, 40).map((item) => ({ reference: text(item.truth_fact_id), subject: text(item.subject_reference), type: text(item.fact_type), value: text(item.fact_value), level: status(item.verification_level), accepted: text(item.accepted_at) })),
    attention,
    findings: findings.slice(0, 40).map((item) => ({ reference: text(item.finding_id), status: status(item.status), severity: status(item.severity), owner: text(item.provider_reference || item.program_reference), action: text(item.corrective_action_reference, "No corrective action reference") })),
    sourceHealth: sources.slice(0, 40).map((item) => ({ source: text(item.source_system_id || item.source_id), authority: text(item.authority_role, "Canonical authority not reported"), freshness: status(item.current_freshness_state || item.health_state), status: status(item.status) })),
    decisionsRequired: asArray(facts.decisionsRequired).slice(0, 20).map((item) => ({ reference: text(item.decision_id || item.reference), subject: text(item.subject), status: status(item.status), detail: text(item.description || item.reason) })),
    activity: [
      ...claims.slice(0, 10).map((item) => ({ type: "Claim", reference: text(item.claim_id), status: status(item.status) })),
      ...audits.slice(0, 10).map((item) => ({ type: "Audit", reference: text(item.audit_engagement_id), status: status(item.status) })),
    ],
    methodology: {
      scope: "This report is a deterministic presentation of the authorized immutable CivicSure reporting snapshot.",
      assurance: "Official values are consumed from canonical GPA services and are not recalculated by the renderer.",
      verification: "Verified Outcomes include only canonical facts presented as accepted/verified in the snapshot.",
      sources: `${sources.length} source record(s) are represented in the authorized snapshot where available.`,
      limitations: "Missing canonical fields are shown as Not available; the report does not infer findings, sanctions, or decisions.",
      snapshot: "This artifact is an immutable snapshot. Later source changes require a new report artifact.",
    },
    references: asArray(report?.canonicalReferences).slice(0, 200).map((item) => recordReference(item, item?.type || "Canonical Record")).filter(Boolean),
    metadata: {
      artifactId: report?.artifactId || report?.artifact_id || "Assigned after artifact creation",
      reportType: report?.reportType,
      reportVersion: Number(report?.reportVersion || 2),
      templateVersion: 2,
      rendererVersion: "civicsure-r2-renderer-1",
      reportingPeriod: text(periodLabel),
      generatedAt: text(report?.generatedAt),
      generatedBy: text(report?.generatedBy, "System-generated"),
      organization: text(report?.scope?.organizationId),
      tenant: text(report?.scope?.tenantId),
      jurisdiction: text(report?.scope?.jurisdiction),
      classification: text(report?.classification, "INTERNAL"),
      payloadHash: "Persisted on artifact snapshot",
      renderedFileHash: "Persisted on rendered file",
      canonicalReferenceCount: asArray(report?.canonicalReferences).length,
      aiInvolvement: "No",
    },
  };
}
