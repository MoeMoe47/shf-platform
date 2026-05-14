// src/components/civic/MissionLogButtons.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";
import { useRewards } from "@/hooks/useRewards.js";

const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";
const IDENTITY_KEY = "shf.studentIdentity.v1";

const BADGE_ID = "grant-story-contributor";
const BADGE_THRESHOLD_MINUTES = 60;

// Utility helpers
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new StorageEvent("storage", { key, newValue: JSON.stringify(value) })
    );
  } catch {
    // ignore
  }
}

function uid(prefix = "civ") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  );
}

// Default funding streams by mission id (fallbacks)
const DEFAULT_FUNDING_BY_MISSION = {
  "debt-clock-mission": ["essa", "civics"],
  "civic-proposals-mission": ["essa", "civics"],
  "treasury-sim-mission": ["essa", "civics"],
  "elections-mission": ["essa", "civics"],
};

function getEffectiveFundingStreams(missionId, explicitStreams) {
  if (Array.isArray(explicitStreams) && explicitStreams.length > 0) {
    return explicitStreams;
  }
  const fallback = DEFAULT_FUNDING_BY_MISSION[missionId];
  if (fallback) return fallback;
  return []; // can still be inferred later from context if needed
}

export default function MissionLogButtons({
  missionId,
  missionTitle,
  chapter,
  defaultDuration = 30,
  defaultSummary = "",
  defaultOutcome = "",
  fundingStreams, // optional — auto-filled if omitted
}) {
  const { toast } = useToasts();
  const rewards =
    typeof useRewards === "function"
      ? useRewards()
      : { addPoints: () => {}, addBadge: () => {}, badges: [] };

  const { addPoints, addBadge, badges = [] } = rewards;

  const [minutes, setMinutes] = React.useState(defaultDuration);
  const [summary, setSummary] = React.useState(defaultSummary);
  const [outcome, setOutcome] = React.useState(defaultOutcome);
  const [saving, setSaving] = React.useState(false);

  const effectiveFundingStreams = getEffectiveFundingStreams(
    missionId,
    fundingStreams
  );

  const handleLog = (mode) => {
    if (saving) return;
    setSaving(true);
    try {
      const allLogs = readJSON(CIVIC_LOG_KEY, []);
      const identity = readJSON(IDENTITY_KEY, {}) || {};

      const duration = Number(minutes || defaultDuration || 0) || 0;
      const now = new Date();

      const entry = {
        id: uid("mission"),
        when: now.toISOString(),
        mission: missionId,
        missionTitle: missionTitle || missionId,
        chapter: chapter || "",
        duration,
        summary: (summary || "").trim(),
        outcome: (outcome || "").trim(),
        category: "Civic mission",
        org: "Silicon Heartland Foundation",
        fundingStreams: effectiveFundingStreams,

        // Identity fields (future-ready for multi-site reporting)
        siteId:
          identity.siteId ||
          identity.site ||
          identity.location ||
          "local-site",
        programCode:
          identity.programCode ||
          identity.program ||
          identity.pathway ||
          "general",
        identity,
        mode, // "log+close" | "log+keep"
      };

      const next = [entry, ...allLogs];
      saveJSON(CIVIC_LOG_KEY, next);

      // Tiny reward + log
      try {
        addPoints(3);
      } catch {
        // ignore
      }

      // Recompute civic minutes for badge unlock
      const totalMinutes = next.reduce(
        (sum, item) => sum + Number(item.duration || 0),
        0
      );

      const hasBadge = (badges || []).includes(BADGE_ID);
      if (!hasBadge && totalMinutes >= BADGE_THRESHOLD_MINUTES) {
        try {
          addBadge(BADGE_ID);
          toast("🌱 Grant Story Contributor badge unlocked!", {
            type: "success",
          });
        } catch {
          // ignore
        }
      } else {
        toast("✅ Mission logged to Grant Story.", { type: "success" });
      }

      if (mode === "log+close") {
        // reset fields after log+close
        setMinutes(defaultDuration);
        setSummary(defaultSummary);
        setOutcome(defaultOutcome);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="card card--pad"
      aria-label="Log this mission to Grant Story"
      style={{ display: "grid", gap: 8 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <strong style={{ fontSize: 14 }}>
            Log this mission to Grant Story
          </strong>
          {chapter && (
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Chapter: <strong>{chapter}</strong>
            </div>
          )}
        </div>
        {effectiveFundingStreams.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <span style={{ fontSize: 11, opacity: 0.7 }}>Funding:</span>
            {effectiveFundingStreams.map((fs) => (
              <span
                key={fs}
                className="sh-badge is-ghost"
                style={{ fontSize: 10 }}
              >
                {fs.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gap: 6,
          gridTemplateColumns: "minmax(80px,120px) 1fr",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, opacity: 0.8 }}>Minutes</span>
          <input
            type="number"
            min={5}
            max={240}
            className="sh-input"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>

        <div style={{ display: "grid", gap: 4 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11, opacity: 0.8 }}>What did you do?</span>
            <input
              className="sh-input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g., Compared debt scenarios and drafted a proposal."
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11, opacity: 0.8 }}>
              What was the outcome?
            </span>
            <textarea
              className="sh-input"
              rows={2}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g., Selected a policy option and justified it in writing."
            />
          </label>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >
        <button
          type="button"
          className="sh-btn is-ghost"
          disabled={saving}
          onClick={() => handleLog("log+keep")}
        >
          {saving ? "Logging…" : "Log & keep open"}
        </button>
        <button
          type="button"
          className="sh-btn"
          disabled={saving}
          onClick={() => handleLog("log+close")}
        >
          {saving ? "Logging…" : "Log mission"}
        </button>
      </div>

      <p style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
        Logged missions flow into the <strong>Civic Grant Story</strong> and{" "}
        <strong>Master Grant Narrative</strong> for Perkins, WIOA, ESSA,
        Medicaid, and philanthropy reports.
      </p>
    </section>
  );
}
