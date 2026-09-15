import React, { useState } from "react";

// MET-8 §8/§22/§23 — this form never collects or sends a student/team
// identity claim; the server derives the bidder from the authenticated
// session (bid-service.ts submitBid). Team bids only ever reference a
// teamId the server independently verifies real membership for — a
// canonical "my teams" picker is P1 (docs/metaverse/MET-8 §P1); until
// then a team id is entered directly by the student, same as any other
// field the server treats as an unforgeable claim to verify, never trust.
export default function MetaverseBidForm({ opportunity, onSubmit, onCancel, submitting, error }) {
  const allowsTeam = opportunity.participationMode !== "INDIVIDUAL";
  const requiresTeam = opportunity.participationMode === "TEAM";
  const [bidderType, setBidderType] = useState(requiresTeam ? "TEAM" : "INDIVIDUAL");
  const [teamId, setTeamId] = useState("");
  const [proposalSummary, setProposalSummary] = useState("");
  const [approach, setApproach] = useState("");
  const [requestedCompensationAmount, setRequestedCompensationAmount] = useState("");
  const [estimatedCompletionDays, setEstimatedCompletionDays] = useState("");
  const [availability, setAvailability] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      bidderType,
      teamId: bidderType === "TEAM" ? teamId.trim() : undefined,
      proposalSummary,
      approach: approach || undefined,
      requestedCompensationAmount: requestedCompensationAmount ? Number(requestedCompensationAmount) : undefined,
      requestedCompensationType: requestedCompensationAmount ? opportunity.compensationType : undefined,
      estimatedCompletionDays: estimatedCompletionDays ? Number(estimatedCompletionDays) : undefined,
      availability: availability || undefined,
    });
  }

  return (
    <form className="met-bid-form" onSubmit={handleSubmit} aria-label={`Bid on ${opportunity.title}`}>
      <h3>Submit a bid</h3>
      {error ? <p role="alert" className="met-bid-form__error">{error}</p> : null}

      {allowsTeam ? (
        <fieldset>
          <legend>How would you like to bid?</legend>
          <label>
            <input type="radio" name="bidderType" value="INDIVIDUAL" checked={bidderType === "INDIVIDUAL"} disabled={requiresTeam} onChange={() => setBidderType("INDIVIDUAL")} />
            Alone
          </label>
          <label>
            <input type="radio" name="bidderType" value="TEAM" checked={bidderType === "TEAM"} onChange={() => setBidderType("TEAM")} />
            With a team
          </label>
        </fieldset>
      ) : null}

      {bidderType === "TEAM" ? (
        <label className="met-bid-form__field">
          Your team
          <input value={teamId} onChange={(event) => setTeamId(event.target.value)} required aria-describedby="met-bid-team-help" />
          <span id="met-bid-team-help" className="met-sr-only">The server verifies you are an active member of this team before your bid is accepted.</span>
        </label>
      ) : null}

      <label className="met-bid-form__field">
        How would you approach this?
        <textarea value={proposalSummary} onChange={(event) => setProposalSummary(event.target.value)} required minLength={1} maxLength={4000} />
      </label>

      <label className="met-bid-form__field">
        Anything else about your approach? (optional)
        <textarea value={approach} onChange={(event) => setApproach(event.target.value)} maxLength={4000} />
      </label>

      <label className="met-bid-form__field">
        How long do you think it will take? (days, optional)
        <input type="number" min="1" value={estimatedCompletionDays} onChange={(event) => setEstimatedCompletionDays(event.target.value)} />
      </label>

      {opportunity.compensationType !== "NONE" ? (
        <label className="met-bid-form__field">
          Requested compensation (your ask — not a final offer)
          <input type="number" min="0" value={requestedCompensationAmount} onChange={(event) => setRequestedCompensationAmount(event.target.value)} />
        </label>
      ) : null}

      <label className="met-bid-form__field">
        Availability (optional)
        <input value={availability} onChange={(event) => setAvailability(event.target.value)} maxLength={200} />
      </label>

      <div className="met-bid-form__actions">
        <button type="submit" disabled={submitting || !proposalSummary.trim()}>{submitting ? "Submitting…" : "Submit bid"}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
