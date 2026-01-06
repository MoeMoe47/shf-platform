// src/pages /sales/Proposals.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import { useRewards } from "@/hooks/useRewards.js";
import { readJSON, saveJSON, logWallet } from "@/shared/rewards/history.js";
import { StorageSoftReset, useStorageGuard, bumpKPI } from "@/shared/storage/guard.jsx";
import { award } from "@/shared/rewards/shim.js";

/* ---------------- Thresholds ---------------- */
const PASS_THRESHOLD   = 5;
const REJECT_THRESHOLD = -5;

/* ---------------- Storage Keys ---------------- */
const KEY_PROPOSALS = "civic:proposals";     // JSON[ {id,title,rationale,impact,score,status,statusAt,authorId,createdAt} ]
const KEY_PVOTES    = "civic:proposalVotes"; // JSON{ [proposalId]: -1|0|1 }
const KPI_SUBMIT    = "civic:kpi:proposalsSubmitted";
const KPI_VOTES     = "civic:kpi:proposalVotes";
const KPI_PASSED    = "civic:kpi:proposalsPassed";
const KPI_REJECTED  = "civic:kpi:proposalsRejected";
const FLAG_FIRST_SUBMIT = "civic:flag:firstProposalSubmitted";
const FLAG_FIRST_VOTE   = "civic:flag:firstProposalVoted";

/* ---------------- Utils ---------------- */
function uid() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function computeStatus(score) {
  if (score >= PASS_THRESHOLD) return "passed";
  if (score <= REJECT_THRESHOLD) return "rejected";
  return "open";
}
function transitioned(oldStatus, newStatus) {
  return oldStatus !== newStatus && (newStatus === "passed" || newStatus === "rejected");
}

/* ---------------- UI Bits ---------------- */
function TextRow({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, opacity: 0.8 }}>{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ status }) {
  const map = {
    open:     { emoji: "🟡", bg: "#fff7ed", br: "#fed7aa", label: "Open" },
    passed:   { emoji: "🟢", bg: "#ecfdf5", br: "#a7f3d0", label: "Passed" },
    rejected: { emoji: "🔴", bg: "#fef2f2", br: "#fecaca", label: "Rejected" },
  };
  const s = map[status] || map.open;
  return (
    <span
      className="sh-badge"
      style={{ background: s.bg, borderColor: s.br }}
      title={`Status: ${s.label}`}
    >
      {s.emoji} {s.label}
    </span>
  );
}

function ProposalCard({ p, myVote, onVote, canDelete, onDelete }) {
  const score = Number(p.score || 0);
  const votedUp = myVote === 1;
  const votedDn = myVote === -1;

  return (
    <article className="card card--pad" style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <strong style={{ fontSize: 16 }}>{p.title}</strong>
        <StatusPill status={p.status || "open"} />
        <span className="sh-badge is-ghost">{new Date(p.createdAt).toLocaleString()}</span>
        <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          Score: <strong>{score >= 0 ? `+${score}` : score}</strong>
        </span>
      </div>

      {p.rationale && (
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{p.rationale}</div>
      )}

      {p.impact && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="sh-badge">Budget Impact</span>
          <span style={{ opacity: 0.85 }}>{p.impact}</span>
        </div>
      )}

      {p.statusAt && p.status !== "open" && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {p.status === "passed" ? "Passed" : "Rejected"} on{" "}
          {new Date(p.statusAt).toLocaleString()}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          type="button"
          className={`sh-btn ${votedUp ? "" : "is-ghost"}`}
          onClick={() => onVote(p.id, +1)}
          aria-pressed={votedUp}
          title="Upvote"
          disabled={p.status !== "open"}
        >
          👍 Upvote
        </button>
        <button
          type="button"
          className={`sh-btn ${votedDn ? "" : "is-ghost"}`}
          onClick={() => onVote(p.id, -1)}
          aria-pressed={votedDn}
          title="Downvote"
          disabled={p.status !== "open"}
        >
          👎 Downvote
        </button>

        {canDelete && (
          <button
            type="button"
            className="sh-btn is-ghost"
            style={{ marginLeft: "auto" }}
            onClick={() => onDelete(p.id)}
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </article>
  );
}

/* ---------------- Page ---------------- */
export default function Proposals() {
  const { toast } = useToasts();
  const rewards = typeof useRewards === "function" ? useRewards() : null;
  const addPoints = rewards?.addPoints || (() => {});
  const addBadge  = rewards?.addBadge  || (() => {});
  const badges    = rewards?.badges    || [];

  // Guard the storage keys this page relies on (with toast feedback)
  useStorageGuard([KEY_PROPOSALS, KEY_PVOTES], { toast });

  const [list, setList] = React.useState(() =>
    seedIfEmpty(readJSON(KEY_PROPOSALS, []))
  );
  const [myVotes, setMyVotes] = React.useState(() => readJSON(KEY_PVOTES, {}));

  // form state
  const [title, setTitle] = React.useState("");
  const [rationale, setRationale] = React.useState("");
  const [impact, setImpact] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const canSubmit = title.trim().length >= 4 && rationale.trim().length >= 10;

  // UNDO buffer (vote removal + proposal delete)
  const undoRef = React.useRef(null); // { type:"voteUndo"|"deleteProposal", payload|proposal, timerId }

  // cross-tab sync
  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || e.key == null) {
        setList(readJSON(KEY_PROPOSALS, []));
        setMyVotes(readJSON(KEY_PVOTES, {}));
        return;
      }
      if (e.key === KEY_PROPOSALS) setList(readJSON(KEY_PROPOSALS, []));
      if (e.key === KEY_PVOTES) setMyVotes(readJSON(KEY_PVOTES, {}));
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => {
      setList(readJSON(KEY_PROPOSALS, []));
      setMyVotes(readJSON(KEY_PVOTES, {}));
    }, 1200);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
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
      setTitle("");
      setRationale("");
      setImpact("");

      // Rewards + badges + KPI + wallet log
      try { addPoints(20); } catch {}
      if (!localStorage.getItem(FLAG_FIRST_SUBMIT) && !badges.includes("policy-author")) {
        try {
          addBadge("policy-author");
          localStorage.setItem(FLAG_FIRST_SUBMIT, "1");
        } catch {}
      }
      bumpKPI(KPI_SUBMIT, +1);
      logWallet({ note: `Proposal submitted: ${item.title}`, delta: +20 }); // capped to last 250

      toast("✅ Proposal created! +20 pts", { type: "success" });
    } finally {
      setSaving(false);
    }
  };

  const onVote = (id, dir) => {
    // dir: +1 or -1; click again toggles back to 0 (remove vote)
    const votes = readJSON(KEY_PVOTES, {});
    const prev = Number(votes[id] || 0);
    const nextVote = prev === dir ? 0 : dir;

    // Update proposal tally + status
    const arr = readJSON(KEY_PROPOSALS, []);
    const idx = arr.findIndex((p) => p.id === id);
    if (idx >= 0) {
      const p = { ...arr[idx] };
      const prevScore = Number(p.score || 0);
      const newScore = prevScore - prev + nextVote;

      p.score = newScore;

      const oldStatus = p.status || "open";
      const newStatus = computeStatus(newScore);

      if (transitioned(oldStatus, newStatus)) {
        p.status = newStatus;
        p.statusAt = Date.now();

        if (newStatus === "passed") bumpKPI(KPI_PASSED, +1);
        if (newStatus === "rejected") bumpKPI(KPI_REJECTED, +1);

        // Author bonus when passes (local author)
        if (newStatus === "passed" && p.authorId === "local:user") {
          try { addPoints(15); } catch {}
          awardBadge({
            useRewards,
            id: "policy-passed",
            note: "Proposal reached PASS threshold",
            pointsOnAward: 0,
          });
          logWallet({ note: `Your proposal passed: ${p.title}`, delta: +15 });
        }
      }

      arr[idx] = p;
      saveJSON(KEY_PROPOSALS, arr);
      setList(arr);
    }

    // record my vote
    const out = { ...votes, [id]: nextVote };
    saveJSON(KEY_PVOTES, out);
    setMyVotes(out);

    // first-ever vote reward
    if (!localStorage.getItem(FLAG_FIRST_VOTE)) {
      try { addPoints(2); } catch {}
      awardBadge({
        useRewards,
        id: "policy-voter",
        note: "Voted on a proposal",
        pointsOnAward: 0,
      });
      try { localStorage.setItem(FLAG_FIRST_VOTE, "1"); } catch {}
      logWallet({ note: "First proposal vote", delta: +2 });
    }

    bumpKPI(KPI_VOTES, +1);

    // wallet logs per action
    if (nextVote === +1) logWallet({ note: "Proposal upvoted", delta: +1 });
    if (nextVote === -1) logWallet({ note: "Proposal downvoted", delta: +1 });

    // If user removed their vote → offer UNDO (7s)
    if (nextVote === 0) {
      if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
      const timerId = setTimeout(() => {
        undoRef.current = null;
      }, 7000);
      undoRef.current = { type: "voteUndo", payload: { id, prev }, timerId };

      toast("Vote removed.", {
        type: "info",
        duration: 7000,
        action: {
          label: "Undo",
          onClick: () => {
            const u = undoRef.current;
            if (u?.type === "voteUndo" && u.payload?.id === id) {
              // restore previous vote → update proposal score + status
              const curVotes = readJSON(KEY_PVOTES, {});
              const curList = readJSON(KEY_PROPOSALS, []);
              const i = curList.findIndex((pp) => pp.id === id);
              if (i >= 0) {
                const pp = { ...curList[i] };
                const currentMy = Number(curVotes[id] || 0); // should be 0 now
                const restoredScore =
                  Number(pp.score || 0) - currentMy + u.payload.prev;
                pp.score = restoredScore;

                const old = pp.status || "open";
                const nw = computeStatus(restoredScore);
                if (transitioned(old, nw)) {
                  pp.status = nw;
                  pp.statusAt = Date.now();
                }

                curList[i] = pp;
                saveJSON(KEY_PROPOSALS, curList);
                setList(curList);
              }

              const restoredVotes = { ...curVotes, [id]: u.payload.prev };
              saveJSON(KEY_PVOTES, restoredVotes);
              setMyVotes(restoredVotes);

              logWallet({ note: "Vote undo", delta: 0 });
              clearTimeout(u.timerId);
              undoRef.current = null;
            }
          },
        },
      });
    }
  };

  // Author delete with UNDO (7s)
  const onDeleteProposal = (id) => {
    const arr = readJSON(KEY_PROPOSALS, []);
    const p = arr.find((x) => x.id === id);
    if (!p) return;

    const next = arr.filter((x) => x.id !== id);
    saveJSON(KEY_PROPOSALS, next);
    setList(next);

    if (undoRef.current?.timerId) clearTimeout(undoRef.current.timerId);
    const timerId = setTimeout(() => {
      undoRef.current = null;
    }, 7000);
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
            logWallet({ note: "Restored deleted proposal", delta: 0 });
            clearTimeout(undoRef.current.timerId);
            undoRef.current = null;
          }
        },
      },
    });
  };

  // sort by status → score → newest
  const rows = list.slice().sort((a, b) => {
    const order = (s) => (s === "passed" ? 0 : s === "open" ? 1 : 2);
    const so = order(a.status) - order(b.status);
    if (so !== 0) return so;
    const sd = Number(b.score || 0) - Number(a.score || 0);
    if (sd !== 0) return sd;
    return Number(b.createdAt) - Number(a.createdAt);
  });

  return (
    <section className="crb-main" aria-labelledby="pr-title">
      <header className="db-head">
        <div>
          <h1 id="pr-title" className="db-title">Proposals</h1>
          <p className="db-subtitle">
            Draft, debate, and vote on policy proposals (local demo).
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StorageSoftReset
            keys={[KEY_PROPOSALS, KEY_PVOTES]}
            label="Fix storage"
            onDone={() => toast("Storage reset for proposals.", { type: "info" })}
          />
        </div>
      </header>

      <div className="db-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* New Proposal */}
        <form className="card card--pad" onSubmit={submit} aria-label="Submit a Proposal">
          <strong style={{ fontSize: 16 }}>Submit a Proposal</strong>
          <p style={{ marginTop: 4, opacity: 0.8 }}>
            Describe your policy and expected fiscal impact.
          </p>

          <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
            <TextRow label="Title">
              <input
                className="sh-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short, descriptive title"
                required
              />
            </TextRow>
            <TextRow label="Rationale">
              <textarea
                className="sh-input"
                rows={5}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="What problem does this solve? Why now?"
                required
              />
            </TextRow>
            <TextRow label="Budget Impact (optional)">
              <input
                className="sh-input"
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="e.g., Reallocate $250k from Program A to Program B"
              />
            </TextRow>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="sh-btn" disabled={!canSubmit || saving}>
              {saving ? "Submitting…" : "Create Proposal"}
            </button>
            {!canSubmit && (
              <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
                Title ≥ 4 chars &amp; Rationale ≥ 10 chars.
              </span>
            )}
          </div>
        </form>

        {/* List */}
        <section className="card card--pad" aria-label="Proposal List">
          <strong style={{ fontSize: 16 }}>Active Proposals</strong>
          {rows.length === 0 ? (
            <div
              style={{
                marginTop: 8,
                padding: "12px 10px",
                border: "1px dashed var(--ring,#e5e7eb)",
                borderRadius: 10,
                background: "#fafafa",
              }}
            >
              No proposals yet — be the first to submit one.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {rows.map((p) => (
                <ProposalCard
                  key={p.id}
                  p={p}
                  myVote={Number(myVotes[p.id] || 0)}
                  onVote={onVote}
                  canDelete={p.authorId === "local:user"}
                  onDelete={onDeleteProposal}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Thresholds: <code>pass ≥ +{PASS_THRESHOLD}</code>,{" "}
        <code>reject ≤ {REJECT_THRESHOLD}</code>.
      </div>
    </section>
  );
}

/* Seed examples on first run (only if storage empty) */
function seedIfEmpty(arr) {
  if (Array.isArray(arr) && arr.length) return arr;
  const seeded = [
    {
      id: uid(),
      title: "After-School Tech Labs",
      rationale:
        "Create community labs with mentors for 6–12 graders to learn coding, media, and robotics.",
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
      rationale:
        "Publish monthly spending to an open ledger for transparency and civic education.",
      impact:
        "Staff time to export data; minimal software costs using open-source tools.",
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
