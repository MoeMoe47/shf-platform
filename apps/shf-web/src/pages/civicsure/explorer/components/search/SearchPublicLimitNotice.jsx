// SearchPublicLimitNotice.jsx — a generic, public-safe notice that
// some results are limited by public-display rules. Deliberately
// vague: it never states or implies a count of hidden/private
// records, which would leak their existence. DEMO / FRAME DATA (see
// ../../searchResultsMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function SearchPublicLimitNotice({ message }) {
  return (
    <p className="cse-srch-limit-notice">
      <ExplorerIcon name="infoCircle" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
