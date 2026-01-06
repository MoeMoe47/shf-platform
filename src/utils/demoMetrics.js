// src/utils/demoMetrics.js
// deterministic-ish demo numbers so cards look alive (no backend required)

function mulberry32(seed = 1) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  
  // pick a stable seed per user/session so values don't jump each reload
  function getSeed() {
    try {
      const key = "sh_demo_seed";
      const existing = localStorage.getItem(key);
      if (existing) return Number(existing) || 1;
      const s = Math.floor(Math.random() * 1e9);
      localStorage.setItem(key, String(s));
      return s;
    } catch {
      return 1;
    }
  }
  
  export function demoDebtMetrics(seed = getSeed()) {
    const rnd = mulberry32(seed + 101);
    // utilization 15–85%
    const utilPct = Math.round(15 + rnd() * 70);
    // on-time 70–100%
    const onTimePct = Math.round(70 + rnd() * 30);
    return { utilPct, onTimePct };
  }
  
  export function demoCurriculumMetrics(seed = getSeed()) {
    const rnd = mulberry32(seed + 202);
    // attendance 65–98%
    const attendancePct = Math.round(65 + rnd() * 33);
    // assignment completion 40–95%
    const assignmentsPct = Math.round(40 + rnd() * 55);
    return { attendancePct, assignmentsPct };
  }
  
  export function demoCreditScore(seed = getSeed()) {
    const rnd = mulberry32(seed + 303);
    // score 540–760
    return Math.round(540 + rnd() * 220);
  }
  