# SHF App Matrix (Quick Jump Map)

Each row = one app.
Click the paths in VS Code to jump to the file.

| App            | Entry File                            | Routes File                          | Layout File                              | Shell CSS                  | Main Dashboard Page                               |
|----------------|----------------------------------------|--------------------------------------|------------------------------------------|----------------------------|---------------------------------------------------|
| Foundation     | `entries/foundation.main.jsx`         | `router/FoundationRoutes.jsx`        | `layouts/FoundationLayout.jsx`           | `styles/foundation.css`    | `pages/foundation/FoundationAppsPage.jsx`        |
| Admin          | `entries/admin.main.jsx`              | `router/AdminRoutes.jsx`             | `layouts/AdminLayout.jsx`                | `styles/app-shell.css`     | `pages/AdminDashboard.jsx`                        |
| Career         | `entries/career.main.jsx`             | `router/CareerRoutes.jsx`            | `layouts/CareerLayout.jsx`               | `styles/career-shell.css`  | `pages/career/CareerDashboard.jsx`               |
| Curriculum     | `entries/curriculum.main.jsx`         | `router/CurriculumRoutes.jsx`        | `layouts/CurriculumLayout.jsx`           | `styles/curriculum-shell.css` | `pages/curriculum/CurriculumDashboard.jsx`    |
| Arcade         | `entries/arcade.main.jsx`             | `router/ArcadeRoutes.jsx`            | `layouts/ArcadeLayout.jsx`               | `styles/arcade-shell.css`  | `pages/arcade/ArcadeDashboard.jsx`               |
| Civic          | `entries/civic.main.jsx`              | `router/CivicRoutes.jsx`             | `layouts/CivicLayout.jsx`                | `styles/civic-shell.css`   | `pages/civic/CivicDashboard.jsx`                 |
| Credit Bureau  | `entries/credit.main.jsx`             | `router/CreditRoutes.jsx`            | `layouts/CreditLayout.jsx`               | `styles/credit-shell.css`  | `components/credit/Dashboard.jsx`                |
| Debt Sim       | `entries/debt.main.jsx`               | `router/DebtRoutes.jsx`              | `layouts/DebtLayout.jsx`                 | `styles/debt-shell.css`    | `pages/debt/Dashboard.jsx`                       |
| Treasury       | `entries/treasury.main.jsx`           | `router/TreasuryRoutes.jsx`          | `layouts/TreasuryLayout.jsx`             | `styles/treasury-shell.css`| `pages/treasury/Dashboard.jsx`                   |
| Employer Hub   | `entries/employer.main.jsx`           | `router/EmployerRoutes.jsx`          | `layouts/EmployerLayout.jsx`             | `styles/employer-shell.css`| `pages/employer/Dashboard.jsx`                   |
| Sales          | `entries/sales.main.jsx`              | `router/SalesRoutes.jsx`             | `layouts/SalesLayout.jsx`                | `styles/sales-shell.css`   | `pages/sales/Dashboard.jsx` (or `SalesDashboard.jsx`) |
| LordOfOutcomes | `entries/lordOutcomes.main.jsx`       | `router/LordOutcomesRoutes.jsx`      | `layouts/LordOutcomesLayout.jsx`         | `styles/lordOutcomes.css`  | `pages/lordOutcomes/LordOutcomesHome.jsx`        |
| AI / JobCompass| `entries/ai.main.jsx`                 | `router/AIRoutes.jsx`                | `layouts/AppShellLayout.jsx`             | `styles/ai-compass.css`    | `pages/ai/JobCompass.jsx`                        |
| Fuel / Launch  | `entries/fuel.main.jsx` / `launch.main.jsx` | `router/FuelRoutes.jsx` / `LaunchRoutes.jsx` | `layouts/FuelLayout.jsx` / `layouts/LaunchLayout.jsx` | `styles/app-shell.css` | `pages/fuel/Top.jsx`, `pages/launch/Overview.jsx` |
| Store          | `entries/store.main.jsx`              | `router/StoreRoutes.jsx`             | `layouts/StoreLayout.jsx`                | `styles/app-shell.css`     | `pages/store/StoreCatalog.jsx`                   |
| Solutions      | `entries/solutions.main.jsx`          | `router/SolutionsRoutes.jsx`         | `layouts/SolutionsLayout.jsx`            | `styles/theme-solutions.css` | `pages/solutions/Home.jsx`                     |

> Tip: Use `Cmd + Click` on a path in VS Code’s Markdown preview to jump straight to the file.
