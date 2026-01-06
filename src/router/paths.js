// src/router/paths.js

/* -----------------------------------------
   Utilities
------------------------------------------ */
const normCur = (cur) =>
  String(cur || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();

const encSlug = (slug) => encodeURIComponent(String(slug || "").trim());

// Ensure subpaths used in cross-app hrefs always start with a single "/"
const normPath = (p = "/") => {
  const s = String(p || "/").trim().replace(/^#?\/?/, "");
  return `/${s}`;
};

/* -----------------------------------------
   App-level non-scoped routes (used inside an app)
------------------------------------------ */
export const HOME      = "/";
export const HELP      = "/help";
export const CAREER    = "/career";     // canonical (non-prefixed)
export const CURRICULA = "/curriculum"; // index/landing for curricula

/* -----------------------------------------
   Core, curriculum-scoped builders
------------------------------------------ */
export const DASHBOARD   = (cur)       => `/${normCur(cur)}/dashboard`;
export const LESSONS     = (cur)       => `/${normCur(cur)}/lessons`;
export const LESSON      = (cur, slug) => `/${normCur(cur)}/lessons/${encSlug(slug)}`;
export const ASSIGNMENTS = (cur)       => `/${normCur(cur)}/assignments`;
export const CALENDAR    = (cur)       => `/${normCur(cur)}/calendar`;
export const PORTFOLIO   = (cur)       => `/${normCur(cur)}/portfolio`;
export const ARCADE      = (cur)       => `/${normCur(cur)}/arcade`;

// Optional convenience builders
export const INSTRUCTOR      = (cur)    => `/${normCur(cur)}/instructor`;
export const INSTRUCTOR_UNIT = (cur, s) => `/${normCur(cur)}/instructor/${encSlug(s)}`;
export const MASTER          = (cur)    => `/${normCur(cur)}/master`;
export const MASTER_UNIT     = (cur, s) => `/${normCur(cur)}/master/${encSlug(s)}`;

// Legacy/aliases
export const COURSES         = LESSONS;
export const CAREER_PATHWAYS = CAREER;

/* -----------------------------------------
   HTML entries by app (cross-app anchors build from these)
------------------------------------------ */
export const APP = {
  career:     "/career.html#",
  curriculum: "/curriculum.html#",
  sales:      "/sales.html#",
  arcade:     "/arcade.html#",
  debt:       "/debt.html#",
  employer:   "/employer.html#",
  credit:     "/credit.html#",
  store:      "/store.html#",
  fuel:       "/fuel.html#",        // ✅ Fuel Tank
  foundation: "/foundation.html#",  // ✅ NEW
  solutions:  "/solutions.html#",   // ✅ NEW
};

/* -----------------------------------------
   In-app builders (used with <NavLink> inside each app shell)
------------------------------------------ */
export const inApp = {
  // Career app
  career: {
    dashboard:   () => "/dashboard",
    assignments: () => "/assignments",
    calendar:    () => "/calendar",
    portfolio:   () => "/portfolio",
    planner:     (section) =>
      section ? `/planner?section=${encodeURIComponent(section)}` : "/planner",
    explore:     () => "/explore",
    help:        () => "/help",
    resume:      () => "/resume",
  },

  // Curriculum app (requires a curriculum key like "asl")
  curriculum: (cur = "asl") => ({
    root:        () => `/${normCur(cur)}`,
    dashboard:   () => `/${normCur(cur)}/dashboard`,
    lessons:     () => `/${normCur(cur)}/lessons`,
    lesson:      (slug = "") => `/${normCur(cur)}/lessons/${encSlug(slug)}`, // canonical plural
    assignments: () => `/${normCur(cur)}/assignments`,
    calendar:    () => `/${normCur(cur)}/calendar`,
    portfolio:   () => `/${normCur(cur)}/portfolio`,
    arcade:      () => `/${normCur(cur)}/arcade`,
    help:        () => `/${normCur(cur)}/help`,
  }),

  // Sales app
  sales: {
    dashboard:  () => "/sales/dashboard",
    calc:       () => "/sales/calc",
    demo:       () => "/sales/demo",
    demoLesson: (cur, slug) =>
      `/sales/demo/${encodeURIComponent(cur || "asl")}/${encodeURIComponent(slug || "ch1")}`,
  },

  // Arcade app
  arcade: {
    dashboard:   () => "/dashboard",
    games:       () => "/games",
    leaderboard: () => "/leaderboard",
  },

  // Debt app
  debt: {
    clock:     () => "/clock",
    dashboard: () => "/clock",
  },
};

/* -----------------------------------------
   Cross-app anchors (always <a href="...">)
------------------------------------------ */
export const href = {
  career:     (p = "/") => `${APP.career}${normPath(p)}`,
  curriculum: (p = "/") => `${APP.curriculum}${normPath(p)}`,
  sales:      (p = "/") => `${APP.sales}${normPath(p)}`,
  arcade:     (p = "/") => `${APP.arcade}${normPath(p)}`,
  debt:       (p = "/") => `${APP.debt}${normPath(p)}`,
  employer:   (p = "/") => `${APP.employer}${normPath(p)}`,
  credit:     (p = "/") => `${APP.credit}${normPath(p)}`,
  store:      (p = "/") => `${APP.store}${normPath(p)}`,
  fuel:       (p = "/") => `${APP.fuel}${normPath(p)}`,         // ✅
  foundation: (p = "/") => `${APP.foundation}${normPath(p)}`,   // ✅
  solutions:  (p = "/") => `${APP.solutions}${normPath(p)}`,    // ✅
};

/* -----------------------------------------
   Generic helper (used by CrossAppLink or manual calls)
------------------------------------------ */
export const toApp = (app, subpath = "/") =>
  `${APP[app] || ""}${normPath(subpath)}`;
