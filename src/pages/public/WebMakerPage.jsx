import React from "react";
import "@/pages/admin/web-maker.css";

const SOUND_STORAGE_KEY = "shs.webmaker.sound.enabled";

const templates = [
  {
    title: "Launch Site",
    badge: "Fast Start",
    description: "A polished landing page for new offers, pilots, and service launches.",
    action: "Preview launch",
    palette: ["#dff4ff", "#ffffff", "#38bdf8", "#06111f"],
  },
  {
    title: "Service Studio",
    badge: "Popular",
    description: "A calm service page for explaining value, proof, and next steps.",
    action: "Preview service",
    palette: ["#f7f4ef", "#ffffff", "#0ea5e9", "#0b1b2e"],
  },
  {
    title: "Proof Report",
    badge: "Premium",
    description: "A refined proof page for outcomes, snapshots, and executive review.",
    action: "Preview proof",
    palette: ["#eef6ff", "#ffffff", "#2563eb", "#06111f"],
  },
];

const trustPoints = [
  {
    title: "Client-ready from the first mock",
    text: "Start with a polished public-facing structure, not an internal dashboard.",
  },
  {
    title: "Built around approved direction",
    text: "Templates help preserve brand, page intent, assets, and scope decisions.",
  },
  {
    title: "Simple handoff to production",
    text: "Move from demo approval to a clean build packet without visual drift.",
  },
];

const steps = [
  {
    title: "Choose a template",
    text: "Pick the page shape closest to the offer, audience, and delivery moment.",
  },
  {
    title: "Tune the blueprint",
    text: "Refine messaging, preview structure, assets, and calls to action.",
  },
  {
    title: "Send to build",
    text: "Package the approved direction for implementation and screenshot QA.",
  },
];

function createTemplateImage({ title, palette }) {
  const [bg, card, accent, ink] = palette;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#06111f" flood-opacity="0.18"/>
        </filter>
      </defs>
      <rect width="960" height="640" rx="42" fill="${bg}"/>
      <rect x="72" y="62" width="816" height="516" rx="28" fill="${card}" filter="url(#shadow)"/>
      <rect x="112" y="104" width="154" height="16" rx="8" fill="${ink}" opacity="0.88"/>
      <circle cx="784" cy="112" r="10" fill="${accent}" opacity="0.95"/>
      <circle cx="820" cy="112" r="10" fill="${ink}" opacity="0.18"/>
      <circle cx="856" cy="112" r="10" fill="${ink}" opacity="0.18"/>
      <rect x="112" y="170" width="320" height="42" rx="21" fill="${ink}" opacity="0.96"/>
      <rect x="112" y="230" width="410" height="18" rx="9" fill="${ink}" opacity="0.2"/>
      <rect x="112" y="262" width="330" height="18" rx="9" fill="${ink}" opacity="0.16"/>
      <rect x="112" y="326" width="162" height="50" rx="25" fill="${accent}" opacity="0.96"/>
      <rect x="524" y="160" width="280" height="220" rx="28" fill="${bg}"/>
      <rect x="558" y="196" width="150" height="18" rx="9" fill="${ink}" opacity="0.85"/>
      <rect x="558" y="236" width="174" height="12" rx="6" fill="${ink}" opacity="0.18"/>
      <rect x="558" y="262" width="128" height="12" rx="6" fill="${ink}" opacity="0.16"/>
      <rect x="558" y="314" width="86" height="34" rx="17" fill="${accent}" opacity="0.9"/>
      <rect x="112" y="444" width="204" height="104" rx="22" fill="${bg}"/>
      <rect x="344" y="444" width="204" height="104" rx="22" fill="${bg}"/>
      <rect x="576" y="444" width="204" height="104" rx="22" fill="${bg}"/>
      <text x="112" y="584" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="${ink}" opacity="0.76">${title}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getInitialSoundPreference() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_STORAGE_KEY) === "true";
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function playClickSound(enabled) {
  if (!enabled || prefersReducedMotion() || typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(760, context.currentTime + 0.05);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    window.setTimeout(() => context.close(), 140);
  } catch {
    // Optional interaction sound should never interrupt the page.
  }
}

export default function WebMakerPage() {
  const [soundEnabled, setSoundEnabled] = React.useState(getInitialSoundPreference);

  function handleAction() {
    playClickSound(soundEnabled);
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(next));
    }
    playClickSound(next);
  }

  return (
    <main className="webmaker-page">
      <header className="webmaker-nav">
        <a className="webmaker-brand" href="/studio/templates" onClick={handleAction}>
          <span className="webmaker-brand__mark">SHS</span>
          <span>Website Studio</span>
        </a>
        <nav className="webmaker-nav__links" aria-label="Website Studio navigation">
          <a href="#templates" onClick={handleAction}>Templates</a>
          <a href="#how-it-works" onClick={handleAction}>How it works</a>
          <a href="#start" onClick={handleAction}>Start</a>
        </nav>
        <button className="webmaker-sound" type="button" onClick={toggleSound} aria-pressed={soundEnabled}>
          Sound {soundEnabled ? "On" : "Off"}
        </button>
      </header>

      <section className="webmaker-hero">
        <div className="webmaker-hero__copy">
          <p className="webmaker-eyebrow">SHS Web Maker</p>
          <h1>Launch polished websites without starting from a blank page.</h1>
          <p>
            Choose an approved blueprint, shape the message, and move into production
            with a clean website direction your clients can understand at first glance.
          </p>
          <div className="webmaker-actions">
            <a className="webmaker-button webmaker-button--primary" href="#templates" onClick={handleAction}>
              Explore templates <span>→</span>
            </a>
            <a className="webmaker-button webmaker-button--secondary" href="#how-it-works" onClick={handleAction}>
              See workflow <span>→</span>
            </a>
          </div>
        </div>

        <div className="webmaker-preview" aria-label="Desktop and mobile website preview">
          <div className="webmaker-preview__desktop">
            <div className="webmaker-windowbar">
              <i />
              <i />
              <i />
            </div>
            <div className="webmaker-preview__screen">
              <span className="webmaker-preview__pill" />
              <h2>Community launch page</h2>
              <p>Clear message, calm layout, and a production-ready page system.</p>
              <div className="webmaker-preview__cta" />
              <div className="webmaker-preview__tiles">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className="webmaker-preview__mobile">
            <span />
            <h3>Launch</h3>
            <p>Mobile-ready from the first mock.</p>
            <i />
          </div>
        </div>
      </section>

      <section className="webmaker-trust" aria-label="Trust points">
        {trustPoints.map((point) => (
          <article key={point.title}>
            <h2>{point.title}</h2>
            <p>{point.text}</p>
          </article>
        ))}
      </section>

      <section className="webmaker-templates" id="templates">
        <div className="webmaker-sectionHead">
          <p className="webmaker-eyebrow">Featured Templates</p>
          <h2>Three approved starting points.</h2>
        </div>
        <div className="webmaker-templateGrid">
          {templates.map((template) => (
            <article className="webmaker-templateCard" key={template.title}>
              <div className="webmaker-templateCard__image">
                <img src={createTemplateImage(template)} alt={`${template.title} website preview`} />
              </div>
              <div className="webmaker-templateCard__body">
                <span>{template.badge}</span>
                <h3>{template.title}</h3>
                <p>{template.description}</p>
                <button type="button" onClick={handleAction}>
                  {template.action} <i>→</i>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="webmaker-steps" id="how-it-works">
        <div className="webmaker-sectionHead">
          <p className="webmaker-eyebrow">How It Works</p>
          <h2>From first idea to build-ready page.</h2>
        </div>
        <div className="webmaker-stepGrid">
          {steps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="webmaker-finalCta" id="start">
        <div>
          <p className="webmaker-eyebrow">Ready when the page is.</p>
          <h2>Build a website direction that feels approved before production starts.</h2>
        </div>
        <a className="webmaker-button webmaker-button--primary" href="#templates" onClick={handleAction}>
          Start with a template <span>→</span>
        </a>
      </section>
    </main>
  );
}
