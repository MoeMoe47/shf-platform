// src/components/CareerConsultantPanel.jsx
import React from "react";
import AIChat from "./AIChat.jsx"; // was "@/components/AIChat.jsx"
import { useRole } from "../hooks/useRole.js"; // was "@/hooks/useRole.js"
import { track } from "../utils/analytics.js"; // was "@/utils/analytics.js"

/**
 * CareerConsultantPanel
 * - Role-aware system prompt + quick starters
 * - Uses existing <AIChat/>; passes thread + context
 * - Shared notes for parents/coaches/instructors
 * - Accessible + token-based styling
 */
export default function CareerConsultantPanel({
  pathway = {},        // { id, title, cluster, ... }
  studentProfile = {}, // { goals, location, timeLimitWeeks, hasTransportation, ... }
  compact = false,
  roleOverride = null, // optional local override if you don't want to use context role
}) {
  const { role: ctxRole } = useRole() || { role: "student" };
  const userId =
    typeof window !== "undefined" && window.__user?.id ? window.__user.id : "anon";
  const threadId = `career:thread:${pathway?.id || "unknown"}:${userId}`;

  // Local role (lets user toggle audience without changing global context)
  const [role, setRole] = React.useState(
    (roleOverride || ctxRole || "student").toLowerCase()
  );
  React.useEffect(() => {
    setRole((roleOverride || ctxRole || "student").toLowerCase());
  }, [roleOverride, ctxRole]);

  // Role-aware system prompt & starters
  const systemPrompt = React.useMemo(() => makeSystemPrompt(role, pathway), [role, pathway]);
  const starters = React.useMemo(() => makeStarters(role, pathway), [role, pathway]);

  React.useEffect(() => {
    try {
      track("career_consult_opened", { role, pathwayId: pathway?.id }, { silent: true });
    } catch {}
  }, [role, pathway?.id]);

  return (
    <section className="card card--pad" aria-label="Career Consultant" style={{ paddingBottom: 10 }}>
      <header
        className="sh-row"
        style={{ justifyContent: "space-between", alignItems: "baseline", gap: 8 }}
      >
        <div>
          <div className="subtle" style={{ margin: 0 }}>AI Career Consultant</div>
          <h3 className="h3" style={{ margin: 0 }}>{pathway?.title || "Explore pathways"}</h3>
          {pathway?.cluster ? <div className="subtle">{pathway.cluster}</div> : null}
        </div>

        {/* Local role picker (doesn't require global context setter) */}
        {!compact && (
          <RolePicker role={role} onChange={setRole} />
        )}
      </header>

      {/* AIChat (you already have this component) */}
      <div style={{ marginTop: 10 }}>
        <AIChat
          mode="career"
          systemPrompt={systemPrompt}
          starterPrompts={starters}
          threadId={threadId}
          context={{ role, userId, pathway, studentProfile }}
          onMessage={(msg) => {
            try {
              track(
                "career_consult_message",
                { role, pathwayId: pathway?.id, len: (msg?.text || "").length },
                { silent: true }
              );
            } catch {}
          }}
        />
      </div>

      {/* Shared notes feed (parents • coaches • instructors) */}
      {!compact && <SharedCoachingNotes pathwayId={pathway?.id} />}
    </section>
  );
}

/* ---------------- role picker ---------------- */

function RolePicker({ role, onChange }) {
  const roles = ["student", "parent", "coach", "instructor", "admin"];
  return (
    <div className="sh-actionsRow" role="group" aria-label="Choose audience">
      {roles.map((r) => (
        <button
          key={r}
          type="button"
          className={`sh-btn sh-btn--tiny ${role === r ? "sh-btn--primary" : "sh-btn--secondary"}`}
          onClick={() => onChange(r)}
          aria-pressed={role === r ? "true" : "false"}
          title={`View guidance for ${r}`}
        >
          {cap(r)}
        </button>
      ))}
    </div>
  );
}

/* ---------------- prompt builders ---------------- */

function makeSystemPrompt(role, pathway) {
  const base = `
You are Silicon Heartland's AI Career Consultant.

Goals:
- Recommend stackable, fundable steps to a good job.
- Map lessons → credentials → apprenticeships → employment.
- Be concrete, plain-language, action-oriented, and outcomes-first.

Safety & accuracy:
- If unsure about funding eligibility or local programs, state what info is needed (state, district, employer).
- Suggest next steps with directions to verified sources (ETPL, Apprenticeship.gov, state programs).
- Do not invent statistics or guarantees.
`.trim();

  const roleLine = {
    admin: "Audience: Admin evaluating program quality and fundability.",
    instructor: "Audience: Instructor planning instruction and interventions.",
    coach: "Audience: Career coach guiding a learner toward placement.",
    parent: "Audience: Parent/guardian supporting a learner at home.",
    student: "Audience: Student exploring fast, fundable routes.",
  }[String(role || "student").toLowerCase()] || "Audience: Student.";

  const pathwayLine = pathway?.title
    ? `Focus pathway: ${pathway.title} (${pathway.cluster || "career cluster"}).`
    : `Focus pathway: Identify a good first credential in 12–24 weeks.`;

  return [base, roleLine, pathwayLine].join("\n\n");
}

function makeStarters(role, pathway) {
  const p = pathway?.title || "this pathway";
  const common = [
    `Show me a 12–24 week stack to a first job from ${p}.`,
    "What funding could cover tuition (ETPL/WIOA, GI, employer, apprenticeships)?",
    "What’s the first industry credential I should target and the exam code?",
  ];
  const byRole = {
    student: [
      "If I only have 8–10 hours/week, how should I pace this?",
      "What entry roles hire the fastest in my area?",
    ],
    parent: [
      "Give me a parent-friendly script to motivate my learner today.",
      "What home projects can help reinforce this week’s skills?",
    ],
    coach: [
      "Draft a weekly coaching plan with milestones and check-ins.",
      "List apprenticeship sponsors to contact and what to say.",
    ],
    instructor: [
      "Differentiate this week’s unit for IEP and ELL learners.",
      "Create a capstone rubric aligned to entry-level job tasks.",
    ],
    admin: [
      "Outline evidence for Perkins V alignment and ETPL readiness.",
      "What KPIs should we track for funders (90-day placement, pass rates, apprenticeships)?",
    ],
  }[String(role || "student").toLowerCase()] || [];
  return [...common, ...byRole];
}

/* ---------------- shared notes ---------------- */

function SharedCoachingNotes({ pathwayId }) {
  const key = `career:notes:${pathwayId || "unknown"}`;
  const { role } = useRole() || { role: "member" };
  const userId =
    typeof window !== "undefined" && window.__user?.id ? window.__user.id : "anon";

  const [text, setText] = React.useState("");
  const [notes, setNotes] = React.useState(() => readNotes(key));

  function addNote() {
    const note = {
      id: cryptoRandom(),
      who: userId,
      role,
      ts: Date.now(),
      text: String(text || "").trim(),
    };
    if (!note.text) return;
    const next = [note, ...notes].slice(0, 200);
    setNotes(next);
    writeNotes(key, next);
    setText("");
    try {
      track("career_consult_note_added", { pathwayId, role }, { silent: true });
    } catch {}
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div className="subtle" style={{ marginBottom: 6 }}>
        Shared Notes <span aria-hidden>•</span> <span className="subtle">parents • coaches • instructors</span>
      </div>

      <div className="sh-row" style={{ gap: 8 }}>
        <label htmlFor="note-input" className="sh-srOnly">Add a note</label>
        <input
          id="note-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? addNote() : null)}
          placeholder="Add a note for the team…"
          className="sh-inputText"
          style={{ flex: 1 }}
        />
        <button type="button" className="sh-btn sh-btn--secondary" onClick={addNote}>
          Save
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="subtle" style={{ marginTop: 8 }}>No notes yet.</div>
      ) : (
        <ul
          aria-live="polite"
          className="sh-listPlain"
          style={{ marginTop: 8, display: "grid", gap: 8 }}
        >
          {notes.map((n) => (
            <li key={n.id} className="sh-metaBox">
              <div className="sh-row" style={{ justifyContent: "space-between" }}>
                <strong style={{ color: "var(--ink)" }}>{cap(n.role || "member")}</strong>
                <span className="subtle">{new Date(n.ts).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{n.text}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- small utils ---------------- */

function readNotes(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function writeNotes(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}
function cryptoRandom() {
  try {
    return crypto.randomUUID();
  } catch {
    return "n_" + Math.random().toString(36).slice(2, 10);
  }
}
const cap = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());
