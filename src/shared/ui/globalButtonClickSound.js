/*
  SHS Interaction Feedback Layer V1
  ---------------------------------
  Purpose:
  - Give SHS/SHF operator pages immediate feedback on action.
  - Button/card click = soft sound + press glow/ripple.
  - Disabled controls and data-sound="off" regions stay silent.
  - data-passive="true" regions stay silent.
  - This is UI feedback only; it does not change business logic.
*/

let installed = false;
let audioContext = null;
let lastPlayAt = 0;

const CLICKABLE_SELECTOR = [
  "button",
  "a[href]",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",

  /* SHS / Hub common clickable surfaces */
  ".is-primary",
  ".rt-stageReferral",
  ".rt-verifyButton",
  ".hbr-truthHealthRefresh",
  ".hbr-panel button",
  ".hbr-reportActions button",
  ".paq2-card button",
  ".paq2-card [role='button']",
  ".paq2-cardActions button",
  ".intakeShs-card button",
  ".intakeShs-nav button",
  ".hbr-nav button",
  ".rt-stage button",
].join(",");

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function getClickableElement(target) {
  if (!target || typeof target.closest !== "function") return null;

  const clickable = target.closest(CLICKABLE_SELECTOR);

  if (!clickable) return null;

  if (
    clickable.disabled ||
    clickable.getAttribute("aria-disabled") === "true" ||
    clickable.dataset?.sound === "off" ||
    clickable.dataset?.passive === "true" ||
    clickable.closest("[data-sound='off']") ||
    clickable.closest("[data-passive='true']")
  ) {
    return null;
  }

  return clickable;
}

function shouldPlayForElement(target) {
  return Boolean(getClickableElement(target));
}

function installClickVisualStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("shs-global-click-visual-style")) return;

  const style = document.createElement("style");
  style.id = "shs-global-click-visual-style";
  style.textContent = `
    .shs-ui-click-pulse {
      position: relative;
      transform: translateY(1px) scale(0.985) !important;
      filter: brightness(1.12) saturate(1.08);
      box-shadow:
        0 0 0 1px rgba(103, 232, 249, 0.34),
        0 0 22px rgba(59, 130, 246, 0.28),
        inset 0 0 18px rgba(103, 232, 249, 0.12) !important;
      transition:
        transform 120ms ease,
        filter 120ms ease,
        box-shadow 120ms ease !important;
    }

    .shs-ui-click-pulse::after {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      pointer-events: none;
      border: 1px solid rgba(103, 232, 249, 0.42);
      opacity: 0.95;
      animation: shsClickRing 260ms ease-out forwards;
    }

    @keyframes shsClickRing {
      from {
        transform: scale(0.98);
        opacity: 0.9;
      }
      to {
        transform: scale(1.06);
        opacity: 0;
      }
    }
  `;

  document.head.appendChild(style);
}

function playClickVisual(target) {
  const clickable = getClickableElement(target);
  if (!clickable) return;

  clickable.classList.remove("shs-ui-click-pulse");

  // Force restart animation.
  void clickable.offsetWidth;

  clickable.classList.add("shs-ui-click-pulse");

  window.clearTimeout(clickable.__shsClickPulseTimer);
  clickable.__shsClickPulseTimer = window.setTimeout(() => {
    clickable.classList.remove("shs-ui-click-pulse");
  }, 220);
}

export function playShsButtonClickSound() {
  if (typeof window === "undefined") return;

  const now = performance.now();

  // Prevent double sounds from nested clickable elements.
  if (now - lastPlayAt < 80) return;
  lastPlayAt = now;

  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      context.resume?.();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(480, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.04);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.085);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.095);
  } catch (error) {
    console.warn("[SHS UI] Button click sound unavailable", error);
  }
}

export function installGlobalButtonClickSound() {
  if (typeof window === "undefined" || installed) return;

  installed = true;
  installClickVisualStyles();

  const handler = (event) => {
    if (shouldPlayForElement(event.target)) {
      playClickVisual(event.target);
      playShsButtonClickSound();
    }
  };

  window.addEventListener("pointerdown", handler, true);

  window.addEventListener(
    "keydown",
    (event) => {
      if ((event.key === "Enter" || event.key === " ") && shouldPlayForElement(event.target)) {
        playClickVisual(event.target);
        playShsButtonClickSound();
      }
    },
    true
  );

  window.__shsButtonClickSoundInstalled = true;
  window.__shsClickVisualFeedbackInstalled = true;
}
