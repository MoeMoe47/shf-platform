// src/pages/store/StoreCatalog.jsx
import React from "react";

/**
 * StoreCatalog
 * Route: /store.html#/catalog   (via StoreRoutes)
 *
 * Uses 3-layer parallax hero:
 *  - /assets/catalog/sky-layer.jpg
 *  - /assets/catalog/pad-layer.png
 *  - /assets/catalog/wheat-layer.png
 *
 * And a frosted glass course strip at the bottom of the hero.
 */

const HERO_SCROLL_MAX = 400;

export default function StoreCatalog() {
  const rootRef = React.useRef(null);

  // Inject CSS once (like SolutionsMarketplace)
  React.useEffect(() => {
    if (!document.getElementById("store-catalog-css")) {
      const el = document.createElement("style");
      el.id = "store-catalog-css";
      el.textContent = CATALOG_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // Simple parallax controller
  React.useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const handleScroll = () => {
      const y = Math.min(window.scrollY || 0, HERO_SCROLL_MAX);
      node.style.setProperty("--sky-offset", `${-y * 0.15}px`);
      node.style.setProperty("--pad-offset", `${-y * 0.30}px`);
      node.style.setProperty("--wheat-offset", `${-y * 0.45}px`);
      node.style.setProperty("--hero-fade", String(Math.min(y / HERO_SCROLL_MAX, 1)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [track, setTrack] = React.useState("all");

  const filteredCourses = COURSES.filter((c) =>
    track === "all" ? true : c.track === track
  );

  return (
    <div ref={rootRef} className="catalog-page">
      {/* Hero */}
      <section className="catalog-hero">
        {/* Layers */}
        <div className="catalog-layer catalog-layer--sky" aria-hidden="true" />
        <div className="catalog-layer catalog-layer--pad" aria-hidden="true" />
        <div className="catalog-layer catalog-layer--wheat" aria-hidden="true" />

        {/* Gradient + content */}
        <div className="catalog-hero-inner">
          <div className="catalog-hero-copy">
            <p className="catalog-kicker">Silicon Heartland Foundation</p>
            <h1>
              Choose Your Path,
              <br />
              Build the Future.
            </h1>
            <p className="catalog-tagline">
              Browse our curriculum by track below. Launch when you’re ready —{" "}
              every lesson moves you closer to a real job, internship, or license.
            </p>
          </div>

          {/* Frosted track + cards strip */}
          <div className="catalog-strip">
            {/* Track tabs */}
            <div className="catalog-track-row" role="tablist" aria-label="Tracks">
              {TRACKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  className={
                    track === t.id ? "track-pill track-pill--active" : "track-pill"
                  }
                  onClick={() => setTrack(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Courses */}
            <div className="catalog-cards-row">
              {filteredCourses.map((course) => (
                <article key={course.id} className="catalog-card">
                  <div className="catalog-card-icon">{course.icon}</div>
                  <div className="catalog-card-main">
                    <h2>{course.title}</h2>
                    <p className="catalog-card-meta">
                      {course.instructor} • {course.duration}
                    </p>

                    <div className="catalog-progress-row">
                      <div className="catalog-progress-label">
                        {course.progress}% complete
                      </div>
                      <div className="catalog-progress-bar">
                        <div
                          className="catalog-progress-fill"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="catalog-card-actions">
                    <button
                      type="button"
                      className={
                        course.status === "start"
                          ? "catalog-btn catalog-btn--primary"
                          : "catalog-btn"
                      }
                    >
                      {course.status === "start" ? "Start" : "Resume"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Below-hero content placeholder */}
      <section className="catalog-body">
        <h2>All Programs</h2>
        <p>
          This area is for your full catalog grid, filters, and pathway details.
          We can wire this next once you’re happy with the hero.
        </p>
      </section>
    </div>
  );
}

/* ------------------- sample data ------------------- */

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
    track: "ai",
    title: "Intro to AI",
    instructor: "Billy Gateson",
    duration: "2 hours",
    progress: 80,
    status: "resume",
    icon: "📘",
  },
  {
    id: 2,
    track: "stack",
    title: "Cloud Computing Basics",
    instructor: "Billy Gateson",
    duration: "2 hours",
    progress: 30,
    status: "start",
    icon: "☁️",
  },
  {
    id: 3,
    track: "ai",
    title: "Neural Networks",
    instructor: "Billy Gateson",
    duration: "3 hours",
    progress: 30,
    status: "resume",
    icon: "🧠",
  },
  {
    id: 4,
    track: "smart",
    title: "Secure Coding Practices",
    instructor: "Billy Gateson",
    duration: "3 hours",
    progress: 0,
    status: "start",
    icon: "🔐",
  },
];

/* ------------------- CSS ------------------- */

const CATALOG_CSS = `
.catalog-page{
  --sky-offset:0px;
  --pad-offset:0px;
  --wheat-offset:0px;
  --hero-fade:0;
  color:#0b0c0e;
}

/* Transparent/glass header for store app */
[data-app="store"] .smp-appbar{
  position:fixed;
  top:12px;
  left:50%;
  transform:translateX(-50%);
  max-width:1280px;
  width:calc(100% - 24px);
  margin:0;
  padding:10px 18px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.24);
  background:linear-gradient(
    to bottom,
    rgba(8,9,13,.92),
    rgba(8,9,13,.75)
  );
  backdrop-filter:blur(16px);
}

/* Hero wrapper */
.catalog-hero{
  position:relative;
  height:min(90vh,720px);
  min-height:520px;
  overflow:hidden;
  background:#05060a;
  color:#ffffff;
}

/* Background layers */
.catalog-layer{
  position:absolute;
  inset:-10%;
  background-repeat:no-repeat;
  background-position:center bottom;
  background-size:cover;
  will-change:transform;
  pointer-events:none;
}

.catalog-layer--sky{
  background-image:url("/assets/catalog/sky-layer.jpg");
  transform:translate3d(0,var(--sky-offset),0);
}

.catalog-layer--pad{
  background-image:url("/assets/catalog/pad-layer.png");
  background-position:center 55%;
  transform:translate3d(0,var(--pad-offset),0);
}

.catalog-layer--wheat{
  background-image:url("/assets/catalog/wheat-layer.png");
  background-position:center 100%;
  transform:translate3d(0,var(--wheat-offset),0);
}

/* Gradient + content layout */
.catalog-hero-inner{
  position:relative;
  z-index:2;
  max-width:1200px;
  margin:0 auto;
  padding:120px 18px 48px;
  display:flex;
  flex-direction:column;
  gap:32px;
}

.catalog-hero::before{
  content:"";
  position:absolute;
  inset:0;
  background:
    linear-gradient(to bottom,rgba(5,6,10,.85),rgba(5,6,10,.4) 45%,transparent 75%),
    linear-gradient(to top,rgba(4,5,7,.9),transparent 40%);
  z-index:1;
}

/* Hero text */
.catalog-hero-copy{
  max-width:620px;
}
.catalog-kicker{
  margin:0 0 8px;
  font-size:13px;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:rgba(255,255,255,.8);
}
.catalog-hero-copy h1{
  margin:0 0 12px;
  font-size:40px;
  line-height:1.08;
}
.catalog-tagline{
  margin:0;
  font-size:16px;
  max-width:540px;
  color:rgba(255,255,255,.88);
}

/* Frosted strip */
.catalog-strip{
  margin-top:4px;
  padding:16px 16px 18px;
  border-radius:24px;
  backdrop-filter:blur(22px);
  background:linear-gradient(
      to bottom,
      rgba(245,240,230,.94),
      rgba(245,240,230,.96)
    );
  box-shadow:
    0 18px 45px rgba(0,0,0,.55),
    0 0 0 1px rgba(255,255,255,.7);
  color:#1a1b20;
}

/* Track tabs */
.catalog-track-row{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-bottom:16px;
}
.track-pill{
  padding:6px 14px;
  border-radius:999px;
  border:1px solid rgba(15,23,42,.08);
  background:transparent;
  font-size:13px;
  cursor:pointer;
  color:#4b5563;
}
.track-pill--active{
  background:#0f172a;
  color:#f9fafb;
  border-color:#0f172a;
}

/* Cards row */
.catalog-cards-row{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}

.catalog-card{
  display:flex;
  align-items:stretch;
  gap:12px;
  padding:14px 14px 12px;
  border-radius:18px;
  background:#ffffff;
  box-shadow:0 10px 24px rgba(15,23,42,.25);
}

.catalog-card-icon{
  width:40px;
  height:40px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:22px;
  background:#e5f0ff;
}

.catalog-card-main h2{
  margin:0 0 4px;
  font-size:16px;
}
.catalog-card-main{
  flex:1;
}
.catalog-card-meta{
  margin:0 0 8px;
  font-size:12px;
  color:#6b7280;
}

/* Progress */
.catalog-progress-row{
  display:flex;
  flex-direction:column;
  gap:4px;
}
.catalog-progress-label{
  font-size:11px;
  color:#4b5563;
}
.catalog-progress-bar{
  height:4px;
  border-radius:999px;
  background:#e5e7eb;
  overflow:hidden;
}
.catalog-progress-fill{
  height:100%;
  border-radius:999px;
  background:#f97316;
}

/* Card actions */
.catalog-card-actions{
  display:flex;
  align-items:flex-end;
}
.catalog-btn{
  padding:7px 14px;
  border-radius:999px;
  border:1px solid #0f172a;
  background:#ffffff;
  font-size:13px;
  cursor:pointer;
}
.catalog-btn--primary{
  background:#2563eb;
  border-color:#2563eb;
  color:#f9fafb;
}

/* Below hero content */
.catalog-body{
  max-width:1200px;
  margin:32px auto 80px;
  padding:0 18px;
}
.catalog-body h2{
  margin:0 0 8px;
}

/* Responsive */
@media (max-width:900px){
  .catalog-hero-inner{
    padding-top:120px;
  }
  .catalog-hero-copy h1{
    font-size:32px;
  }
  .catalog-cards-row{
    grid-template-columns:1fr;
  }
}
@media (max-width:640px){
  [data-app="store"] .smp-appbar{
    padding:8px 14px;
  }
  .catalog-strip{
    padding:14px 14px 16px;
  }
}
`;
