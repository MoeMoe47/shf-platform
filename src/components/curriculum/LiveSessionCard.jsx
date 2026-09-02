// src/components/curriculum/LiveSessionCard.jsx
//
// SHF Curriculum Phase 5.5 — one shared row renderer for a real live
// session (StudentFacingLiveSession shape from /live-learning/sessions),
// reused by both the global Live Sessions page and each Course
// Workspace's Live tab. Join authorization is always server-decided (see
// requestJoin in src/lib/liveLearning/api.js) — this component never
// grants access itself.
//
// Note: the backend's student-facing session shape carries instructorId
// only, no display name — so this renders a generic "Instructor" label
// rather than fabricating one, an intentional, disclosed simplification
// versus the mock's named/avatar instructor.
import React from "react";
import { requestJoin } from "@/lib/liveLearning/api.js";
import { VideoIcon, PersonCircleIcon, ChevronRightIcon } from "@/components/curriculum/icons.jsx";

const STATUS_LABEL = { draft: "Draft", scheduled: "Scheduled", open: "Open", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled", expired: "Expired" };

export default function LiveSessionCard({ session, role, courseTitle, compact = false }) {
  const [result, setResult] = React.useState(null);
  const [pending, setPending] = React.useState(false);
  const joinable = session.status === "open" || session.status === "scheduled" || session.status === "in_progress";

  async function handleJoin() {
    setPending(true);
    setResult(null);
    try {
      setResult(await requestJoin(role, session.id));
    } catch (err) {
      setResult({ allowed: false, reason: err.message });
    } finally {
      setPending(false);
    }
  }

  const Tag = compact ? "div" : "li";
  return (
    <Tag className={`ld-sessionRow${compact ? " is-compact" : ""}`}>
      <span className="ld-sessionThumb" aria-hidden="true"><VideoIcon size={20} /></span>
      <div className="ld-workMain">
        <div className="ld-workTitle">{session.title}</div>
        <div className="ld-workBreadcrumb">
          {courseTitle && <>{courseTitle} · </>}
          {new Date(session.startsAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </div>
        {result && (
          <p className="ld-mutedLine" style={{ marginTop: 6 }}>
            {result.allowed ? (
              session.provider === "mock" ? (
                <a href={result.launchUrl} target="_blank" rel="noopener noreferrer">Open session (test only)</a>
              ) : (
                "Authorized — real provider launch not enabled in this environment."
              )
            ) : (
              `Not authorized: ${result.reason}`
            )}
          </p>
        )}
      </div>
      <span className="ld-statusPill is-later">{STATUS_LABEL[session.status] || session.status}</span>
      {joinable ? (
        <button type="button" className="ld-btn ld-btnPrimary" style={{ padding: "8px 16px", minHeight: 36 }} onClick={handleJoin} disabled={pending}>
          {pending ? "Requesting…" : "Join Session"}
        </button>
      ) : (
        <span className="ld-workCell"><PersonCircleIcon size={16} /> Instructor</span>
      )}
      {compact && <ChevronRightIcon size={16} className="ld-rowChevron" />}
    </Tag>
  );
}
