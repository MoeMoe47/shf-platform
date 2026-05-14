import React from "react";
import "./hub-interaction-layer.css";

const HUB_NAV_SELECTOR = [
  ".hbr-nav button",
  ".hfi-nav button",
  ".hpa-nav button",
  ".hrl-nav button",
  ".hin-nav button",
  ".hld-nav button",
  ".hwd-nav button",
  ".hub-nav button",
  ".hbr-rail nav button",
  ".hfi-rail nav button",
  ".hpa-rail nav button",
  ".hrl-rail nav button",
  ".hin-rail nav button",
  ".hld-rail nav button",
  ".hwd-rail nav button",
  ".hub-rail nav button",
  "aside nav button",
].join(",");

const HUB_CLICK_SELECTOR = [
  HUB_NAV_SELECTOR,
  ".hbr-actions button",
  ".hfi-actions button",
  ".hpa-actions button",
  ".hrl-actions button",
  ".hin-actions button",
  ".hld-actions button",
  ".hwd-actions button",
  ".hub-actions button",
  ".hbr-panel button",
  ".hfi-panel button",
  ".hpa-panel button",
  ".hrl-panel button",
  ".hin-panel button",
  ".hld-panel button",
  ".hwd-panel button",
  ".hub-panel button",
  ".hbr-reportActions button",
  ".hfi-reportActions button",
  ".hpa-card button",
  ".hrl-card button",
].join(",");

function isHubPage() {
  if (typeof window === "undefined") return false;
  return String(window.location.hash || "").includes("/hub");
}

function playHubClick() {
  if (typeof window === "undefined") return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  try {
    const ctx = window.__shsHubAudioContext || new AudioContext();
    window.__shsHubAudioContext = ctx;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.045);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  } catch {
    // Audio should never break the UI.
  }
}

function addPressPulse(target) {
  if (!target) return;
  target.classList.remove("shs-hub-click-pulse");
  void target.offsetWidth;
  target.classList.add("shs-hub-click-pulse");

  window.setTimeout(() => {
    target.classList.remove("shs-hub-click-pulse");
  }, 260);
}

function handlePointerMove(event) {
  if (!isHubPage()) return;

  const target = event.target.closest(HUB_NAV_SELECTOR);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const relX = (x / rect.width - 0.5) * 2;
  const relY = (y / rect.height - 0.5) * 2;

  const moveX = Math.max(-6, Math.min(6, relX * 6));
  const moveY = Math.max(-5, Math.min(5, relY * 5));
  const tilt = Math.max(-3, Math.min(3, relX * 3));

  target.style.setProperty("--hub-mouse-x", `${moveX}px`);
  target.style.setProperty("--hub-mouse-y", `${moveY}px`);
  target.style.setProperty("--hub-tilt", `${tilt}deg`);
  target.classList.add("shs-hub-magnetic-active");
}

function handlePointerOut(event) {
  const target = event.target.closest(HUB_NAV_SELECTOR);
  if (!target) return;

  const next = event.relatedTarget;
  if (next && target.contains(next)) return;

  target.style.setProperty("--hub-mouse-x", "0px");
  target.style.setProperty("--hub-mouse-y", "0px");
  target.style.setProperty("--hub-tilt", "0deg");
  target.classList.remove("shs-hub-magnetic-active");
}

function handleClick(event) {
  if (!isHubPage()) return;

  const target = event.target.closest(HUB_CLICK_SELECTOR);
  if (!target) return;

  playHubClick();
  addPressPulse(target);
}

export default function HubInteractionLayer() {
  React.useEffect(() => {
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerout", handlePointerOut, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
