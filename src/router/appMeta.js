// src/router/appMeta.js
const p = (typeof window !== "undefined" && window.location.pathname) || "";

export const APP_ID =
  /curriculum\.html$/i.test(p) ? "curriculum" :
  /sales\.html$/i.test(p)      ? "sales"      :
  /arcade\.html$/i.test(p)     ? "arcade"     :
  /debt\.html$/i.test(p)       ? "debt"       :
  /employer\.html$/i.test(p)   ? "employer"   :
  /credit\.html$/i.test(p)     ? "credit"     :
  /career\.html$/i.test(p)     ? "career"     :
  // fallback if someone opens / (dev rewrite may change this)
  /curriculum$/i.test(p)       ? "curriculum" :
  /sales$/i.test(p)            ? "sales"      :
  "career";
