const el = document.getElementById("app");
console.log("[sales.smoke1] running, el?", !!el);
if (el) {
  el.style.border = "2px solid #16a34a";
  el.style.background = "rgba(22,163,74,.08)";
  el.textContent = "SALES: pure JS smoke ✅ (no React)";
}
