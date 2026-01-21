import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, "src/apps/manifest");

const APPS = [
  {
    id: "foundation",
    name: "Foundation",
    entry: "src/entries/foundation.main.jsx",
    routes: "src/router/FoundationRoutes.jsx",
    layout: "src/layouts/FoundationLayout.jsx",
    shellCss: "src/styles/foundation.css",
    dashboard: "src/pages/foundation/FoundationTop.jsx"
  },
  {
    id: "admin",
    name: "Admin",
    entry: "src/entries/admin.main.jsx",
    routes: "src/router/AdminRoutes.jsx",
    layout: "src/layouts/AdminLayout.jsx",
    shellCss: "src/styles/app-shell.css",
    dashboard: "src/pages/AdminDashboard.jsx"
  },
  {
    id: "curriculum",
    name: "Curriculum",
    entry: "src/entries/curriculum.main.jsx",
    routes: "src/router/CurriculumRoutes.jsx",
    layout: "src/layouts/CurriculumLayout.jsx",
    shellCss: "src/styles/curriculum-shell.css",
    dashboard: "src/pages/curriculum/CurriculumDashboard.jsx"
  },
  {
    id: "arcade",
    name: "Arcade",
    entry: "src/entries/arcade.main.jsx",
    routes: "src/router/ArcadeRoutes.jsx",
    layout: "src/layouts/ArcadeLayout.jsx",
    shellCss: "src/styles/arcade-shell.css",
    dashboard: "src/pages/arcade/ArcadeDashboard.jsx"
  },
  {
    id: "civic",
    name: "Civic",
    entry: "src/entries/civic.main.jsx",
    routes: "src/router/CivicRoutes.jsx",
    layout: "src/layouts/CivicLayout.jsx",
    shellCss: "src/styles/civic-shell.css",
    dashboard: "src/pages/civic/CivicDashboard.jsx"
  },
  {
    id: "credit",
    name: "Credit Bureau",
    entry: "src/entries/credit.main.jsx",
    routes: "src/router/CreditRoutes.jsx",
    layout: "src/layouts/CreditLayout.jsx",
    shellCss: "src/styles/credit-shell.css",
    dashboard: "src/components/credit/Dashboard.jsx"
  },
  {
    id: "debt",
    name: "Debt Sim",
    entry: "src/entries/debt.main.jsx",
    routes: "src/router/DebtRoutes.jsx",
    layout: "src/layouts/DebtLayout.jsx",
    shellCss: "src/styles/debt-shell.css",
    dashboard: "src/pages/debt/Dashboard.jsx"
  },
  {
    id: "treasury",
    name: "Treasury",
    entry: "src/entries/treasury.main.jsx",
    routes: "src/router/TreasuryRoutes.jsx",
    layout: "src/layouts/TreasuryLayout.jsx",
    shellCss: "src/styles/treasury-shell.css",
    dashboard: "src/pages/treasury/Dashboard.jsx"
  },
  {
    id: "employer",
    name: "Employer Hub",
    entry: "src/entries/employer.main.jsx",
    routes: "src/router/EmployerRoutes.jsx",
    layout: "src/layouts/EmployerLayout.jsx",
    shellCss: "src/styles/employer-shell.css",
    dashboard: "src/pages/employer/Dashboard.jsx"
  },
  {
    id: "sales",
    name: "Sales",
    entry: "src/entries/sales.main.jsx",
    routes: "src/router/SalesRoutes.jsx",
    layout: "src/layouts/SalesLayout.jsx",
    shellCss: "src/styles/sales-shell.css",
    dashboard: "src/pages/sales/Dashboard.jsx"
  },
  {
    id: "loo",
    name: "Lord of Outcomes",
    entry: "src/entries/lordOutcomes.main.jsx",
    routes: "src/router/LordOutcomesRoutes.jsx",
    layout: "src/layouts/LordOutcomesLayout.jsx",
    shellCss: "src/styles/lordOutcomes.css",
    dashboard: "src/pages/lordOutcomes/LordOutcomesHome.jsx"
  },
  {
    id: "ai",
    name: "AI / JobCompass",
    entry: "src/entries/ai.main.jsx",
    routes: "src/router/AIRoutes.jsx",
    layout: "src/layouts/AppShellLayout.jsx",
    shellCss: "src/styles/ai-compass.css",
    dashboard: "src/pages/ai/JobCompass.jsx"
  },
  {
    id: "fuel",
    name: "Fuel",
    entry: "src/entries/fuel.main.jsx",
    routes: "src/router/FuelRoutes.jsx",
    layout: "src/layouts/FuelLayout.jsx",
    shellCss: "src/styles/app-shell.css",
    dashboard: "src/pages/fuel/Top.jsx"
  },
  {
    id: "launch",
    name: "Launch",
    entry: "src/entries/launch.main.jsx",
    routes: "src/router/LaunchRoutes.jsx",
    layout: "src/layouts/LaunchLayout.jsx",
    shellCss: "src/styles/app-shell.css",
    dashboard: "src/pages/launch/Overview.jsx"
  },
  {
    id: "store",
    name: "Store",
    entry: "src/entries/store.main.jsx",
    routes: "src/router/StoreRoutes.jsx",
    layout: "src/layouts/StoreLayout.jsx",
    shellCss: "src/styles/app-shell.css",
    dashboard: "src/pages/store/StoreCatalog.jsx"
  },
  {
    id: "solutions",
    name: "Solutions",
    entry: "src/entries/solutions.main.jsx",
    routes: "src/router/SolutionsRoutes.jsx",
    layout: "src/layouts/SolutionsLayout.jsx",
    shellCss: "src/styles/theme-solutions.css",
    dashboard: "src/pages/solutions/SolutionsHome.jsx"
  }
];

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function writeManifest(app) {
  const file = path.join(OUTDIR, `${app.id}.manifest.json`);
  if (fs.existsSync(file)) return; // safety: do not overwrite
  const manifest = {
    contractVersion: 1,
    id: app.id,
    name: app.name,
    entry: app.entry,
    routes: app.routes,
    layout: app.layout,
    shellCss: app.shellCss,
    dashboard: app.dashboard,
    capabilities: {},
    meta: { generated: true, createdAt: new Date().toISOString() }
  };

  // Default capability policy (you can tune later)
  if (app.id === "ai") manifest.capabilities.map = true;
  if (app.id === "treasury" || app.id === "credit") manifest.capabilities.ledger = true;
  if (app.id === "admin" || app.id === "loo") manifest.capabilities.analytics = true;
  if (app.id === "treasury" || app.id === "store") manifest.capabilities.payments = true;

  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

ensureDir(OUTDIR);
APPS.forEach(writeManifest);

console.log("✅ Manifests created (non-destructive).");
console.log("Apps:", APPS.map(a => a.id).join(", "));
