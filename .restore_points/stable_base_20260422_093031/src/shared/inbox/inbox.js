const KEY = "inbox:notifications";

export function listNotes() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function pushNote(note) {
  try {
    const arr = listNotes();
    const withId = { id: crypto?.randomUUID?.() || String(Date.now()), ts: Date.now(), ...note };
    arr.push(withId);
    localStorage.setItem(KEY, JSON.stringify(arr));
    window.dispatchEvent(new Event("inbox:updated"));
    return withId;
  } catch (e) {
    console.warn("[inbox] push failed", e);
    return null;
  }
}

export function clearNotes() {
  try {
    localStorage.setItem(KEY, "[]");
    window.dispatchEvent(new Event("inbox:updated"));
  } catch {}
}
export function getInboxCount(){
  try { const a = JSON.parse(localStorage.getItem(KEY)||"[]"); return a.length|0; } catch { return 0; }
}
export function subscribeInbox(cb){
  const fn = (ev)=>{ if(ev.key===KEY) cb(); };
  window.addEventListener("storage", fn);
  return ()=>window.removeEventListener("storage", fn);
}
