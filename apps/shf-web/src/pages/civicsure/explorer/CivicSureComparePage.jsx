// apps/shf-web/src/pages/civicsure/explorer/CivicSureComparePage.jsx
//
// CivicSure Compare View — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_COMPARE_VIEW_FRAME.md), same
// phase discipline as every other page in this suite: this is a
// visual/layout build only. It does not wire a live CivicSure/GPA
// comparison query — every entity, comparability judgment, and
// methodology value shown here comes from compareViewMockData.js,
// explicitly marked DEMO / FRAME DATA. This page does not implement
// Shared Reporting, Public Disclosure, Credential, Truth, Evidence, or
// Metric Registry authority, and does not touch any of those systems,
// or any operator/admin UI.
//
// State shape is deliberately structured so a future version could
// mirror it into the URL without a rewrite: `compareType` (one of
// COMPARE_TYPES), `selectionsByType[compareType]` (an ordered array of
// entity ids, max MAX_COMPARE_ITEMS), and `activeSection` (one of
// COMPARE_SECTIONS) are the three pieces of state that would become
// query params (e.g. `?type=programs&ids=a,b&section=funding`) — none
// of that syncing is implemented in this frame, per the brief's "do
// not implement production URL syncing unless trivial and safe"
// instruction, but nothing in this component's state shape would need
// to change to add it later.
import React, { useMemo, useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-compare.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import CompareHeader from "./components/compare/CompareHeader.jsx";
import CompareTypeSelector from "./components/compare/CompareTypeSelector.jsx";
import CompareSelectionBar from "./components/compare/CompareSelectionBar.jsx";
import CompareEntityPicker from "./components/compare/CompareEntityPicker.jsx";
import CompareEmptyState from "./components/compare/CompareEmptyState.jsx";
import CompareEntityCards from "./components/compare/CompareEntityCards.jsx";
import CompareCompatibilityPanel from "./components/compare/CompareCompatibilityPanel.jsx";
import CompareSectionNav from "./components/compare/CompareSectionNav.jsx";
import CompareOverviewPanel from "./components/compare/CompareOverviewPanel.jsx";
import CompareFundingPanel from "./components/compare/CompareFundingPanel.jsx";
import CompareDeliveryPanel from "./components/compare/CompareDeliveryPanel.jsx";
import CompareOutcomesPanel from "./components/compare/CompareOutcomesPanel.jsx";
import CompareEvidencePanel from "./components/compare/CompareEvidencePanel.jsx";
import CompareAssurancePanel from "./components/compare/CompareAssurancePanel.jsx";
import CompareMethodologyPanel from "./components/compare/CompareMethodologyPanel.jsx";
import CompareDifferenceExplanation from "./components/compare/CompareDifferenceExplanation.jsx";
import CompareDataQualityNotice from "./components/compare/CompareDataQualityNotice.jsx";
import CompareAboutPanel from "./components/compare/CompareAboutPanel.jsx";
import {
  COMPARE_TYPES,
  COMPARE_SECTIONS,
  MAX_COMPARE_ITEMS,
  MIN_COMPARE_ITEMS,
  getEntitiesByType,
  getEntity,
  computeComparability,
  buildDifferenceExplanations,
  buildComparisonLimitations,
} from "./compareViewMockData.js";

const SECTION_PANELS = {
  overview: CompareOverviewPanel,
  funding: CompareFundingPanel,
  delivery: CompareDeliveryPanel,
  outcomes: CompareOutcomesPanel,
  evidence: CompareEvidencePanel,
  assurance: CompareAssurancePanel,
  methodology: CompareMethodologyPanel,
};

const EMPTY_SELECTIONS = { programs: [], providers: [], counties: [], outcomes: [] };

export default function CivicSureComparePage() {
  const [compareType, setCompareType] = useState("programs");
  const [selectionsByType, setSelectionsByType] = useState(EMPTY_SELECTIONS);
  const [activeSection, setActiveSection] = useState("overview");
  const [aboutOpen, setAboutOpen] = useState(false);

  const selectedIds = selectionsByType[compareType];
  const entities = useMemo(() => getEntitiesByType(compareType), [compareType]);
  const selectedEntities = useMemo(() => selectedIds.map((id) => getEntity(compareType, id)).filter(Boolean), [compareType, selectedIds]);

  const hasSelection = selectedIds.length > 0;
  const hasComparableSelection = selectedEntities.length >= MIN_COMPARE_ITEMS;

  const comparability = useMemo(() => (hasComparableSelection ? computeComparability(selectedEntities) : null), [hasComparableSelection, selectedEntities]);
  const differenceReasons = useMemo(() => (hasComparableSelection ? buildDifferenceExplanations(selectedEntities) : []), [hasComparableSelection, selectedEntities]);
  const limitations = useMemo(() => (hasComparableSelection ? buildComparisonLimitations(selectedEntities) : []), [hasComparableSelection, selectedEntities]);

  function handleToggleEntity(id) {
    setSelectionsByType((prev) => {
      const current = prev[compareType];
      const isSelected = current.includes(id);
      let next;
      if (isSelected) {
        next = current.filter((existingId) => existingId !== id);
      } else if (current.length >= MAX_COMPARE_ITEMS) {
        next = current;
      } else {
        next = [...current, id];
      }
      return { ...prev, [compareType]: next };
    });
  }

  function handleRemoveEntity(id) {
    setSelectionsByType((prev) => ({ ...prev, [compareType]: prev[compareType].filter((existingId) => existingId !== id) }));
  }

  function handleClear() {
    setSelectionsByType((prev) => ({ ...prev, [compareType]: [] }));
  }

  function handleQuickAction(type) {
    setCompareType(type);
  }

  function handleShortcut(shortcut) {
    setCompareType(shortcut.compareType);
    setSelectionsByType((prev) => ({ ...prev, [shortcut.compareType]: shortcut.selectedIds }));
    setActiveSection("overview");
  }

  const ActiveSectionPanel = SECTION_PANELS[activeSection];

  return (
    <div className="civicsure-compare">
      <a className="cse-skip-link" href="#cscmp-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <CompareHeader hasSelection={hasSelection} onClear={handleClear} onAboutOpen={() => setAboutOpen(true)} />

      <main id="cscmp-main">
        <div className="cse-container">
          <CompareTypeSelector types={COMPARE_TYPES} activeKey={compareType} onSelect={setCompareType} />

          <CompareSelectionBar selectedEntities={selectedEntities} onRemove={handleRemoveEntity} />

          <CompareEntityPicker entities={entities} selectedIds={selectedIds} onToggle={handleToggleEntity} />

          {selectedEntities.length === 0 ? (
            <CompareEmptyState onQuickAction={handleQuickAction} onShortcut={handleShortcut} />
          ) : null}

          {hasComparableSelection ? (
            <>
              <CompareEntityCards entities={selectedEntities} />

              <CompareCompatibilityPanel comparability={comparability} />

              <CompareSectionNav sections={COMPARE_SECTIONS} activeKey={activeSection} onSelect={setActiveSection} />

              <ActiveSectionPanel entities={selectedEntities} />

              <CompareDifferenceExplanation reasons={differenceReasons} />

              <CompareDataQualityNotice limitations={limitations} />
            </>
          ) : null}
        </div>
      </main>

      <CivicSurePublicFooter />

      <CompareAboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
