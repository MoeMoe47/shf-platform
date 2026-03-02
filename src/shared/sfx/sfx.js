/**
 * SHF SFX — Top 1% micro-audio (no mp3 assets)
 * - Uses WebAudio; requires user gesture to start (browser policy)
 * - Default muted; persisted in localStorage
 */
const KEY = "shf.sfx.enabled.v1";

let ctx = null;
let master = null;

export function isSfxEnabled() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return false; // default OFF (professional)
  return raw === "true";
}

export function setSfxEnabled(on) {
  localStorage.setItem(KEY, String(!!on));
}

export async function armSfx() {
  // Must be called from a user gesture (click/tap) at least once.
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0.45; // master volume ceiling
    master.connect(ctx.destination);
  }

  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return true;
}

function tone({ freq=440, dur=0.08, type="sine", gain=0.18, slideTo=null }) {
  if (!ctx || !master) return;
  if (!isSfxEnabled()) return;

  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);

  // fast attack / smooth release
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

  o.connect(g);
  g.connect(master);

  o.start();
  o.stop(ctx.currentTime + dur + 0.02);
}

export function sfxClick() {
  // crisp UI tick
  tone({ freq: 520, dur: 0.045, type: "triangle", gain: 0.12, slideTo: 420 });
}

export function sfxHover() {
  // subtle hover ping
  tone({ freq: 880, dur: 0.03, type: "sine", gain: 0.05, slideTo: 760 });
}

export function sfxSuccess() {
  // success double-ping
  tone({ freq: 660, dur: 0.06, type: "sine", gain: 0.13, slideTo: 880 });
  setTimeout(() => tone({ freq: 880, dur: 0.07, type: "sine", gain: 0.12, slideTo: 990 }), 55);
}

export function sfxAlert() {
  // alert blip
  tone({ freq: 220, dur: 0.09, type: "square", gain: 0.07, slideTo: 330 });
}
