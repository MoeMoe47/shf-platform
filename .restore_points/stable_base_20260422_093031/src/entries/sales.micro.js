/* sales.micro.js — zero dependencies */
console.log("[sales.micro] loaded");
const el = document.querySelector('#root,[data-app="sales"]');
if (el) {
  el.textContent = "Sales Micro Boot ✅";
  el.style.cssText = "font:16px system-ui; padding:24px;";
} else {
  document.body.innerHTML = '<div style="font:16px system-ui; padding:24px; color:#b91c1c">#root not found</div>';
}
