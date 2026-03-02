import React, { useEffect, useRef } from "react";

import "./missionBackdrop.css";
/* SHF_BACKDROP_FAILSAFE (auto) */
;(() => {
  try {
    const id = "shf_backdrop_failsafe_style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `
        .shfMissionRoot, .shf-mission-root, .missionRoot {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }
        .shfMissionRoot::before, .shf-mission-root::before, .missionRoot::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(180deg, rgba(10,14,24,.62) 0%, rgba(10,14,24,.30) 45%, rgba(10,14,24,.72) 100%),
            url("/assets/hero/mission-observatory-A.png");
          background-repeat: no-repeat, no-repeat;
          background-size: cover;
          background-position: center 15%;
          transform: translateZ(0) scale(1.02);
          will-change: transform, background-position;
          pointer-events: none;
          z-index: 0;
        }
        .shfMissionFogLayer, .shf-mission-fog, .missionFog {
          position: absolute;
          inset: -20%;
          pointer-events: none;
          background-image: url("/assets/hero/mission-observatory-A.png");
          background-repeat: no-repeat;
          background-size: cover;
          opacity: .16;
          mix-blend-mode: screen;
          animation: shfFogDrift 60s linear infinite;
          transform: translateZ(0);
          z-index: 1;
        }
        @keyframes shfFogDrift {
          from { transform: translate3d(-3%,0,0); }
          to   { transform: translate3d( 3%,0,0); }
        }
        .shfMissionContent, .shf-mission-content, .missionContent {
          position: relative;
          z-index: 2;
        }
      `;
      document.head.appendChild(s);
    }

    // light parallax (fast): update CSS vars on mouse move
    const root = document.querySelector(".shfMissionRoot, .shf-mission-root, .missionRoot");
    if (root && !root.dataset.shfParallax) {
      root.dataset.shfParallax = "1";
      const onMove = (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 18;   // px
        const y = (e.clientY / window.innerHeight - 0.5) * 10;  // px
        root.style.setProperty("--shf-bg-x", x.toFixed(2) + "px");
        root.style.setProperty("--shf-bg-y", y.toFixed(2) + "px");
        // push to background-position if you already use vars; otherwise harmless
        root.style.backgroundPosition = `calc(50% + ${x}px) calc(0% + ${y}px)`;
      };
      window.addEventListener("mousemove", onMove, { passive: true });
    }
  } catch {}
})();



export default function InterplanetaryMission() {
  /* ===== SHF BACKDROP TOGGLE (AUTO) ===== */
  const getInitialMode = () => {
    try {
      return localStorage.getItem("shf_mission_bg_mode") || "cover";
    } catch {
      return "cover";
    }
  };

  const [bgMode, setBgMode] = React.useState(getInitialMode);

  React.useEffect(() => {
    try { localStorage.setItem("shf_mission_bg_mode", bgMode); } catch {}
  }, [bgMode]);

  // Parallax (subtle + rAF + reduced-motion safe)
  React.useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let raf = 0;
    let tx = 0, ty = 0;
    const onMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;  // -1..1
      const dy = (e.clientY - cy) / cy;  // -1..1
      tx = dx * 10;  // px
      ty = dy * 8;   // px
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          document.documentElement.style.setProperty("--px", `${tx}px`);
          document.documentElement.style.setProperty("--py", `${ty}px`);
        });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Keyboard toggle: press "b"
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key && e.key.toLowerCase() === "b") {
        setBgMode((m) => (m === "cover" ? "contain" : "cover"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  /* ===== END SHF BACKDROP TOGGLE (AUTO) ===== */

  

/* ===== SHF MISSION BACKDROP (single-layer, cinematic, fog, parallax) ===== */
  const shfBgRef = React.useRef(null);
  const shfWrapRef = React.useRef(null);

  React.useEffect(() => {
    const wrap = shfWrapRef.current;
    const bg = shfBgRef.current;
    if (!wrap || !bg) return;

    let raf = 0;
    let tx = 0, ty = 0;
    let targetX = 0, targetY = 0;

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / Math.max(1, r.width)) - 0.5;
      const ny = ((e.clientY - r.top) / Math.max(1, r.height)) - 0.5;
      targetX = nx;
      targetY = ny;

      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          // subtle parallax only
          tx += (targetX - tx) * 0.08;
          ty += (targetY - ty) * 0.08;
          bg.style.transform = `translate3d(${(-tx*10).toFixed(2)}px, ${(-ty*8).toFixed(2)}px, 0) scale(1.02)`;
        });
      }
    };

    wrap.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      wrap.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
/* ===== END SHF MISSION BACKDROP ===== */

// --- Parallax via CSS vars (safe, lightweight) ---
  const raf = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      target.current.x = x;
      target.current.y = y;

      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        cur.current.x += (target.current.x - cur.current.x) * 0.10;
        cur.current.y += (target.current.y - cur.current.y) * 0.10;
        document.documentElement.style.setProperty("--shf-px", cur.current.x.toFixed(4));
        document.documentElement.style.setProperty("--shf-py", cur.current.y.toFixed(4));
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div ref={shfWrapRef} className="shfMissionWrap">
      <div ref={shfBgRef} className="shfMissionBackdrop" aria-hidden="true" />
      <div className="shfMissionOverlay" aria-hidden="true" />
      <div className="shfMissionFog" aria-hidden="true" />
      <style>{`
        .shfMissionWrap{
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: #070b12;
        }
        .shfMissionBackdrop{
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: url("/assets/hero/mission-observatory-A.png?v=4");
          background-repeat: no-repeat;
          background-position: center 15%;
          /* SHOW ENTIRE IMAGE (no crop). If you prefer fill+crop change contain->cover */
          
          /* sharpening hints */
          image-rendering: auto;
          transform: translate3d(0,0,0) scale(1.02);
          will-change: transform;
        }
        .shfMissionOverlay{
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(1200px 700px at 60% 20%, rgba(255,170,70,0.14), transparent 55%),
            radial-gradient(900px 600px at 20% 10%, rgba(120,170,255,0.10), transparent 60%),
            linear-gradient(to bottom, rgba(5,8,14,0.40), rgba(5,8,14,0.62));
          mix-blend-mode: normal;
        }
        .shfMissionFog{
          position: fixed;
          inset: -10%;
          z-index: 2;
          pointer-events: none;
          background-image: url("/assets/fx/fog.png");
          background-repeat: no-repeat;
          opacity: 0.18;
          transform: translate3d(0,0,0);
          will-change: transform;
          animation: shfFogDrift 34s linear infinite;
        }
        @keyframes shfFogDrift{
          0%{ transform: translate3d(-2%, -1%, 0); }
          100%{ transform: translate3d(2%, 1%, 0); }
        }
        /* Make sure app content sits above layers */
        .shfMissionWrap > *:not(.shfMissionBackdrop):not(.shfMissionOverlay):not(.shfMissionFog):not(style){
          position: relative;
          z-index: 3;
        }
      `}</style>

      {/* Backdrop Layers */}
      <div className="shf-bg shf-bg--base" aria-hidden="true" />
      <div className="shf-bg shf-bg--overlay" aria-hidden="true" />
      <div className="shf-bg shf-bg--fog shf-bg--fogA" aria-hidden="true" />
      <div className="shf-bg shf-bg--fog shf-bg--fogB" aria-hidden="true" />

      {/* UI Layer (your real menu/cards go here next) */}
      <div className="shf-ui">
        <header className="shf-topbar">
          <div className="shf-brand">
            <div className="shf-dot" />
            <div>
              <div className="shf-title">Interplanetary Mission</div>
              <div className="shf-sub">Observers: Humans • Operators: AI Agents</div>
            </div>
          </div>
          <div className="shf-pills">
            <span className="pill">Checkpoint 1</span>
            <span className="pill">Fuel Lab</span>
            <span className="pill">Mining</span>
          </div>
        </header>

        <main className="shf-grid">
          <section className="card">
            <h3>Mission Brief</h3>
            <p>
              Student teams design a theoretical fuel, build a ship, and reach checkpoints across
              multiple planets. Agents mine resources and trade to power the journey.
            </p>
            <div className="mini">
              <div><b>Status:</b> Ready</div>
              <div><b>Mode:</b> Observer + Agent</div>
            </div>
          </section>

          <section className="card">
            <h3>Agent Agenda</h3>
            <ul>
              <li>Mine: ice, metals, rare gases</li>
              <li>Trade: fuel components</li>
              <li>Optimize: burn rate vs distance</li>
              <li>Report: proof + logs</li>
            </ul>
          </section>

          <section className="card">
            <h3>Checkpoint Map</h3>
            <p>Next: Planet A → Station B → Moon C</p>
            <div className="bar">
              <div className="fill" style={{ width: "38%" }} />
            </div>
            <small>Progress is mocked for now.</small>
          </section>
        </main>
      </div>

      <style>{`
        :root { --shf-px: 0; --shf-py: 0; }

        .shf-mission-root{
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: transparent;
        }

        .shf-bg{
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          will-change: transform, opacity, background-position;
          transform: translate3d(0,0,0);
        }

        /* Use your existing tower image */
        .shf-bg--base{
          background-image:
            linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.55)),
            url("/assets/hero/mission-observatory-A.png?v=2");
          background-size: cover;
          background-position: center 15%;
          filter: brightness(1.12) contrast(1.06) saturate(1.06);
          transform: translate3d(calc(var(--shf-px) * -10px), calc(var(--shf-py) * -8px), 0) scale(1.03);
        }

        .shf-bg--overlay{
          background-image:
            radial-gradient(70% 70% at 50% 45%, rgba(0,0,0,0.00) 58%, rgba(0,0,0,0.50) 100%),
            linear-gradient(180deg, rgba(160,205,255,0.10), rgba(0,0,0,0.14));
          mix-blend-mode: multiply;
          opacity: 1;
        }

        .shf-bg--fog{
          background-image:
            radial-gradient(55% 45% at 25% 72%, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 70%),
            radial-gradient(55% 50% at 75% 78%, rgba(220,235,255,0.14), rgba(255,255,255,0.00) 72%);
          background-size: cover;
          background-repeat: no-repeat;
          opacity: 0.14;
        }

        .shf-bg--fogA{
          animation: shfFogA 44s linear infinite;
          transform: translate3d(calc(var(--shf-px) * -16px), calc(var(--shf-py) * -10px), 0);
        }
        .shf-bg--fogB{
          opacity: 0.10;
          animation: shfFogB 68s linear infinite;
          transform: translate3d(calc(var(--shf-px) * -24px), calc(var(--shf-py) * -14px), 0) scale(1.02);
        }

        @keyframes shfFogA { from { background-position: center 15%; } to { background-position: center 15%; } }
        @keyframes shfFogB { from { background-position: center 15%; } to { background-position: center 15%; } }

        @media (prefers-reduced-motion: reduce){
          .shf-bg--fogA, .shf-bg--fogB { animation: none !important; }
          .shf-bg--base { transform: none !important; }
        }

        /* UI */
        .shf-ui{
          position: relative;
          z-index: 1;
          padding: 22px;
          color: rgba(255,255,255,0.92);
        }
        .shf-topbar{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 16px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(10, 14, 22, 0.46);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 14px 50px rgba(0,0,0,0.35);
        }
        .shf-brand{ display:flex; align-items:center; gap:12px; }
        .shf-dot{ width:10px; height:10px; border-radius:50%; background: rgba(170,220,255,0.9); box-shadow: 0 0 18px rgba(170,220,255,0.55); }
        .shf-title{ font-weight: 800; letter-spacing: 0.2px; }
        .shf-sub{ font-size: 12px; opacity: 0.8; margin-top: 2px; }
        .shf-pills{ display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
        .pill{
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.10);
        }

        .shf-grid{
          margin-top: 18px;
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 980px){
          .shf-grid{ grid-template-columns: 1fr; }
        }

        .card{
          border-radius: 18px;
          padding: 16px;
          background: rgba(10, 14, 22, 0.46);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 14px 50px rgba(0,0,0,0.35);
        }
        .card h3{ margin:0 0 8px 0; font-size: 14px; letter-spacing: 0.2px; }
        .card p, .card li{ font-size: 13px; opacity: 0.9; line-height: 1.4; }
        .mini{ display:flex; gap:14px; margin-top: 10px; font-size: 12px; opacity: 0.9; }
        .bar{ height: 10px; border-radius: 999px; background: rgba(255,255,255,0.10); overflow:hidden; margin-top: 10px; }
        .fill{ height: 100%; border-radius: 999px; background: rgba(170,220,255,0.85); }
      `}</style>
    </div>
  );
}
