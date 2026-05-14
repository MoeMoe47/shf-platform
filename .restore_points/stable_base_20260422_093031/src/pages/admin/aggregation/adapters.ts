import {
  aggregationOrganizations,
  aggregationOutcomes,
  aggregationReferrals,
  aggregationReports,
  aggregationSignals,
  aggregationVerificationRecords,
} from "./mockData";

export function getAggregationOverviewStats() {
  return {
    organizations: aggregationOrganizations.length,
    referrals: aggregationReferrals.length,
    outcomes: aggregationOutcomes.length,
    verifications: aggregationVerificationRecords.length,
    reports: aggregationReports.length,
    signals: aggregationSignals.length,
  };
}

export function getEntityResolutionItems() {
  return aggregationOrganizations.map((org) => ({
    id: org.id,
    name: org.name,
    county: org.county || "—",
    status: org.status || "unknown",
    confidenceScore: org.trust?.confidenceScore ?? 0,
    verificationState: org.trust?.verificationState ?? "pending",
    lineageId: org.trust?.lineageId || "—",
  }));
}

export function getLineageItems() {
  return [
    ...aggregationOrganizations.map((x) => ({
      id: x.id,
      type: "organization",
      title: x.name,
      lineageId: x.trust?.lineageId || "—",
      sourceCount: x.trust?.sourceCount || 0,
      freshness: x.trust?.freshnessLabel || "unknown",
    })),
    ...aggregationReferrals.map((x) => ({
      id: x.id,
      type: "referral",
      title: x.id,
      lineageId: x.trust?.lineageId || "—",
      sourceCount: x.trust?.sourceCount || 0,
      freshness: x.trust?.freshnessLabel || "unknown",
    })),
    ...aggregationOutcomes.map((x) => ({
      id: x.id,
      type: "outcome",
      title: x.outcomeType,
      lineageId: x.trust?.lineageId || "—",
      sourceCount: x.trust?.sourceCount || 0,
      freshness: x.trust?.freshnessLabel || "unknown",
    })),
  ];
}

export function getReconciliationItems() {
  return aggregationReferrals.map((x) => ({
    id: x.id,
    county: x.county || "—",
    status: x.status,
    priority: x.priority,
    confidenceScore: x.trust?.confidenceScore ?? 0,
  }));
}

export function getVerificationItems() {
  return aggregationVerificationRecords.map((x) => ({
    id: x.id,
    targetEntityType: x.targetEntityType,
    targetEntityId: x.targetEntityId,
    verificationState: x.verificationState,
    verifiedBy: x.verifiedBy || "—",
    verifiedAt: x.verifiedAt || "—",
    notes: x.notes || "",
  }));
}
