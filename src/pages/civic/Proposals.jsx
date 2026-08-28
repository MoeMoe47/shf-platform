// src/pages/civic/Proposals.jsx
// Redesigned per the approved Proposals mock (light + dark, supplied
// directly during this task). Shell/theme/shared design tokens are
// inherited unchanged from the Civic Lab Dashboard and Elections
// redesigns — see src/styles/civic-dashboard.css and
// src/styles/civic-proposals.css (this page's own additions only).
//
// All create/vote/threshold/delete/mission-log logic below is byte-for-
// byte identical to the pre-redesign page (same storage keys, same
// scoring math, same toggle-vote semantics, same Undo-on-delete pattern);
// only presentation changed, plus one new UI-only progress stepper that
// reads real persisted state and never writes anything new.
//
// Two pieces of copy from the supplied mock were deliberately NOT carried
// over, per this task's own explicit correction: the 4-step labels and the
// history-panel title were Elections' copy, mistakenly reused in the mock
// image generation. Proposals-specific copy is used instead (see Phase 4/
// Phase 11 of the brief). The redundant self-link "View Proposals" (which
// would point to the page already being viewed) was dropped for the same
// reason — no real second destination exists for it here.
//
// EXPERIMENTAL, not promoted: Proposals.lord-demo.jsx (unrouted) adds
// vote-removal Undo and a "Fix storage" reset button on top of this same
// data model. Inspected per this task's instruction; not ported in without
// evidence it belongs in the live page.
import React from "react";
import { Link } from "react-router-dom";
import MissionLogButtons from "@/components/civic/MissionLogButtons.jsx";
import { useToasts } from "@/context/Toasts.jsx";
import { useRewards } from "@/hooks/useRewards.js";
import { useCompanion } from "@/hooks/useCompanion.js";
import { readJSON, saveJSON, logWallet } from "@/shared/rewards/history.js";
import { useStorageGuard, bumpKPI } from "@/shared/storage/guard.js";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import CompanionFace from "@/components/companion/CompanionFace.jsx";

/* ---------------- Thresholds (unchanged) ---------------- */
const PASS_THRESHOLD   = 5;
const REJECT_THRESHOLD = -5;

/* ---------------- Storage Keys (unchanged) ---------------- */
const KEY_PROPOSALS = "civic:proposals";     // JSON[ {id,title,rationale,impact,score,status,statusAt,authorId,createdAt} ]
const KEY_PVOTES    = "civic:proposalVotes"; // JSON{ [proposalId]: -1|0|1 }
const KPI_SUBMIT    = "civic:kpi:proposalsSubmitted";
const KPI_VOTES     = "civic:kpi:proposalVotes";
const KPI_PASSED    = "civic:kpi:proposalsPassed";
const KPI_REJECTED  = "civic:kpi:proposalsRejected";
const FLAG_FIRST_SUBMIT = "civic:flag:firstProposalSubmitted";
const FLAG_FIRST_VOTE   = "civic:flag:firstProposalVoted";
const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";

/* ---------------- Utils (unchanged) ---------------- */
function uid(){ return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function computeStatus(score){ if (score >= PASS_THRESHOLD) return "passed"; if (score <= REJECT_THRESHOLD) return "rejected"; return "open"; }
function transitioned(oldStatus, newStatus){ return oldStatus !== newStatus && (newStatus === "passed" || newStatus === "rejected"); }

const STATUS_META = {
  open:     { label: "Open", cls: "prop-status--open" },
  passed:   { label: "Passed", cls: "prop-status--passed" },
  rejected: { label: "Rejected", cls: "prop-status--rejected" },
};
function StatusPill({ status }) {
  const s = STATUS_META[status] || STATUS_META.open;
  return <span className={`prop-status ${s.cls}`}>{s.label}</span>;
}

/* ---------------- Progress steps (Proposals-specific copy — the
   Elections stepper's "Review Candidates" language does not apply here) ---------------- */
const STEPS = [
  { n: 1, title: "Draft Your Idea", sub: "Define the problem" },
  { n: 2, title: "Build Your Case", sub: "Explain why it matters" },
  { n: 3, title: "Debate & Vote", sub: "Review community proposals" },
  { n: 4, title: "Reflect & Log", sub: "Document what you learned" },
];
function ProgressSteps({ active }) {
  return (
    <nav className="prop-card prop-steps" aria-label="Proposal progress">
      <ol>
        {STEPS.map((s) => (
          <li key={s.n} className={s.n === active ? "is-active" : ""} aria-current={s.n === active ? "step" : undefined}>
            <span className="prop-steps__badge" aria-hidden="true">{s.n}</span>
            <span className="prop-steps__text">
              <span className="prop-steps__title">{s.title}</span>
              <span className="prop-steps__sub">{s.sub}</span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function TextRow({ label, children }) {
  return (
    <label className="prop-field">
      <span className="prop-field__label">{label}</span>
      {children}
    </label>
  );
}

function ProposalCard({ p, myVote, onVote, canDelete, onDelete }) {
  const score = Number(p.score || 0);
  const votedUp = myVote === 1;
  const votedDn = myVote === -1;
  const isOpen = (p.status || "open") === "open";
  return (
    <article className="prop-proposal" aria-label={p.title}>
      <div className="prop-proposal__head">
        <span className="prop-proposal__title">{p.title}</span>
        <StatusPill status={p.status || "open"} />
        <span className="prop-proposal__date">{new Date(p.createdAt).toLocaleString()}</span>
        <span className="prop-proposal__score">Score<br /><strong>{score >= 0 ? `+${score}` : score}</strong></span>
      </div>

      {p.rationale && <p className="prop-proposal__rationale">{p.rationale}</p>}
      {p.impact && (
        <div className="prop-proposal__impact">
          <span className="prop-proposal__impactLabel">Budget Impact</span>
          <span className="prop-proposal__impactValue">{p.impact}</span>
        </div>
      )}
      {p.statusAt && p.status !== "open" && (
        <div className="prop-proposal__decided">
          {p.status === "passed" ? "Passed" : "Rejected"} on {new Date(p.statusAt).toLocaleString()}
        </div>
      )}

      <div className="prop-actions">
        <button
          type="button"
          className="prop-voteBtn prop-voteBtn--up"
          onClick={() => onVote(p.id, +1)}
          aria-pressed={votedUp}
          aria-label={`Upvote ${p.title}`}
          disabled={!isOpen}
        >
          <span aria-hidden="true">👍</span> Upvote
        </button>
        <button
          type="button"
          className="prop-voteBtn prop-voteBtn--down"
          onClick={() => onVote(p.id, -1)}
          aria-pressed={votedDn}
          aria-label={`Downvote ${p.title}`}
          disabled={!isOpen}
        >
          <span aria-hidden="true">👎</span> Downvote
        </button>
        {canDelete && (
          <button type="button" className="prop-deleteBtn" onClick={() => onDelete(p.id)} aria-label={`Delete ${p.title}`}>
            <span aria-hidden="true">🗑️</span> Delete
          </button>
        )}
      </div>
    </article>
  );
}

/* ---------------- Page ---------------- */
export default function Proposals() {
  const { toast } = useToasts();
  const companion = useCompanion();
  const { addPoints, addBadge, badges = [] } =
    (typeof useRewards === "function" ? useRewards() : { addPoints: () => {}, addBadge: () => {}, badges: [] });

  useStorageGuard([KEY_PROPOSALS, KEY_PVOTES]);

  const [list, setList] = React.useState(() => seedIfEmpty(readJSON(KEY_PROPOSALS, [])));
  const [myVotes, setMyVotes] = React.useState(() => readJSON(KEY_PVOTES, {}));
  const [hasLoggedMission, setHasLoggedMission] = React.useState(() =>
    readJSON(CIVIC_LOG_KEY, []).some((l) => l?.mission === "civic-proposals-mission")
  );

  const [title, setTitle] = React.useState("");
  const [rationale, setRationale] = React.useState("");
  const [impact, setImpact] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const canSubmit = title.trim().length >= 4 && rationale.trim().length >= 10;
  const formTouched = title.trim().length > 0 || rationale.trim().length > 0;

  const undoRef = React.useRef(null);

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key == null) {
        setList(readJSON(KEY_PROPOSALS, []));
        setMyVotes(readJSON(KEY_PVOTES, {}));
        setHasLoggedMission(readJSON(CIVIC_LOG_KEY, []).some((l) => l?.mission === "civic-proposals-mission"));
        return;
      }
      if (e.key === KEY_PROPOSALS) setList(readJSON(KEY_PROPOSALS, []));
      if (e.key === KEY_PVOTES)    setMyVotes(readJSON(KEY_PVOTES, {}));
      if (e.key === CIVIC_LOG_KEY) setHasLoggedMission(readJSON(CIVIC_LOG_KEY, []).some((l) => l?.mission === "civic-proposals-mission"));
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => {
      setList(readJSON(KEY_PROPOSALS, []));
      setMyVotes(readJSON(KEY_PVOTES, {}));
      setHasLoggedMission(readJSON(CIVIC_LOG_KEY, []).some((l) => l?.mission === "civic-proposals-mission"));
    }, 1200);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(t); };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const item = {
        id: uid(),
        title: title.trim(),
        rationale: rationale.trim(),
        impact: impact.trim(),
        score: 0,
        status: "open",
        statusAt: null,
        authorId: "local:user", // swap later
        createdAt: Date.now(),
      };
      const next = [item, ...readJSON(KEY_PROPOSALS, [])];
      saveJSON(KEY_PROPOSALS, next);
      setList(next);
      setTitle(""); setRationale(""); setImpact("");

      try { addPoints?.(20); } catch {}
      if (!localStorage.getItem(FLAG_FIRST_SUBMIT) && !badges.includes("policy-author")) {
        try { addBadge?.("policy-author"); localStorage.setItem(FLAG_FIRST_SUBMIT, "1"); } catch {}
      }
      bumpKPI(KPI_SUBMIT, +1);
      logWallet({ note: `Proposal submitted: ${item.title}`, delta: +20 });

      toast("✅ Proposal created! +20 pts", { type: "success" });
    } finally {
      setSaving(false);
    }
  };

  const onVote = (id, dir) => {
    const votes = readJSON(KEY_PVOTES, {});
    const prev = Number(votes[id] || 0);
    const nextVote = prev === dir ? 0 : dir;

    const arr = readJSON(KEY_PROPOSALS, []);
    const idx = arr.findIndex(p => p.id === id);
    if (idx >= 0) {
      const p = { ...arr[idx] };
      const prevScore = Number(p.score || 0);
      const newScore  = prevScore - prev + nextVote;
      p.score = newScore;

      const oldStatus = p.status || "open";
      const newStatus = computeStatus(newScore);

      if (transitioned(oldStatus, newStatus)) {
        p.status = newStatus;
        p.statusAt = Date.now();

        if (newStatus === "passed")  bumpKPI(KPI_PASSED, +1);
        if (newStatus === "rejected") bumpKPI(KPI_REJECTED, +1);

        if (newStatus === "passed" && p.authorId === "local:user") {
          try { addPoints?.(15); } catch {}
          if (!badges.includes("policy-passed")) {
            try { addBadge?.("policy-passed"); } catch {}
          }
          logWallet({ note: `Your proposal passed: ${p.title}`, delta: +15 });
        }
      }

      arr[idx] = p;
      saveJSON(KEY_PROPOSALS, arr);
      setList(arr);
    }

    const out = { ...votes, [id]: nextVote };
    saveJSON(KEY_PVOTES, out);
    setMyVotes(out);

    if (!localStorage.getItem(FLAG_FIRST_VOTE)) {
      try { addPoints?.(2); } catch {}
      if (!badges.includes("policy-voter")) {
        try { addBadge?.("policy-voter"); } catch {}
      }
      try { localStorage.setItem(FLAG_FIRST_VOTE, "1"); } catch {}
      logWallet({ note: "First proposal vote", delta: +2 });
    }
    bumpKPI(KPI_VOTES, +1);
  };

  const onDeleteProposal = (id) => {
    const arr = readJSON(KEY_PROPOSALS, []);
    const p   = arr.find(x => x.id === id);
    if (!p) return;

    const next = arr.filter(x => x.id !== id);
    saveJSON(KEY_PROPOSALS, next);
    setList(next);

    if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
    const timerId = setTimeout(() => { undoRef.current = null; }, 7000);
    undoRef.current = { type: "deleteProposal", proposal: p, timerId };

    toast("Proposal deleted.", {
      type: "info",
      duration: 7000,
      action: {
        label: "Undo",
        onClick: () => {
          if (undoRef.current?.type === "deleteProposal" && undoRef.current.proposal) {
            const restored = [undoRef.current.proposal, ...readJSON(KEY_PROPOSALS, [])];
            saveJSON(KEY_PROPOSALS, restored);
            setList(restored);
            clearTimeout(undoRef.current.timerId);
            undoRef.current = null;
          }
        },
      },
    });
  };

  // sort by status → score → newest (unchanged)
  const rows = list.slice().sort((a, b) => {
    const order = (s) => (s === "passed" ? 0 : s === "open" ? 1 : 2);
    const so = order(a.status) - order(b.status);
    if (so !== 0) return so;
    const sd = Number(b.score || 0) - Number(a.score || 0);
    if (sd !== 0) return sd;
    return Number(b.createdAt) - Number(a.createdAt);
  });

  // "Recent Proposal Activity" — the same real proposals, viewed by pure
  // recency (most recently created or decided) rather than status
  // priority, so it reads as a genuine activity/history lens rather than
  // a duplicate of "Active Proposals". Not a separate, invented data
  // source — every row is a real stored proposal.
  const recentActivity = list.slice()
    .sort((a, b) => Math.max(b.createdAt || 0, b.statusAt || 0) - Math.max(a.createdAt || 0, a.statusAt || 0))
    .slice(0, 6);

  const hasVoted = Object.values(myVotes).some((v) => Number(v) !== 0);
  const step = hasLoggedMission ? 4 : hasVoted ? 3 : canSubmit ? 2 : formTouched ? 2 : 1;

  return (
    <div className="prop-page">
      <h1 className="cv-srOnly">Proposals</h1>

      <header className="prop-header" aria-labelledby="prop-title">
        <div className="prop-header__title">
          <span className="prop-header__icon" aria-hidden="true">📋</span>
          <div>
            <p className="prop-header__h1" id="prop-title">Proposals</p>
            <p className="prop-header__sub">Draft, debate, vote — and manage your submissions.</p>
          </div>
        </div>
        <div className="prop-header__actions">
          <Link className="cv-btn cv-btn--ghost" to="/dashboard-ns">
            <span aria-hidden="true">⭐</span> Northstar Dashboard
          </Link>
          <RewardsChip />
        </div>
      </header>

      <ProgressSteps active={step} />

      <div className="prop-layout">
        <div className="prop-colLeft">
          <form className="prop-card prop-form" onSubmit={submit} aria-label="Submit a Proposal">
            <h2 className="prop-form__title"><span aria-hidden="true">📝</span> Submit a Proposal</h2>
            <p className="prop-form__sub">Describe your policy and expected fiscal impact.</p>

            <TextRow label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, descriptive title" required />
            </TextRow>
            <TextRow label="Rationale">
              <textarea rows={5} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="What problem does this solve? Why now?" required />
            </TextRow>
            <TextRow label="Budget Impact (optional)">
              <input value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="e.g., Reallocate $250k from Program A to Program B" />
            </TextRow>

            <div className="prop-form__row">
              <button type="submit" className="cv-btn elex-btn--primary" disabled={!canSubmit || saving} style={{ marginLeft: 0 }}>
                {saving ? "Submitting…" : "Create Proposal"}
              </button>
              {!canSubmit && (
                <span className="prop-form__hint" role="status">Title ≥ 4 chars &amp; Rationale ≥ 10 chars.</span>
              )}
            </div>
          </form>

          <section className="prop-card prop-thresholds" aria-labelledby="prop-thresholds-title">
            <h2 className="prop-thresholds__title" id="prop-thresholds-title">Decision Thresholds</h2>
            <p className="prop-form__sub" style={{ margin: 0 }}>
              Every vote moves a proposal's score. When enough students agree, the outcome is decided automatically.
            </p>
            <div className="prop-thresholds__row">
              <span className="prop-thresholds__item"><span className="prop-thresholds__dot prop-thresholds__dot--pass" aria-hidden="true" /> +{PASS_THRESHOLD} score passes</span>
              <span className="prop-thresholds__item"><span className="prop-thresholds__dot prop-thresholds__dot--reject" aria-hidden="true" /> {REJECT_THRESHOLD} score is rejected</span>
            </div>
          </section>

          <section className="prop-card prop-activity" aria-label="Recent Proposal Activity">
            <div className="prop-activity__head">
              <h2 className="prop-activity__title"><span aria-hidden="true">🕐</span> Recent Proposal Activity</h2>
            </div>
            {recentActivity.length === 0 ? (
              <p className="prop-activity__empty">No proposal activity yet.</p>
            ) : (
              <ul className="prop-activity__list">
                {recentActivity.map((p) => (
                  <li key={p.id} className="prop-activity__row">
                    <span className="prop-activity__text">
                      <span className="prop-activity__when">{new Date(p.statusAt || p.createdAt).toLocaleString()}</span>
                      <span className="prop-activity__name">{p.title}</span>
                    </span>
                    <StatusPill status={p.status || "open"} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="prop-disclaimer">
            <span aria-hidden="true">🔒</span> This is a practice proposal workshop. No official policy decisions are recorded.
          </p>
        </div>

        <div className="prop-colRight">
          <section className="prop-card prop-list" aria-label="Active Proposals">
            <h2 className="prop-list__title"><span aria-hidden="true">🗳️</span> Active Proposals</h2>
            {rows.length === 0 ? (
              <div className="prop-empty">No active proposals yet. Create the first proposal to start the discussion.</div>
            ) : (
              rows.map((p) => (
                <ProposalCard
                  key={p.id}
                  p={p}
                  myVote={Number(myVotes[p.id] || 0)}
                  onVote={onVote}
                  canDelete={p.authorId === "local:user"}
                  onDelete={onDeleteProposal}
                />
              ))
            )}
          </section>

          <section className="prop-missionLog" aria-label="Mission Log">
            <MissionLogButtons
              missionId="civic-proposals-mission"
              missionTitle="Constitution Proposal Mission"
              chapter="Constitution Lab 1"
              defaultDuration={60}
              defaultSummary=""
              defaultOutcome=""
              icon="📖"
            />
          </section>

          <section className="prop-card prop-coach" aria-labelledby="prop-coach-title">
            <div>
              <h2 className="prop-coach__title" id="prop-coach-title">Need help deciding?</h2>
              <p className="prop-coach__body">
                Ask Coach to help you weigh trade-offs, compare policy options, or explain a budget impact — Coach won't tell you how to vote.
              </p>
              <button type="button" className="cv-btn elex-btn--primary" onClick={() => companion.openCoach()} style={{ marginLeft: 0 }}>
                Ask Coach!
              </button>
            </div>
            <div className="prop-coach__art" aria-hidden="true">
              <CompanionFace animation="wave" size={100} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* Seed examples on first run (only if storage empty) — unchanged */
function seedIfEmpty(arr) {
  if (Array.isArray(arr) && arr.length) return arr;
  const seeded = [
    {
      id: uid(),
      title: "After-School Tech Labs",
      rationale: "Create community labs with mentors for 6–12 graders to learn coding, media, and robotics.",
      impact: "Year 1: $150k grant; volunteer mentors; in-kind equipment.",
      score: 2,
      status: "open",
      statusAt: null,
      authorId: "local:user",
      createdAt: Date.now() - 1000 * 60 * 60 * 6,
    },
    {
      id: uid(),
      title: "Open Ledger for City Spending",
      rationale: "Publish monthly spending to an open ledger for transparency and civic education.",
      impact: "Staff time to export data; minimal software costs using open-source tools.",
      score: 1,
      status: "open",
      statusAt: null,
      authorId: "local:user",
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
    },
  ];
  saveJSON(KEY_PROPOSALS, seeded);
  return seeded;
}
