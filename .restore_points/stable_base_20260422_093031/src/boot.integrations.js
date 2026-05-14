import { bump } from "@/shared/integrations/metricsClient.js";

window.addEventListener("shf:li:share",  () => bump("li_share",{provider:"linkedin"}));
window.addEventListener("shf:apply",     e => bump("apply",{provider:(e.detail||{}).provider}));
window.addEventListener("shf:click",     e => bump("click",{provider:(e.detail||{}).provider}));
window.shfMarkLinkedInConnected = () => bump("li_connect",{provider:"linkedin"});

console.debug("[SHF] Integrations wiring active.");
