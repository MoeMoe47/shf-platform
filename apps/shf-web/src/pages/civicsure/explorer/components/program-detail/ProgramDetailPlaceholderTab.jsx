// ProgramDetailPlaceholderTab.jsx — honest "not built yet" panel for
// the Money / Delivery / Outcomes / Evidence / Providers / Timeline
// tabs. Frame scope discipline: rather than fabricating content for
// tabs outside this phase's build, each renders a plain-English note
// naming what will eventually appear there, with a real Overview link.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { PROGRAM_DETAIL_TAB_PREVIEWS } from "../../programDetailMockData.js";

export default function ProgramDetailPlaceholderTab({ tabKey, tabs, programName, onNavigateTab }) {
  const tab = tabs.find((t) => t.key === tabKey);
  const preview = PROGRAM_DETAIL_TAB_PREVIEWS[tabKey];

  return (
    <div
      className="cse-card cse-pd-placeholder"
      role="tabpanel"
      id={`cse-pd-tabpanel-${tabKey}`}
      aria-labelledby={`cse-pd-tab-${tabKey}`}
    >
      <span className="cse-pd-placeholder__icon" aria-hidden="true">
        <ExplorerIcon name="infoCircle" />
      </span>
      <h2 className="cse-pd-placeholder__heading">{tab ? tab.label : tabKey} — coming soon</h2>
      <p className="cse-pd-placeholder__body">
        This section will show {preview} for {programName} once it&rsquo;s wired to live CivicSure data. It&rsquo;s not part of
        this page frame yet.
      </p>
      <button type="button" className="cse-btn cse-btn--outline" onClick={() => onNavigateTab("overview")}>
        Back to Overview
      </button>
    </div>
  );
}
