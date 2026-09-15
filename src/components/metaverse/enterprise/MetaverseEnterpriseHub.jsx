import React, { useEffect, useState } from "react";
import { getEnterprise, listEnterpriseHistory, METAVERSE_ENTERPRISE_CLIENT_META } from "@/system/metaverse/metaverseEnterpriseClient.js";
import EnterpriseFormationForm from "./EnterpriseFormationForm.jsx";
import MetaverseEnterpriseProfile from "./MetaverseEnterpriseProfile.jsx";
import EnterpriseOpportunityPanel from "./EnterpriseOpportunityPanel.jsx";
import MetaverseEnterpriseReviewPanel from "./MetaverseEnterpriseReviewPanel.jsx";

// canReview: instructor/program/admin — server still re-checks every
// action; this only controls which buttons render.
export default function MetaverseEnterpriseHub({ open, enterprises, myTeams, opportunities, loading, error, canReview, onRefresh, onClose }) {
  const [selectedId, setSelectedId] = useState(enterprises?.[0]?.enterpriseId || "");
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!enterprises?.length) { setSelectedId(""); return; }
    if (!enterprises.some((enterprise) => enterprise.enterpriseId === selectedId)) setSelectedId(enterprises[0].enterpriseId);
  }, [enterprises, selectedId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedId) { setDetail(null); setHistory([]); return () => {}; }
    Promise.all([getEnterprise(selectedId), listEnterpriseHistory(selectedId)])
      .then(([enterprise, entries]) => { if (!cancelled) { setDetail(enterprise); setHistory(entries || []); } })
      .catch(() => { if (!cancelled) { setDetail(null); setHistory([]); } });
    return () => { cancelled = true; };
  }, [selectedId, enterprises]);

  return (
    <section className={`met-enterprise ${open ? "is-open" : ""}`} aria-label="Student Enterprise">
      <div className="met-enterprise__header">
        <div>
          <h2>Student Enterprise</h2>
          <p role="note">{METAVERSE_ENTERPRISE_CLIENT_META.legalBoundary}</p>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      {loading ? <p role="status">Loading enterprises…</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <MetaverseEnterpriseReviewPanel />

      {(enterprises || []).length > 1 ? (
        <label>
          Your enterprises
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {enterprises.map((enterprise) => <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>{enterprise.name}</option>)}
          </select>
        </label>
      ) : null}

      {!loading && (enterprises || []).length === 0 ? (
        <p>You have no Student Enterprise yet. Propose one below with a canonical team.</p>
      ) : null}

      <EnterpriseFormationForm myTeams={myTeams} onFormed={(created) => { setSelectedId(created.enterpriseId); onRefresh?.(); }} />

      {detail ? (
        <MetaverseEnterpriseProfile
          enterprise={detail}
          history={history}
          canManage
          canReview={Boolean(canReview)}
          onRefresh={async () => {
            await onRefresh?.();
            const [refreshed, entries] = await Promise.all([getEnterprise(selectedId), listEnterpriseHistory(selectedId)]);
            setDetail(refreshed);
            setHistory(entries || []);
          }}
        />
      ) : null}

      {detail?.lifecycleStatus === "ACTIVE" ? <EnterpriseOpportunityPanel opportunities={opportunities} /> : null}
    </section>
  );
}
