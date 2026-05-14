const KEY = "sales:leadQueue";
const EVT = "sales:leadQueue:updated";

export function readLeadQueue() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function clearLeadQueue() {
  try {
    localStorage.setItem(KEY, "[]");
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function onLeadQueueUpdate(setter) {
  const handler = () => {
    try { setter(readLeadQueue()); }
    catch { setter([]); }
  };
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
