// src/pages/sales/Help.jsx
//
// The body text below previously read "FAQ, support, and civic
// participation guidelines" — leftover Civic-app copy, same
// cross-vertical contamination pattern found and fixed throughout the
// rest of this restoration. Wrapper classes (.crb-main/.db-title/.card)
// were already correct and are unchanged.
import React from "react";

export default function Help() {
  return (
    <section className="crb-main">
      <h1 className="db-title">Help</h1>
      <div className="card card--pad">
        <p>FAQ and support for the Sales app.</p>
      </div>
    </section>
  );
}
