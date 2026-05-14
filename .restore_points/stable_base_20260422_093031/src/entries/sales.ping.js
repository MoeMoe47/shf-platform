const el = document.getElementById("root");
if (el) {
  el.style.padding = "12px";
  el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  el.style.background = "#fffbe6";
  el.style.border = "2px solid #f59e0b";
  el.textContent = "PING: sales.html loaded and scripts run ✅";
} else {
  console.warn("[sales.ping] #root not found");
}
