import React from "react";

/**
 * FuelBackground — brand-safe ambient background for Fuel Tank.
 * - Soft “motes” that drift + pulse (accent-tinted glow).
 * - Canvas-based for performance.
 * - Fully isolated: renders only when html[data-app="fuel"] is set.
 * - Respects prefers-reduced-motion.
 */
export default function FuelBackground({
  density = 0.00018,        // motes per pixel (viewport area * density)
  maxSpeed = 0.15,          // px per frame
  pulseSpeed = 0.015,       // pulse rate
  accent = getComputedStyle(document.documentElement)
            .getPropertyValue("--shf-foundation-accent") || "#ff4f00",
  base = getComputedStyle(document.documentElement)
            .getPropertyValue("--shf-foundation-line") || "#e7e5e4",
  good = getComputedStyle(document.documentElement)
            .getPropertyValue("--shf-foundation-good") || "#10b981",
}) {
  const ref = React.useRef(null);
  const raf = React.useRef(0);
  const state = React.useRef({w:0,h:0,pxRatio:1, nodes:[], reduce:false, lastTS:0, hidden:false});

  React.useEffect(() => {
    // insert minimal CSS (fixed layer)
    const id = "fuel-bg-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = `
        html[data-app="fuel"] .fuel-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          opacity: .9;
        }
        /* make sure content sits above it */
        html[data-app="fuel"] .ft-wrap { position: relative; z-index: 1; }
      `;
      document.head.appendChild(el);
    }

    const canvas = ref.current;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const st = state.current;

    // motion preferences
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setReduce = () => { st.reduce = !!mq.matches; };
    setReduce();
    mq.addEventListener?.("change", setReduce);

    const onVis = () => { st.hidden = document.hidden; };
    document.addEventListener("visibilitychange", onVis, false);

    const clampPxRatio = () => Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      st.w = window.innerWidth;
      st.h = window.innerHeight;
      st.pxRatio = clampPxRatio();
      canvas.width = Math.floor(st.w * st.pxRatio);
      canvas.height = Math.floor(st.h * st.pxRatio);
      canvas.style.width = st.w + "px";
      canvas.style.height = st.h + "px";
      initNodes();
    }

    function initNodes(){
      const area = st.w * st.h;
      // fewer motes when reduced motion
      const count = Math.max(16, Math.floor(area * (st.reduce ? density * 0.35 : density)));
      const nodes = new Array(count).fill(0).map(() => {
        const r = rand(0.6, 1.4);  // size scalar
        return {
          x: Math.random() * st.w,
          y: Math.random() * st.h,
          vx: rand(-maxSpeed, maxSpeed),
          vy: rand(-maxSpeed, maxSpeed),
          baseR: rand(22, 44) * r,
          phase: Math.random() * Math.PI * 2,
          hueShift: Math.random(),  // 0..1 to mix accent/base/good
        };
      });
      st.nodes = nodes;
    }

    function hexToRgb(hex) {
      const m = hex.trim().replace("#","")
      const v = m.length===3 ? m.split("").map(c=>c+c).join("") : m;
      const num = parseInt(v,16);
      return {r:(num>>16)&255,g:(num>>8)&255,b:num&255};
    }
    const ACC = hexToRgb(accent);
    const BAS = hexToRgb(base);
    const GRN = hexToRgb(good);

    function mix(a,b,t){ return Math.round(a + (b-a)*t); }
    function rgba(o){ return `rgba(${o.r},${o.g},${o.b},`; }
    function rand(a,b){ return a + Math.random()*(b-a); }

    function step(ts=0){
      if (st.hidden) { raf.current = requestAnimationFrame(step); return; }
      const dt = st.lastTS ? Math.min(33, ts - st.lastTS) : 16;
      st.lastTS = ts;

      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.save();
      ctx.scale(st.pxRatio, st.pxRatio);

      for (let i=0;i<st.nodes.length;i++){
        const n = st.nodes[i];

        // drift
        n.x += n.vx * (st.reduce ? 0.3 : 1);
        n.y += n.vy * (st.reduce ? 0.3 : 1);

        // wrap edges softly
        if (n.x < -80) n.x = st.w + 80;
        if (n.x > st.w + 80) n.x = -80;
        if (n.y < -80) n.y = st.h + 80;
        if (n.y > st.h + 80) n.y = -80;

        // pulse between 0.35..1 alpha & 0.8..1.25 radius
        n.phase += pulseSpeed * (st.reduce ? 0.5 : 1) * dt * 0.06;
        const pulse = (1 + Math.sin(n.phase)) * 0.5;           // 0..1
        const alpha = 0.35 + pulse * 0.55;                     // 0.35..0.9
        const rad   = n.baseR * (0.8 + pulse * 0.45);

        // color mix: base → accent → good (varied per mote)
        const t1 = n.hueShift * 0.7;           // bias toward accent
        const mid = {
          r: mix(BAS.r, ACC.r, t1),
          g: mix(BAS.g, ACC.g, t1),
          b: mix(BAS.b, ACC.b, t1),
        };
        const col = {
          r: mix(mid.r, GRN.r, pulse*0.25),
          g: mix(mid.g, GRN.g, pulse*0.25),
          b: mix(mid.b, GRN.b, pulse*0.25),
        };

        // draw soft glow + core
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rad);
        grad.addColorStop(0,   `${rgba(col)}${(alpha*0.8).toFixed(3)})`);
        grad.addColorStop(0.6, `${rgba(col)}${(alpha*0.25).toFixed(3)})`);
        grad.addColorStop(1,   `${rgba(col)}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rad, 0, Math.PI*2);
        ctx.fill();

        // occasional micro “spark”
        if (!st.reduce && pulse > 0.95 && (i % 9 === 0)) {
          ctx.fillStyle = `${rgba(col)}0.10)`;
          ctx.beginPath();
          ctx.arc(n.x + rand(-rad*0.15, rad*0.15), n.y + rand(-rad*0.15, rad*0.15), rad*0.25, 0, Math.PI*2);
          ctx.fill();
        }
      }

      ctx.restore();
      raf.current = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    raf.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener?.("change", setReduce);
    };
  }, [density, maxSpeed, pulseSpeed, accent, base, good]);

  return <canvas className="fuel-bg" ref={ref} aria-hidden="true" />;
}
