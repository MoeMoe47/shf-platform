import useOrganizations from "./useOrganizations";
import useReferrals from "./useReferrals";

export default function usePartnerQueue() {
  const orgs = useOrganizations();
  const referrals = useReferrals();

  const orgMap = Object.fromEntries(
    (orgs.items || []).map((org) => [org.organization_id, org])
  );

  const queueItems = (referrals.items || []).map((item) => ({
    ...item,
    sendingOrganization:
      orgMap[item.organization_id]?.organization_name ||
      orgMap[item.organization_id]?.display_name ||
      item.organization_id,
  }));

  return {
    items: queueItems,
    loading: orgs.loading || referrals.loading,
    error: orgs.error || referrals.error,
    organizations: orgs.items || [],
    referrals: referrals.items || [],
  };
}
