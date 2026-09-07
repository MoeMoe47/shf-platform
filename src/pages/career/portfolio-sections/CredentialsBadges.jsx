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
import { emailMyCertificate, listMyCertificates, listMyCredentials, renderMyCertificate } from "@/lib/credentials/api.js";

const LIFECYCLE_LABEL = {
  ISSUED: "Earned",
  RENEWAL_DUE: "Renewal due",
  EXPIRED: "Expired",
};

export default function CredentialsBadges({ role }) {
  const [state, setState] = React.useState({ loading: true, error: null, items: [], certificates: [] });
  const [delivery, setDelivery] = React.useState({});

  React.useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    Promise.all([listMyCredentials(role), listMyCertificates(role)])
      .then(([credentials, certificates]) => {
        if (!active) return;
        const items = (credentials?.items || []).filter((item) => item.lifecycle !== "REVOKED");
        setState({ loading: false, error: null, items, certificates: certificates?.items || [] });
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error, items: [], certificates: [] });
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
      {!state.loading && !state.error && state.certificates.length > 0 && (
        <div className="sp-certificateList" aria-label="Issued certificates">
          <h3 className="sp-cardTitle">Issued certificates</h3>
          {state.certificates.filter((item) => item.status !== "REVOKED").map((certificate) => (
            <div key={certificate.certificateId} className="sp-badge">
              <span className="sp-badgeLabel">{certificate.presentationSnapshot?.certificateTitle || certificate.certificateType}</span>
              <span className="sp-badgeLabel sp-badgeDate">Issued {new Date(certificate.issuedAt).toLocaleDateString()}</span>
              <span className="sp-badgeLabel">Reference {certificate.certificateSerial}</span>
              <button type="button" onClick={async () => { const file = await renderMyCertificate(role, certificate.certificateId); const url = URL.createObjectURL(file.blob); const link = document.createElement("a"); link.href = url; link.download = file.filename; link.click(); URL.revokeObjectURL(url); }}>Download PDF</button>
              <button type="button" onClick={async () => { const file = await renderMyCertificate(role, certificate.certificateId, "HTML"); const url = URL.createObjectURL(file.blob); window.open(url, "_blank", "noopener,noreferrer"); }}>Print / view</button>
              <button type="button" onClick={() => { window.open(`http://127.0.0.1:8091/certificates/verify/${encodeURIComponent(certificate.verificationReference)}`, "_blank", "noopener,noreferrer"); }}>Verify</button>
              <button type="button" onClick={async () => { setDelivery((current) => ({ ...current, [certificate.certificateId]: "Sending…" })); try { await emailMyCertificate(role, certificate.certificateId); setDelivery((current) => ({ ...current, [certificate.certificateId]: "Delivered" })); } catch { setDelivery((current) => ({ ...current, [certificate.certificateId]: "Delivery failed" })); } }}>{delivery[certificate.certificateId] || "Email certificate"}</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
