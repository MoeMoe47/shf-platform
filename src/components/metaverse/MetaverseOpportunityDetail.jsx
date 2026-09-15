import React, { useEffect, useState } from "react";
import MetaverseBidForm from "./MetaverseBidForm.jsx";
import MetaverseBidStatus from "./MetaverseBidStatus.jsx";
import { getMyBid, listMyAwards, submitBid, withdrawBid } from "@/system/metaverse/metaverseOpportunityClient.js";

// MET-8 §18 — this experience is always labeled an educational opportunity,
// never employment, licensure, a credential, or verified skill; those facts
// only ever come from their own canonical authority (credentials,
// verified-evidence, a future employment workflow), never from this panel.
export default function MetaverseOpportunityDetail({ opportunity, onClose }) {
  const [myBid, setMyBid] = useState(null);
  const [myAward, setMyAward] = useState(null);
  const [bidFormOpen, setBidFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyBid(opportunity.opportunityId).then((bid) => {
      if (cancelled) return;
      setMyBid(bid);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [opportunity.opportunityId]);

  useEffect(() => {
    if (myBid?.status !== "ACCEPTED") return;
    let cancelled = false;
    // The award referenced by an accepted bid isn't looked up by bidId —
    // the student's own award list is the real, server-scoped source.
    listMyAwards().then((awards) => {
      if (cancelled) return;
      const match = awards.find((award) => award.bidId === myBid.bidId);
      if (match) setMyAward(match);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [myBid]);

  async function handleSubmitBid(input) {
    setSubmitting(true);
    setError("");
    try {
      const bid = await submitBid(opportunity.opportunityId, input);
      setMyBid(bid);
      setBidFormOpen(false);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(bidId) {
    try {
      const bid = await withdrawBid(bidId);
      setMyBid(bid);
    } catch (withdrawError) {
      setError(withdrawError.message);
    }
  }

  const canBid = opportunity.eligibility.result === "ELIGIBLE" && !myBid;

  return (
    <div className="met-opportunity-detail" role="dialog" aria-label={opportunity.title}>
      <header className="met-opportunity-detail__header">
        <h2>{opportunity.title}</h2>
        <button type="button" onClick={onClose}>Close</button>
      </header>

      <p className="met-opportunity-detail__badge">Educational opportunity — not employment, licensure, or a credential.</p>

      <p>{opportunity.description || opportunity.summary}</p>

      <dl className="met-opportunity-detail__facts">
        <dt>Deliverables</dt>
        <dd>{opportunity.deliverables?.length ? opportunity.deliverables.join(", ") : "None listed"}</dd>
        <dt>Application deadline</dt>
        <dd>{new Date(opportunity.applicationCloseAt).toLocaleString()}</dd>
        <dt>Work due</dt>
        <dd>{new Date(opportunity.deadline).toLocaleDateString()}</dd>
        <dt>Compensation offered</dt>
        <dd>{opportunity.compensationType === "NONE" ? "None" : `${opportunity.compensationAmount ?? "—"} ${opportunity.currencyType || opportunity.compensationType} (an intent, not yet paid)`}</dd>
        <dt>Required skills</dt>
        <dd>{opportunity.requiredSkills?.length ? opportunity.requiredSkills.join(", ") : "None listed"}</dd>
      </dl>

      <div className="met-opportunity-detail__eligibility" role="status">
        <p>Eligibility: {opportunity.eligibility.result.replace(/_/g, " ").toLowerCase()}</p>
        {opportunity.eligibility.reasons.map((reason) => <p key={reason}>{reason}</p>)}
        {opportunity.eligibility.requirementsRemaining.length ? (
          <ul>
            {opportunity.eligibility.requirementsRemaining.map((requirement) => <li key={requirement}>{requirement}</li>)}
          </ul>
        ) : null}
      </div>

      {myBid ? (
        <MetaverseBidStatus bid={myBid} award={myAward} onWithdraw={handleWithdraw} />
      ) : canBid && !bidFormOpen ? (
        <button type="button" onClick={() => setBidFormOpen(true)}>Bid on this opportunity</button>
      ) : null}

      {bidFormOpen ? (
        <MetaverseBidForm
          opportunity={opportunity}
          onSubmit={handleSubmitBid}
          onCancel={() => setBidFormOpen(false)}
          submitting={submitting}
          error={error}
        />
      ) : null}
    </div>
  );
}
