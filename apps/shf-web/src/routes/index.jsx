import React, { useEffect, useState } from "react";
import OperatorLayout from "../layouts/OperatorLayout";
import CivicSureShell from "../components/civicsure/CivicSureShell";
import OperatorDashboard from "../pages/operator/OperatorDashboard";
import ProgramManagement from "../pages/operator/ProgramManagement";
import CaseManagement from "../pages/operator/CaseManagement";
import ServiceEntitlements from "../pages/operator/ServiceEntitlements";
import ServiceAgreements from "../pages/operator/ServiceAgreements";
import OrganizationOnboarding from "../pages/operator/OrganizationOnboarding";
import FundingGrants from "../pages/operator/FundingGrants";
import ImpactAttribution from "../pages/operator/ImpactAttribution";
import GovernmentAssurance from "../pages/operator/GovernmentAssurance";
import CivicSureExplorerPage from "../pages/civicsure/explorer/CivicSureExplorerPage";
import CivicSureProgramDetailPage from "../pages/civicsure/explorer/CivicSureProgramDetailPage";
import CivicSureProviderDetailPage from "../pages/civicsure/explorer/CivicSureProviderDetailPage";
import CivicSureCountyDetailPage from "../pages/civicsure/explorer/CivicSureCountyDetailPage";
import CivicSureGeographyExplorerPage from "../pages/civicsure/explorer/CivicSureGeographyExplorerPage";
import CivicSureFundingDetailPage from "../pages/civicsure/explorer/CivicSureFundingDetailPage";
import CivicSureAgencyDetailPage from "../pages/civicsure/explorer/CivicSureAgencyDetailPage";
import CivicSureOutcomeDetailPage from "../pages/civicsure/explorer/CivicSureOutcomeDetailPage";
import CivicSureEvidenceSummaryPage from "../pages/civicsure/explorer/CivicSureEvidenceSummaryPage";
import CivicSureComparePage from "../pages/civicsure/explorer/CivicSureComparePage";
import CivicSureSearchResultsPage from "../pages/civicsure/explorer/CivicSureSearchResultsPage";

export default function AppRoutes() {
  // Pre-existing gap: this hand-rolled router read window.location.hash
  // once per render with nothing subscribing to it, so an in-app
  // <a href="#/..."> click updated the URL but never re-rendered
  // (confirmed by manual test: clicking a link changed the address bar
  // hash while the page stayed on the old view). Subscribing to
  // hashchange/popstate here is the minimal fix — every route above
  // and below (operator pages included) benefits, and no route-
  // matching logic changes.
  const [, forceRerender] = useState(0);
  useEffect(() => {
    const onHashChange = () => forceRerender((n) => n + 1);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, []);

  const hash = window.location.hash || "#/operator";
  const [path, query = ""] = hash.split("?");
  const view = new URLSearchParams(query).get("view");
  const isGovernmentAssurance = path === "#/operator/government-assurance";

  // CivicSure Explorer (and its Program Detail / Provider Detail /
  // County Detail / Geography Explorer / Funding Detail / Agency
  // Detail / Outcome Detail / Evidence Summary / Compare View / Search
  // Results sub-pages) are public-facing surfaces with their own full
  // page chrome (CivicSurePublicNav, rendered inside the page itself)
  // — they intentionally do not use OperatorLayout (internal operator
  // sidebar) or CivicSureShell (internal operator console topbar), so
  // they return early rather than falling through to either wrapper.
  const programDetailMatch = path.match(/^#\/explorer\/programs\/([^/]+)$/);
  if (programDetailMatch) {
    return <CivicSureProgramDetailPage programId={decodeURIComponent(programDetailMatch[1])} />;
  }
  const providerDetailMatch = path.match(/^#\/explorer\/providers\/([^/]+)$/);
  if (providerDetailMatch) {
    return <CivicSureProviderDetailPage providerId={decodeURIComponent(providerDetailMatch[1])} />;
  }
  const countyDetailMatch = path.match(/^#\/explorer\/counties\/([^/]+)$/);
  if (countyDetailMatch) {
    return <CivicSureCountyDetailPage countyId={decodeURIComponent(countyDetailMatch[1])} />;
  }
  const fundingDetailMatch = path.match(/^#\/explorer\/funding\/([^/]+)$/);
  if (fundingDetailMatch) {
    return <CivicSureFundingDetailPage fundingId={decodeURIComponent(fundingDetailMatch[1])} />;
  }
  const agencyDetailMatch = path.match(/^#\/explorer\/agencies\/([^/]+)$/);
  if (agencyDetailMatch) {
    return <CivicSureAgencyDetailPage agencyId={decodeURIComponent(agencyDetailMatch[1])} />;
  }
  const outcomeDetailMatch = path.match(/^#\/explorer\/outcomes\/([^/]+)$/);
  if (outcomeDetailMatch) {
    return <CivicSureOutcomeDetailPage outcomeId={decodeURIComponent(outcomeDetailMatch[1])} />;
  }
  const evidenceSummaryMatch = path.match(/^#\/explorer\/evidence\/([^/]+)$/);
  if (evidenceSummaryMatch) {
    return <CivicSureEvidenceSummaryPage evidenceId={decodeURIComponent(evidenceSummaryMatch[1])} />;
  }
  const publicProjectionMatch = path.match(/^#\/explorer\/projections\/([^/]+)$/);
  if (publicProjectionMatch) {
    return <CivicSureProgramDetailPage programId={decodeURIComponent(publicProjectionMatch[1])} />;
  }
  if (path === "#/explorer/compare") {
    return <CivicSureComparePage />;
  }
  if (path === "#/explorer/search") {
    return <CivicSureSearchResultsPage />;
  }
  if (path === "#/explorer/geography") {
    return <CivicSureGeographyExplorerPage />;
  }
  if (path === "#/explorer") {
    return <CivicSureExplorerPage />;
  }

  let page = <OperatorDashboard />;

  if (path === "#/operator/programs") {
    page = <ProgramManagement />;
  } else if (path === "#/operator/cases") {
    page = <CaseManagement />;
  } else if (path === "#/operator/services") {
    page = <ServiceEntitlements />;
  } else if (path === "#/operator/agreements") {
    page = <ServiceAgreements />;
  } else if (path === "#/operator/onboarding") {
    page = <OrganizationOnboarding />;
  } else if (path === "#/operator/funding") {
    page = <FundingGrants />;
  } else if (path === "#/operator/impact-attribution") {
    page = <ImpactAttribution />;
  } else if (isGovernmentAssurance) {
    page = <GovernmentAssurance initialView={view} />;
  } else if (path === "#/operator") {
    page = <OperatorDashboard />;
  }

  return isGovernmentAssurance ? <CivicSureShell>{page}</CivicSureShell> : <OperatorLayout>{page}</OperatorLayout>;
}
