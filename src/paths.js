// Cross-app base anchors (hash routers)
export const APP = {
  career:     "/career.html#",
  curriculum: "/curriculum.html#",
  sales:      "/sales.html#",
  store:      "/store.html#",
  arcade:     "/arcade.html#",
  debt:       "/debt.html#",
  fuel:       "/fuel.html#",   // ✅ Fuel Tank
};

// Helper: build a link into any app safely
export const toApp = (app, subpath = "/") => {
  const base = APP[app] || "/";
  return `${base}${String(subpath).replace(/^#?\/?/, "")}`;
};

// Convenience fns (if you use these elsewhere)
export const href = {
  career:     (p = "/") => `${APP.career}${p}`,
  curriculum: (p = "/") => `${APP.curriculum}${p}`,
  sales:      (p = "/") => `${APP.sales}${p}`,
  store:      (p = "/") => `${APP.store}${p}`,
  arcade:     (p = "/") => `${APP.arcade}${p}`,
  debt:       (p = "/") => `${APP.debt}${p}`,
  fuel:       (p = "/") => `${APP.fuel}${p}`,
};
