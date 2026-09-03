// src/pages/career/portfolio-sections/CredentialsBadges.jsx
//
// SHF Ecosystem Phase 8 — renders the learner's durable Credential authority.
// array with the learner's real, canonically-issued Credentials
// (GET /credentials/me). Shows exactly what the backend says was
// actually issued — never "Earned" for a merely-eligible credential, and
// never a revoked one. An honest empty state renders when the learner
// has no real Credentials yet; this is expected for most accounts today
// (see docs/SHF_CREDENTIAL_ARCHITECTURE.md — issuance is manual/
// institutional, not automatic).
import React from "react";
import { PortfolioIcon } from "@/components/curriculum/icons.jsx";
import { listMyCredentials } from "@/lib/credentials/api.js";

const LIFECYCLE_LABEL = {
  ISSUED: "Earned",
  RENEWAL_DUE: "Renewal due",
  EXPIRED: "Expired",
};

export default function CredentialsBadges({ role }) {
  const [state, setState] = React.useState({ loading: true, error: null, items: [] });

  React.useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    listMyCredentials(role)
      .then((data) => {
        if (!active) return;
        const items = (data?.items || []).filter((item) => item.lifecycle !== "REVOKED");
        setState({ loading: false, error: null, items });
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error, items: [] });
      });
    return () => {
      active = false;
    };
  }, [role]);

  return (
    <section className="sp-card" aria-labelledby="sp-credentials-h">
      <div className="sp-cardHeadRow">
        <h2 id="sp-credentials-h" className="sp-cardTitle">
          Credentials &amp; Badges
        </h2>
        <span className="sp-cardMeta">Issued by the institution</span>
      </div>

      {state.loading ? (
        <p className="sp-cardEmpty">Loading credentials…</p>
      ) : state.error ? (
        <p className="sp-cardEmpty">Credentials are unavailable right now.</p>
      ) : state.items.length === 0 ? (
        <p className="sp-cardEmpty">No credentials issued yet. Earned credentials will appear here.</p>
      ) : (
        <div className="sp-badgeGrid">
          {state.items.map((item) => (
            <div key={item.id} className="sp-badge">
              <span className="sp-badgeIcon tone-a" aria-hidden="true">
                <PortfolioIcon size={26} />
              </span>
              <span className="sp-badgeLabel">{item.definition.name}</span>
              <span className="sp-badgeLabel sp-badgeStatus">{LIFECYCLE_LABEL[item.lifecycle] || item.lifecycle}</span>
              <span className="sp-badgeLabel sp-badgeDate">Issued {new Date(item.issuedAt).toLocaleDateString()}</span>
              <span className="sp-badgeLabel sp-badgeIssuer">{item.definition.issuingAuthority}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
