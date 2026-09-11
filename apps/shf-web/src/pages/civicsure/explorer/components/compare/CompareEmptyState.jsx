// CompareEmptyState.jsx — "What would you like to compare?" starting
// state shown when nothing is selected yet. Quick actions switch
// compare type; starting-question shortcuts configure both compare
// type and a demo selection in one click. Local state only. DEMO /
// FRAME DATA (see ../../compareViewMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { QUICK_ACTIONS, STARTING_SHORTCUTS } from "../../compareViewMockData.js";

export default function CompareEmptyState({ onQuickAction, onShortcut }) {
  return (
    <div className="cse-card cse-cmp-empty" aria-labelledby="cse-cmp-empty-heading">
      <h2 id="cse-cmp-empty-heading">What would you like to compare?</h2>

      <div className="cse-cmp-empty__quick-actions">
        {QUICK_ACTIONS.map((qa) => (
          <button type="button" className="cse-btn cse-btn--outline" key={qa.key} onClick={() => onQuickAction(qa.compareType)}>
            <ExplorerIcon name="arrowRight" />
            {qa.label}
          </button>
        ))}
      </div>

      <div className="cse-cmp-empty__shortcuts">
        <h3>Or start from a common question</h3>
        <ul>
          {STARTING_SHORTCUTS.map((s) => (
            <li key={s.key}>
              <button type="button" className="cse-cmp-empty__shortcut" onClick={() => onShortcut(s)}>
                {s.label}
                <ExplorerIcon name="chevronRight" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
