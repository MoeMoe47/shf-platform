import React, { useEffect, useState } from "react";
import { getEnterprise, listEnterpriseHistory, listEnterprisesForReview } from "@/system/metaverse/metaverseEnterpriseClient.js";
import MetaverseEnterpriseProfile from "./MetaverseEnterpriseProfile.jsx";

const STATUS_LABEL = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  ACTIVE: "Active",
  PAUSED: "Paused",
  SUSPENDED: "Suspended",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

// Review order: enterprises needing a decision surface first.
const REVIEW_ORDER = ["PENDING_APPROVAL", "ACTIVE", "PAUSED", "SUSPENDED", "DRAFT", "CLOSED", "ARCHIVED"];

/**
 * MET-12 remediation — bounded instructor/admin Student Enterprise review
 * surface. Reuses the existing enterprise backend authority entirely
 * (listEnterprisesForReview / approve / return / pause / suspend / close);
 * it creates no new approval authority.
 *
 * This component decides whether to render itself: it always attempts the
 * reviewer-only listing call, and renders nothing at all if that call is
 * denied. The server's permission check is the only authority — this is
 * not a client-side role guess, and a STUDENT actor gets an empty result
 * from this component exactly because the server rejects the request.
 */
export default function MetaverseEnterpriseReviewPanel() {
  const [authorized, setAuthorized] = useState(null); // null = checking, true/false once known
  const [enterprises, setEnterprises] = useState([]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);

  const refreshList = async () => {
    try {
      const items = await listEnterprisesForReview();
      setAuthorized(true);
      setError("");
      setEnterprises((items || []).slice().sort((a, b) => REVIEW_ORDER.indexOf(a.lifecycleStatus) - REVIEW_ORDER.indexOf(b.lifecycleStatus)));
    } catch (err) {
      // 401/403 means this actor has no reviewer authority — hide the
      // surface entirely rather than show a denied/broken panel.
      if (err?.status === 401 || err?.status === 403) { setAuthorized(false); return; }
      setAuthorized(true);
      setError(err?.message || "Review queue is temporarily unavailable.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    refreshList().then(() => {}).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!enterprises.length) { setSelectedId(""); return () => {}; }
    if (!enterprises.some((enterprise) => enterprise.enterpriseId === selectedId)) setSelectedId(enterprises[0].enterpriseId);
    return () => { cancelled = true; };
  }, [enterprises, selectedId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedId) { setDetail(null); setHistory([]); return () => {}; }
    Promise.all([getEnterprise(selectedId), listEnterpriseHistory(selectedId)])
      .then(([enterprise, entries]) => { if (!cancelled) { setDetail(enterprise); setHistory(entries || []); } })
      .catch(() => { if (!cancelled) { setDetail(null); setHistory([]); } });
    return () => { cancelled = true; };
  }, [selectedId]);

  if (authorized !== true) return null;

  return (
    <section className="met-enterprise__review" aria-label="Student Enterprise review queue">
      <h3>Review queue</h3>
      <p className="met-enterprise__boundary" role="note">
        Approval confirms this Student Enterprise is a governed educational/simulated activity. It is not legal-business, tax, or licensing verification.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {enterprises.length === 0 ? <p>No enterprises in this organization yet.</p> : null}
      <ul className="met-enterprise__review-list">
        {enterprises.map((enterprise) => (
          <li key={enterprise.enterpriseId}>
            <button
              type="button"
              className={enterprise.enterpriseId === selectedId ? "is-selected" : ""}
              aria-current={enterprise.enterpriseId === selectedId}
              onClick={() => setSelectedId(enterprise.enterpriseId)}
            >
              <strong>{enterprise.name}</strong>
              <span className="met-enterprise__status">{STATUS_LABEL[enterprise.lifecycleStatus] || enterprise.lifecycleStatus}</span>
              <span className="met-enterprise__meta">
                {enterprise.enterpriseCategory.replace(/_/g, " ").toLowerCase()} · {enterprise.operatingMode.toLowerCase()} · team {enterprise.studioTeamId}
                {enterprise.programId ? ` · program ${enterprise.programId}` : ""} · {enterprise.visibility.toLowerCase()} visibility
              </span>
            </button>
          </li>
        ))}
      </ul>

      {detail ? (
        <MetaverseEnterpriseProfile
          enterprise={detail}
          history={history}
          canManage
          canReview
          onRefresh={async () => {
            await refreshList();
            const [refreshed, entries] = await Promise.all([getEnterprise(selectedId), listEnterpriseHistory(selectedId)]);
            setDetail(refreshed);
            setHistory(entries || []);
          }}
        />
      ) : null}
    </section>
  );
}
