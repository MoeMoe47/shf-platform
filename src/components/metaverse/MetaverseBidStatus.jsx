import React from "react";

const BID_STATUS_LABEL = {
  SUBMITTED: "Submitted — awaiting sponsor review",
  UNDER_REVIEW: "Under review",
  SHORTLISTED: "Shortlisted",
  ACCEPTED: "Accepted — you were awarded this opportunity",
  DECLINED: "Not selected",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

// MET-8 §12/§18/§22 — a bid/award status is always exactly what the
// server recorded (bid-service.ts / award-service.ts); this component
// never implies employment, a credential, or verified skill from an
// ACCEPTED bid or an AWARDED/COMPLETED award.
export default function MetaverseBidStatus({ bid, award, onWithdraw }) {
  if (!bid) return <p className="met-bid-status met-bid-status--none">You have not bid on this opportunity yet.</p>;
  return (
    <div className="met-bid-status" role="status">
      <p className="met-bid-status__label" data-status={bid.status}>
        {BID_STATUS_LABEL[bid.status] || bid.status}
      </p>
      {["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(bid.status) ? (
        <button type="button" onClick={() => onWithdraw(bid.bidId)}>Withdraw bid</button>
      ) : null}
      {bid.status === "ACCEPTED" && award ? (
        <div className="met-bid-status__award">
          <p className="met-bid-status__notice">
            This is a governed educational project experience — not employment, not a credential, and not a verified skill by itself.
          </p>
          <p>Award status: {award.status}</p>
          <p>Due: {new Date(award.dueDate).toLocaleDateString()}</p>
          {award.paymentIntentRef ? <p>Compensation is recorded as an intent only ({award.compensationSnapshot?.type}); Treasury has not executed any payment.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
