import {
  createBridgeTrustEnvelope,
  createReportPackageFromReferral,
  createVerificationPackageFromReferral,
  mapHubReferralToCanonicalReferral,
  type HubReferralSource,
} from "@/system/contracts";

export function buildSampleHubReferralSource(): HubReferralSource {
  return {
    case_id: "hub_case_demo_001",
    organization_id: "org_shf",
    receiving_organization_id: "org_franklin_workforce",
    need_category: "employment",
    urgency_level: "high",
    priority: "high",
    status: "resolved",
    assigned_user_id: "user_admin_001",
    notes: "Demo referral source flowing from hub into aggregation bridge.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function buildHubReferralBridgeDemo() {
  const source = buildSampleHubReferralSource();

  const trust = createBridgeTrustEnvelope({
    verificationState: "pending",
    confidenceLevel: "high",
    confidenceScore: 88,
    freshnessLabel: "24h",
    sourceCount: 2,
    sourceIds: ["hub_referral_stream", "hub_operator_action"],
    lineageId: "bridge_demo_referral_001",
    lastUpdatedAt: new Date().toISOString(),
    publicationMode: "admin_internal",
  });

  const canonicalReferral = mapHubReferralToCanonicalReferral(source, trust);

  const verificationPackage = createVerificationPackageFromReferral(
    canonicalReferral,
    "hub_referral",
    source.case_id,
    trust
  );

  const reportingPackage = createReportPackageFromReferral(
    canonicalReferral,
    "hub_referral",
    source.case_id,
    trust
  );

  return {
    source,
    canonicalReferral,
    verificationPackage,
    reportingPackage,
  };
}
