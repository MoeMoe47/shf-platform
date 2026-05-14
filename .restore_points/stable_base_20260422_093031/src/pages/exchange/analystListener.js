export function initAnalystListener() {
  if (typeof window === "undefined") return;

  window.addEventListener("shf:ai_action", (e) => {
    const type = e.detail?.type;
    console.log("SYSTEM RECEIVED ACTION:", type);
  });
}
