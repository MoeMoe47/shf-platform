import {
  getIEPSummary,
  getIEPRiskEvents,
  getIEPFundingSnapshot
} from "./iepIntegrationStore";

export default function useIEPIntegration() {
  const summary = getIEPSummary();
  const riskEvents = getIEPRiskEvents();
  const funding = getIEPFundingSnapshot();

  return {
    summary,
    riskEvents,
    funding
  };
}
