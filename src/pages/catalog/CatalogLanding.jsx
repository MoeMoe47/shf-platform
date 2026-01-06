import React from "react";

/**
 * CatalogLanding.jsx
 * ----------------------------------------------------------
 * Top-1% cinematic catalog page with:
 * - 3-layer parallax hero (sky / pad / wheat)
 * - Frosted-glass panel
 * - White premium course cards
 */

const CSS = `
:root {
  --cat-bg: #f3eee4;
  --cat-nav-bg: rgba(245, 238, 227, 0.90);
  --cat-nav-solid: #f4ebdc;
  --cat-text-main: #111827;
  --cat-text-dim: #6b7280;
  --cat-accent: #ff4f00; /* International Orange */
  --cat-card-bg: #ffffff;
  --cat-radius-lg: 28px;
  --cat-radius-md: 20px;
  --cat-shadow-soft: 0 18px 55px rgba(15, 23, 42, 0.25);
}

/* Reset-ish */
*,
*::before,
*::after { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; }

/* Root layout */
.cat-root {
  min-height: 100vh;
  background: var(--cat-bg);
  color: var(--cat-text-main);
}

/* ---------- NAVBAR (transparent -> solid on scroll via class) ---------- */

.cat-nav {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 40px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  background: var(--cat-nav-bg);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  transition: background 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.cat-nav.scrolled {
  background: var(--cat-nav-solid);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  border-bottom-color: rgba(15, 23, 42, 0.12);
}

.cat-nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Simple text logo – swap with image when ready */
.cat-logo-mark {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 20%, #ffe1cc, #ff4f00);
  box-shadow: 0 0 0 4px rgba(255, 79, 0, 0.25);
}
.cat-logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.cat-logo-text span:first-child {
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.cat-logo-text span:last-child {
  font-size: 11px;
  color: var(--cat-text-dim);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.cat-nav-links {
  display: flex;
  gap: 24px;
  margin-left: 40px;
  font-size: 14px;
}
.cat-nav-links a {
  text-decoration: none;
  color: var(--cat-text-dim);
  position: relative;
}
.cat-nav-links a.active,
.cat-nav-links a:hover {
  color: var(--cat-text-main);
}
.cat-nav-links a.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  border-radius: 999px;
  background: var(--cat-accent);
}

.cat-nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.cat-pill-btn {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.7);
  padding: 7px 18px;
  font-size: 13px;
  cursor: pointer;
}
.cat-primary-btn {
  border-radius: 999px;
  border: none;
  background: var(--cat-accent);
  color: #fff;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 26px rgba(255, 79, 0, 0.35);
  cursor: pointer;
}

/* ---------- HERO + PARALLAX ---------- */

.cat-hero {
  position: relative;
  height: 75vh;
  min-height: 520px;
  max-height: 720px;
  overflow: hidden;
}

/* stack container */
.cat-parallax {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Base layer style shared */
.cat-layer {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

/* Individual layers use different images and depth factors (in JS) */
.cat-layer-sky {
  background-image: url("/assets/catalog/sky-layer.jpg");
}
.cat-layer-pad {
  background-image: url("/assets/catalog/pad-layer.png");
  background-position: center bottom;
}
.cat-layer-wheat {
  background-image: url("/assets/catalog/wheat-layer.png");
  background-position: center bottom;
}

/* subtle dark-to-light overlay so text is readable but image stays bright */
.cat-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(12, 10, 8, 0.35),
    rgba(12, 10, 8, 0.25),
    rgba(12, 10, 8, 0.10),
    rgba(12, 10, 8, 0.35)
  );
}

/* hero text + panel anchor */
.cat-hero-inner {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 40px 0; /* leave space under nav */
  color: #ffffff;
}

.cat-hero-kicker {
  font-size: 14px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  margin-bottom: 14px;
  opacity: 0.9;
}
.cat-hero-title {
  font-size: clamp(36px, 5vw, 52px);
  font-weight: 700;
  line-height: 1.02;
}
.cat-hero-sub {
  margin-top: 18px;
  max-width: 480px;
  font-size: 15px;
  line-height: 1.5;
  opacity: 0.94;
}

/* ---------- PANEL + TABS + CARDS ---------- */

.cat-panel-wrap {
  position: relative;
  z-index: 3;
  max-width: 1200px;
  margin: -60px auto 80px; /* pulls panel up over hero */
  padding: 0 40px 40px;
}

.cat-panel {
  border-radius: var(--cat-radius-lg);
  background: rgba(250, 247, 241, 0.9);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border: 1px solid rgba(148, 124, 96, 0.22);
  box-shadow: var(--cat-shadow-soft);
  padding: 22px 22px 26px;
}

/* tabs */
.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}
.cat-tab {
  min-width: 90px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
  color: var(--cat-text-dim);
}
.cat-tab.active {
  background: #fff;
  border-color: rgba(15, 23, 42, 0.09);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  color: var(--cat-text-main);
}

/* cards grid */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.cat-card {
  background: var(--cat-card-bg);
  border-radius: var(--cat-radius-md);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 140ms ease, box-shadow 140ms ease;
}
.cat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.16);
}

/* card header */
.cat-card-top {
  display: flex;
  gap: 12px;
}
.cat-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: radial-gradient(circle at 30% 20%, #ffe7d8, #ff4f00);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-size: 20px;
}
.cat-card-title {
  font-size: 16px;
  font-weight: 600;
}
.cat-card-meta {
  font-size: 12px;
  color: var(--cat-text-dim);
}

/* progress */
.cat-progress-wrap {
  margin-top: 4px;
}
.cat-progress-label {
  font-size: 12px;
  color: var(--cat-text-dim);
  margin-bottom: 4px;
}
.cat-progress-track {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(209, 213, 219, 0.9);
  overflow: hidden;
}
.cat-progress-bar {
  position: absolute;
  inset-block: 0;
  left: 0;
  border-radius: 999px;
  background: linear-gradient(to right, #ffb37a, #ff4f00);
}

/* footer */
.cat-card-footer {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cat-card-footer button {
  border-radius: 999px;
  padding: 7px 14px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}
.cat-card-footer .primary {
  background: var(--cat-accent);
  color: #fff;
}
.cat-card-footer .secondary {
  background: rgba(249, 250, 251, 0.9);
}

/* ---------- RESPONSIVE ---------- */

@media (max-width: 960px) {
  .cat-nav { padding-inline: 20px; }
  .cat-hero-inner { padding-inline: 20px; }
  .cat-panel-wrap { padding-inline: 20px; margin-top: -40px; }
  .cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 700px) {
  .cat-nav-links { display: none; }
  .cat-hero { height: 70vh; min-height: 460px; }
  .cat-panel-wrap { margin-top: -30px; }
  .cat-grid { grid-template-columns: 1fr; }
}
`;

function injectCssOnce() {
  if (document.getElementById("catalog-landing-css")) return;
  const style = document.createElement("style");
  style.id = "catalog-landing-css";
  style.textContent = CSS;
  document.head.appendChild(style);
}

export default function CatalogLanding() {
  const [track, setTrack] = React.useState("all");

  React.useEffect(() => {
    injectCssOnce();

    // nav scroll effect + parallax
    const nav = document.querySelector(".cat-nav");
    const sky = document.querySelector(".cat-layer-sky");
    const pad = document.querySelector(".cat-layer-pad");
    const wheat = document.querySelector(".cat-layer-wheat");

    function onScroll() {
      const y = window.scrollY || 0;

      if (nav) {
        if (y > 40) nav.classList.add("scrolled");
        else nav.classList.remove("scrolled");
      }

      // Parallax depth factors
      if (sky) sky.style.transform = `translateY(${y * 0.15}px)`;
      if (pad) pad.style.transform = `translateY(${y * 0.25}px)`;
      if (wheat) wheat.style.transform = `translateY(${y * 0.35}px)`;
    }

    onScroll(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredCourses =
    track === "all" ? COURSES : COURSES.filter((c) => c.track === track);

  return (
    <div className="cat-root">
      {/* NAVBAR */}
      <header className="cat-nav">
        <div className="cat-nav-left">
          <div className="cat-logo-mark" />
          <div className="cat-logo-text">
            <span>SILICON HEARTLAND</span>
            <span>CATALOG</span>
          </div>
          <nav className="cat-nav-links">
            <a href="#about">About</a>
            <a href="#programs">Programs</a>
            <a href="#curriculum" className="active">
              Curriculum
            </a>
            <a href="#dashboard">Dashboard</a>
          </nav>
        </div>
        <div className="cat-nav-right">
          <button className="cat-pill-btn" type="button">
            Explore Tracks
          </button>
          <button className="cat-primary-btn" type="button">
            Resume Module
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="cat-hero" aria-labelledby="hero-heading">
        <div className="cat-parallax">
          <div className="cat-layer cat-layer-sky" />
          <div className="cat-layer cat-layer-pad" />
          <div className="cat-layer cat-layer-wheat" />
        </div>
        <div className="cat-hero-overlay" />
        <div className="cat-hero-inner">
          <p className="cat-hero-kicker">CAREER LAUNCH SYSTEM</p>
          <h1 id="hero-heading" className="cat-hero-title">
            Choose Your Path,
            <br />
            Build the Future.
          </h1>
          <p className="cat-hero-sub">
            Browse the Silicon Heartland curriculum by track. From AI and
            smart contracts to CDL, barbering, and health careers—start where
            you are and launch into what&apos;s next.
          </p>
        </div>
      </section>

      {/* PANEL + CARDS */}
      <div className="cat-panel-wrap">
        <div className="cat-panel" id="curriculum">
          <div className="cat-tabs">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={
                  "cat-tab" + (track === t.id ? " active" : "")
                }
                onClick={() => setTrack(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="cat-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small components & mock data ---------- */

function CourseCard({ course }) {
  const pct = course.progress;
  return (
    <article className="cat-card">
      <div className="cat-card-top">
        <div className="cat-card-icon" aria-hidden="true">
          {course.icon}
        </div>
        <div>
          <h2 className="cat-card-title">{course.title}</h2>
          <div className="cat-card-meta">
            {course.instructor} • {course.duration}
          </div>
        </div>
      </div>

      <div className="cat-progress-wrap">
        <div className="cat-progress-label">{pct}% complete</div>
        <div className="cat-progress-track">
          <div
            className="cat-progress-bar"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="cat-card-footer">
        <span className="cat-card-meta">
          {course.provider} • {course.level}
        </span>
        <button
          type="button"
          className={pct > 0 ? "primary" : "secondary"}
        >
          {pct > 0 ? "Resume" : "Start"}
        </button>
      </div>
    </article>
  );
}

const TRACKS = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI Innovation Track" },
  { id: "smart", label: "Smart Contracts" },
  { id: "stack", label: "Silicon Stack" },
  { id: "deaf", label: "Deaf Pilot" },
];

const COURSES = [
  {
    id: 1,
    title: "Intro to AI",
    track: "ai",
    instructor: "Billy Gateson",
    duration: "2 hours",
    provider: "Silicon Heartland",
    level: "Beginner",
    progress: 80,
    icon: "🤖",
  },
  {
    id: 2,
    title: "Neural Networks",
    track: "ai",
    instructor: "Billy Gateson",
    duration: "3 hours",
    provider: "Silicon Heartland",
    level: "Intermediate",
    progress: 30,
    icon: "🧠",
  },
  {
    id: 3,
    title: "Cloud Computing Basics",
    track: "stack",
    instructor: "Billy Gateson",
    duration: "2 hours",
    provider: "Silicon Heartland",
    level: "Beginner",
    progress: 0,
    icon: "☁️",
  },
  {
    id: 4,
    title: "Secure Coding Practices",
    track: "smart",
    instructor: "Billy Gateson",
    duration: "3 hours",
    provider: "Silicon Heartland",
    level: "Intermediate",
    progress: 0,
    icon: "🔐",
  },
  {
    id: 5,
    title: "Google IT Support (Bridge)",
    track: "stack",
    instructor: "Coursera",
    duration: "20 hours",
    provider: "Partner",
    level: "Intermediate",
    progress: 0,
    icon: "💻",
  },
  {
    id: 6,
    title: "Deaf Pilot – Visual Storytelling",
    track: "deaf",
    instructor: "Billy Gateson",
    duration: "90 min",
    provider: "Silicon Heartland",
    level: "Beginner",
    progress: 0,
    icon: "🤟",
  },
];
