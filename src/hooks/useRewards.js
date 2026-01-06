import React from "react";
const KEY_POINTS="wallet:points", KEY_BADGES="wallet:badges", BADGE_PREFIX="badge:";
export function getPoints(){ try{ return Number(localStorage.getItem(KEY_POINTS)||"0"); }catch{ return 0; } }
function readBadgesArrayKey(){ try{ return JSON.parse(localStorage.getItem(KEY_BADGES)||"[]"); }catch{ return []; } }
function readBadgesLegacyKeys(){ const ids=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(BADGE_PREFIX)) ids.push(k.slice(BADGE_PREFIX.length)); } }catch{} return ids; }
export function getBadges(){ const a=readBadgesArrayKey(); const b=readBadgesLegacyKeys(); return Array.from(new Set([...(a||[]),...(b||[])])); }
function setPointsLS(v){ try{ localStorage.setItem(KEY_POINTS, String(Math.max(0, Number(v)||0))); }catch{} }
function writeBadgesArray(ids){ try{ localStorage.setItem(KEY_BADGES, JSON.stringify(Array.from(new Set(ids||[])))); }catch{} }
function setLegacyBadge(id){ try{ localStorage.setItem(BADGE_PREFIX+id,"1"); }catch{} }
export function useRewards(){
  const [points,setPts]=React.useState(getPoints);
  const [badges,setB]=React.useState(getBadges);
  React.useEffect(()=>{ if(localStorage.getItem(KEY_POINTS)==null) setPointsLS(0); if(localStorage.getItem(KEY_BADGES)==null) writeBadgesArray([]); },[]);
  React.useEffect(()=>{ const onStorage=(e)=>{ if(!e||!e.key || e.key===KEY_POINTS || e.key===KEY_BADGES || e.key.startsWith(BADGE_PREFIX)){ setPts(getPoints()); setB(getBadges()); } };
    window.addEventListener("storage", onStorage); const t=setInterval(()=>{ setPts(getPoints()); setB(getBadges()); },1000);
    return ()=>{ window.removeEventListener("storage", onStorage); clearInterval(t); };
  },[]);
  const addPoints=React.useCallback((n)=>{ const add=Number(n||0); if(!Number.isFinite(add) || add===0) return; const next=Math.max(0, getPoints()+add); setPointsLS(next); setPts(next); },[]);
  const addBadge=React.useCallback((id)=>{ if(!id) return; const next=Array.from(new Set([...getBadges(), id])); writeBadgesArray(next); setLegacyBadge(id); setB(next); },[]);
  const resetRewards=React.useCallback(()=>{ setPointsLS(0); writeBadgesArray([]); try{ const rem=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith(BADGE_PREFIX)) rem.push(k);} rem.forEach(k=>localStorage.removeItem(k)); }catch{} setPts(0); setB([]); },[]);
  return { points, badges, badgeCount: badges.length, addPoints, addBadge, resetRewards };
}
