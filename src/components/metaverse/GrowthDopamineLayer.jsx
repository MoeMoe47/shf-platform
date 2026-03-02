import React, { useEffect, useMemo, useState } from "react";
import { armSfx, sfxClick, sfxSuccess, sfxAlert, sfxHover } from "@/shared/sfx/sfx.js";
import SfxToggle from "@/components/ui/SfxToggle.jsx";
import { addXP, getDopamine, initDopamine, markEvent } from "@/shared/dopamine/growthDopamine.js";

function fmtAgo(ts) {
  if (!ts) return "—";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// tiny confetti (no deps)
function burstConfetti() {
  const root = document.createElement("div");
  root.className = "got-confetti-root";
  document.body.appendChild(root);

  const n = 18;
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span");
    p.className = "got-confetti";
    p.style.left = `${50 + (Math.random() * 16 - 8)}vw`;
    p.style.top = `${14 + (Math.random() * 8)}vh`;
    p.style.transform = `rotate(${Math.random() * 180}deg)`;
    p.style.animationDelay = `${Math.random() * 80}ms`;
    root.appendChild(p);
  }

  setTimeout(() => root.remove(), 1200);
}

export default function GrowthDopamineLayer({ onSimulate }) {
  const [state, setState] = useState(() => initDopamine());
  const progress = useMemo(() => {
    const xp = state?.xp || 0;
    const mod = xp % 250;
    return Math.round((mod / 250) * 100);
  }, [state]);

  // Toast queue
  const [toast, setToast] = useState(null);
  const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(null), 1600);
  };

  useEffect(() => {
    setState(getDopamine());
  }, []);

  const fire = async (kind) => {
    await armSfx();
    sfxClick();
    // Simulated dopamine events; later wire this to real Watchtower events.
    if (kind === "signal") {
      setState(addXP(35));
      setState(markEvent("signal"));
      sfxAlert();
      showToast({ title: "NEW SIGNAL", body: "A growth signal was detected." });
      burstConfetti();
      onSimulate?.("signal");
      return;
    }
    if (kind === "attestation") {
      setState(addXP(50));
      setState(markEvent("attestation"));
      sfxSuccess();
      showToast({ title: "ATTESTED", body: "Watchtower truth checkpoint recorded." });
      burstConfetti();
      onSimulate?.("attestation");
      return;
    }
    if (kind === "export") {
      setState(addXP(75));
      setState(markEvent("export"));
      sfxSuccess();
      showToast({ title: "EXPORT READY", body: "Immutable JSONL export prepared." });
      burstConfetti();
      onSimulate?.("export");
      return;
    }
  };

  return (
    <div className="got-dopamine">
      <div className="got-dopa-bar">
        <div className="got-dopa-left">
          <div className="got-pill">
            <span className="got-pill-k">Level</span>
            <span className="got-pill-v">{state.level}</span>
          </div>
          <div className="got-pill">
            <span className="got-pill-k">XP</span>
            <span className="got-pill-v">{state.xp}</span>
          </div>
          <div className="got-pill">
            <span className="got-pill-k">Streak</span>
            <span className="got-pill-v">{state.streak}🔥</span>
          </div>
        </div>

        <div className="got-dopa-mid">
          <div className="got-progress">
            <div className="got-progress-label">Next level</div>
            <div className="got-progress-track" aria-label="progress">
              <div className="got-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="got-dopa-right">
          <SfxToggle />
          <button className="btn got-dopa-btn" onMouseEnter={() => sfxHover()} onClick={() => fire("signal")}>
            + Signal
          </button>
          <button className="btn got-dopa-btn" onMouseEnter={() => sfxHover()} onClick={() => fire("attestation")}>
            + Attest
          </button>
          <button className="btn got-dopa-btn" onMouseEnter={() => sfxHover()} onClick={() => fire("export")}>
            + Export
          </button>
        </div>
      </div>

      <div className="got-dopa-meta">
        <div className="got-meta-item">Last signal: <b>{fmtAgo(state.lastSignalAt)}</b></div>
        <div className="got-meta-item">Last attestation: <b>{fmtAgo(state.lastAttestationAt)}</b></div>
        <div className="got-meta-item">Last export: <b>{fmtAgo(state.lastExportAt)}</b></div>
      </div>

      {toast && (
        <div className="got-toast" role="status" aria-live="polite">
          <div className="got-toast-title">{toast.title}</div>
          <div className="got-toast-body">{toast.body}</div>
        </div>
      )}
    </div>
  );
}
