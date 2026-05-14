export const CapabilityKeys = {
  MAP: "map",
  LEDGER: "ledger",
  ANALYTICS: "analytics",
  PAYMENTS: "payments"
};

export function computeCapabilityFlags(appId, manifest) {
  const caps = manifest?.capabilities || {};
  return {
    map: !!caps.map,
    ledger: !!caps.ledger,
    analytics: !!caps.analytics,
    payments: !!caps.payments
  };
}
