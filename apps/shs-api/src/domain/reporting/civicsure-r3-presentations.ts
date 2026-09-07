function money(value: any) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "Not available";
}

function status(value: any, fallback = "Not available") { return String(value || fallback).replaceAll("_", " "); }

function references(data: any) {
  return Array.isArray(data?.canonicalReferences) ? data.canonicalReferences : [];
}

function rows(report: any) {
  return report?.canonicalFacts || {};
}

function fundingRows(data: any) {
  return (data.funding || []).map((item: any) => ({
    reference: item.funding_reference_id || item.reference || item.canonical_record_id || "Unreferenced funding record",
    source: item.funding_source || item.funder_organization_reference || item.source_system_id || "Not specified",
    program: item.program_reference || item.program || "Not linked",
    provider: item.provider_organization_reference || item.provider || "Not linked",
    type: status(item.canonical_record_type || item.type),
    amount: money(item.amount || item.award_amount || item.awardAmount),
    rawAmount: Number(item.amount || item.award_amount || item.awardAmount || 0),
    status: status(item.status),
    provenance: item.provenance_reference || item.source_record_id || "Not specified",
  }));
}

function truthRows(data: any) {
  return (data.truth || []).filter((item: any) => String(item.status || "").toUpperCase() === "ACCEPTED").map((item: any) => ({
    reference: item.truth_fact_id || item.reference || "Unreferenced verified fact",
    subject: item.subject_reference || item.subject || "Not specified",
    outcome: item.fact_type || item.type || "Verified outcome",
    value: item.fact_value ?? item.value ?? "Not specified",
    level: item.verification_level || item.verificationLevel || "Not specified",
    status: status(item.status),
  }));
}

function issueRows(data: any) {
  const findings = (data.findings || []).map((item: any) => ({
    type: "Finding",
    reference: item.finding_id || item.reference || "Unreferenced finding",
    subject: item.subject_reference || item.provider_reference || item.program_reference || "Not specified",
    status: status(item.status),
    severity: status(item.severity),
    detail: item.summary || item.description || "Canonical finding requires review.",
  }));
  const reconciliations = (data.reconciliations || []).map((item: any) => ({
    type: "Data Conflict Review",
    reference: item.reconciliation_case_id || item.reference || "Unreferenced review",
    subject: item.subject_reference || "Not specified",
    status: status(item.status),
    severity: status(item.severity),
    detail: item.conflict_type || item.summary || "Canonical source conflict requires review.",
  }));
  return [...findings, ...reconciliations];
}

function base(report: any, title: string, subjectLabel: string) {
  const data = rows(report);
  const dashboard = data.dashboard || {};
  return {
    product: "CivicSure",
    category: "Government Program Assurance Infrastructure",
    reportTitle: title,
    subjectLabel,
    jurisdiction: report.scope?.jurisdiction || "Jurisdiction not specified",
    reportingPeriod: report.scope?.reportingPeriod && typeof report.scope.reportingPeriod === "object" ? report.scope.reportingPeriod.label || "Reporting period not specified" : report.scope?.reportingPeriod || "Reporting period not specified",
    generatedAt: report.generatedAt,
    reportVersion: report.reportVersion,
    classification: report.classification || "INTERNAL",
    scope: report.scope || {},
    attention: issueRows(data),
    verifiedOutcomes: truthRows(data),
    references: references(report),
    metadata: {
      reportType: report.reportType,
      reportVersion: report.reportVersion,
      subject: report.scope?.subjectReference || "Portfolio scope",
      classification: report.classification || "INTERNAL",
      canonicalReferenceCount: references(report).length,
      aiInvolvement: "No",
    },
    dashboard,
  };
}

function programPresentation(report: any) {
  const data = rows(report);
  const subject = report.scope?.subjectReference || "Program scope";
  const funding = fundingRows(data);
  const providers = [...new Set(funding.map((item: any) => item.provider).filter((item: string) => item !== "Not linked"))].map((reference: string) => ({ reference, status: "In scope", funding: money(funding.filter((item: any) => item.provider === reference).reduce((sum: number, item: any) => sum + item.rawAmount, 0)) }));
  const program = { reference: subject, status: funding.length ? "In scope" : "No linked funding records", funding: money(funding.reduce((sum: number, item: any) => sum + item.rawAmount, 0)), providers: providers.length };
  return { ...base(report, "Program Assurance Report", subject), program, funding, providers, claims: data.claims || [], metrics: data.metrics || [], monitoring: data.monitoring || [], audits: data.audits || [], sources: data.sources || [], correctiveActions: data.correctiveActions || [], findings: data.findings || [], dataQuality: data.quality || [] };
}

function providerPresentation(report: any) {
  const data = rows(report);
  const subject = report.scope?.subjectReference || "Provider scope";
  const funding = fundingRows(data);
  const programs = [...new Set(funding.map((item: any) => item.program).filter((item: string) => item !== "Not linked"))];
  return { ...base(report, "Provider Assurance Report", subject), provider: { reference: subject, status: funding.length ? "In scope" : "No linked funding records", programs: programs.length, fundingExposure: money(funding.reduce((sum: number, item: any) => sum + item.rawAmount, 0)) }, programs, funding, findings: data.findings || [], correctiveActions: data.correctiveActions || [], monitoring: data.monitoring || [], audits: data.audits || [], sources: data.sources || [], requirements: data.requirements || [] };
}

function fundingPresentation(report: any) {
  const data = rows(report);
  const funding = fundingRows(data);
  const total = funding.reduce((sum: number, item: any) => sum + item.rawAmount, 0);
  const stages = (data.lineageEdges || []).map((edge: any) => ({ from: edge.from_reference, fromType: edge.from_type, to: edge.to_reference, toType: edge.to_type, relationship: status(edge.relationship_type), amount: edge.amount == null ? "Not specified" : money(edge.amount) }));
  const programs = [...new Set(funding.map((item: any) => item.program).filter((item: string) => item !== "Not linked"))];
  const providers = [...new Set(funding.map((item: any) => item.provider).filter((item: string) => item !== "Not linked"))];
  return { ...base(report, "Funding Lineage Report", report.scope?.subjectReference || "Funding scope"), funding, total: money(total), programs, providers, stages, lineageComplete: stages.length > 0 && funding.length > 0, lineageGaps: stages.length ? [] : ["No canonical lineage edges were supplied in this snapshot."], services: data.services || [], claims: data.claims || [], verification: data.verification || [], sources: data.sources || [] };
}

export function buildCivicSureR3Presentation(report: any) {
  if (report?.reportType === "PROGRAM_ASSURANCE") return programPresentation(report);
  if (report?.reportType === "PROVIDER_ASSURANCE") return providerPresentation(report);
  if (report?.reportType === "FUNDING_LINEAGE") return fundingPresentation(report);
  return null;
}

export function isCivicSureR3(report: any) { return ["PROGRAM_ASSURANCE", "PROVIDER_ASSURANCE", "FUNDING_LINEAGE"].includes(report?.reportType); }
