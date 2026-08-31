// src/pages/curriculum/calendar/CalendarFeedSubscribe.jsx
//
// SHF Ecosystem Phase 12 — External Calendar Integration, Step 1: a
// standards-based ICS/webcal subscription link a learner can add to
// Google Calendar, Outlook, or Apple Calendar (every one of them supports
// "subscribe by URL" natively — no per-provider OAuth was built this
// phase; see docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md for why). This is
// a one-way, read-only mirror of the learner's own already-entitled SHF
// Calendar — subscribing never lets an external calendar edit anything
// back into SHF.
import React from "react";
import { getFeedStatus, rotateFeedToken, revokeFeedToken, feedUrlForToken } from "@/lib/calendarFeed/api.js";

export default function CalendarFeedSubscribe({ role }) {
  const [status, setStatus] = React.useState({ loading: true, active: false });
  const [revealedToken, setRevealedToken] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  const refreshStatus = React.useCallback(() => {
    getFeedStatus(role)
      .then((data) => setStatus({ loading: false, active: !!data.active }))
      .catch(() => setStatus({ loading: false, active: false }));
  }, [role]);

  React.useEffect(() => { refreshStatus(); }, [refreshStatus]);

  async function handleGetLink() {
    try {
      const { token } = await rotateFeedToken(role);
      setRevealedToken(token);
      setCopied(false);
      refreshStatus();
    } catch {
      // Fail quietly — this is a convenience feature, not core Calendar
      // functionality; the rest of the page must stay usable regardless.
    }
  }

  async function handleCopy(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function handleRevoke() {
    try {
      await revokeFeedToken(role);
      setRevealedToken(null);
      refreshStatus();
    } catch {
      // same fail-quiet rationale as above
    }
  }

  if (status.loading) return null;

  const url = revealedToken ? feedUrlForToken(revealedToken) : null;

  return (
    <section className="lc-railCard" aria-labelledby="lc-feed-title">
      <div className="lc-railCardHead">
        <h2 id="lc-feed-title" className="lc-railCardTitle">Subscribe to your SHF Calendar</h2>
      </div>
      <p className="lc-railEmpty">
        Add your SHF schedule to Google Calendar, Outlook, or Apple Calendar. This is a one-way,
        read-only feed — nothing you do in an external calendar changes your SHF record.
      </p>
      {url ? (
        <>
          <div className="lc-feedUrlRow">
            <input className="lc-feedUrlInput" type="text" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Private calendar subscription link" />
            <button type="button" className="sh-btn sh-btn--soft" onClick={() => handleCopy(url)}>
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="lc-railEmpty">
            Paste this link into your calendar app&rsquo;s &ldquo;Subscribe by URL&rdquo; / &ldquo;Add calendar from URL&rdquo; option.
            Keep it private — anyone with this link can see your SHF schedule.
          </p>
          <button type="button" className="lc-railViewAll" onClick={handleRevoke}>Revoke this link</button>
        </>
      ) : (
        <button type="button" className="sh-btn sh-btn--soft" onClick={handleGetLink}>
          {status.active ? "Get a new subscription link" : "Get subscription link"}
        </button>
      )}
    </section>
  );
}
