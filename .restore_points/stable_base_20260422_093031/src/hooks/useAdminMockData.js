// src/hooks/useAdminMockData.js
import React from "react";

const SCHOOLS = ["East HS", "Central HS", "West HS", "Metro"];
const PROGRAMS = ["ASL 1", "ASL 2", "Career Readiness", "Bridge"];
const INSTRUCTORS = ["Nguyen", "Lopez", "Patel", "Rivera", "Lee"];

export function useAdminMockData() {
  const [funnel, setFunnel] = React.useState(makeFunnel());
  const [cohorts, setCohorts] = React.useState(makeCohorts());

  const refresh = () => {
    setFunnel(makeFunnel());
    setCohorts(makeCohorts());
  };

  return { funnel, cohorts, refresh };
}

// Enrollment → First action → 7d retention → Completion → Credential → Job outcome
function makeFunnel() {
  const base = rand(180, 650);
  const steps = [
    { key:"enrolled",              label:"Enrolled" },
    { key:"first_action",          label:"First Action" },
    { key:"retained_7d",           label:"7-Day Retention" },
    { key:"course_completed",      label:"Course Completed" },
    { key:"credential_minted",     label:"Credential Minted" },
    { key:"job_outcome",           label:"Interview/Offer" }
  ];
  let cur = base;
  return steps.map((s, i) => {
    if (i === 0) return { ...s, value: cur };
    cur = Math.round(cur * randFloat(0.55, 0.9));
    return { ...s, value: cur };
  });
}

function makeCohorts(n = 12) {
  const rows = [];
  for (let i=0; i<n; i++){
    const start = monthBack(i);
    const enrolled = rand(60, 320);
    const first = Math.round(enrolled * randFloat(0.8, 0.95));
    const r7 = Math.round(first * randFloat(0.6, 0.9));
    const completed = Math.round(r7 * randFloat(0.5, 0.8));
    const minted = Math.round(completed * randFloat(0.6, 0.95));
    const jobs = Math.round(minted * randFloat(0.05, 0.25));
    rows.push({
      id: `c-${start}`,
      startMonth: start,
      school: pick(SCHOOLS),
      program: pick(PROGRAMS),
      instructor: pick(INSTRUCTORS),
      walletConnPct: Math.round(randFloat(0.55, 0.98)*100),
      enrolled, first, r7, completed, minted, jobs,
      anomalyZ: randFloat(-1.2, 3.8)
    });
  }
  return rows;
}

// utils
function rand(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
function randFloat(a,b){ return a + Math.random()*(b-a); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function monthBack(i){
  const d = new Date(); d.setMonth(d.getMonth()-i);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
