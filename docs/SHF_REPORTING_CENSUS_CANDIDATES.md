# SHF Reporting Census Candidates

Audit date: 2026-08-25. The candidate list was produced by independent
semantic, implementation-pattern, browser-storage, seed/mock/static,
route/page, and backend export/PDF searches. Candidates are retained here
even when excluded so omissions and duplicate decisions are reviewable.

## Raw Candidates

| Candidate | File / component | Quantitative signal | Decision | Rationale |
|---|---|---|---|---|
| C01 | `src/pages/admin/reports/ShsReportDashboard` | report records and statuses | INCLUDE | authoritative-report candidate; browser/seed source |
| C02 | `src/pages/admin/reports/ShsCreateReportPage` | report creation metadata | INCLUDE | report-generation surface |
| C03 | `src/pages/admin/reports/ShsReportHistoryPage` | report history/export counts | INCLUDE | report history surface |
| C04 | `src/pages/admin/reports/ShsExportMetadataPage` | export metadata | INCLUDE | export surface |
| C05 | `src/pages/curriculum/CurriculumDashboard.jsx` | curriculum progress | INCLUDE | student progress KPI |
| C06 | `src/pages/Assignments.jsx` | completed/open work counts | INCLUDE | progress summary |
| C07 | `src/components/AttendanceCard.jsx` | attendance KPI | INCLUDE | quantitative student status |
| C08 | `src/components/MicroCertsCard.jsx` | earned/total and completion percent | INCLUDE | progress KPI |
| C09 | `src/components/ProofOutcomesSection.jsx` | wage/time/cost estimates | INCLUDE | outcome summary, estimate-labeled |
| C10 | `src/components/sales/ImpactForecaster.jsx` | projected completers/badges/value | INCLUDE | forecast report surface |
| C11 | `src/components/sales/FundingCalculator.jsx` | cost/funding/ROI | INCLUDE | funding calculation surface |
| C12 | `src/pages/admin/PlacementKPIs.jsx` | placement metrics | INCLUDE | institutional KPI candidate |
| C13 | `src/pages/shf-command/SHFImpactCommandCenter.jsx` | impact KPI band | INCLUDE | impact surface |
| C14 | `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | county values | INCLUDE | public impact map |
| C15 | `src/pages/shf-command/sections/ImpactKpiBand.jsx` | impact values | GROUP C13 | same command-center surface |
| C16 | `src/pages/shf-command/sections/ReportsBriefingsPanel.jsx` | report briefing values | INCLUDE | executive/report surface |
| C17 | `src/pages/hub/HubReports.jsx` | readiness/outcome/report counts | INCLUDE | Hub reporting surface |
| C18 | `src/pages/hub/HubFilesImports.jsx` | import totals/status counts | INCLUDE | operational reporting surface |
| C19 | `src/pages/hub/HubWorkspaceDashboard.jsx` | workflow KPI cards | INCLUDE | Hub dashboard surface |
| C20 | `src/pages/hub/HubLeadershipDashboard.jsx` | leadership summary cards | INCLUDE | executive Hub surface |
| C21 | `src/pages/hub/ReferralLifecycleView.jsx` | referral counts/rate | INCLUDE | outcome-flow KPI surface |
| C22 | `src/pages/hub/HubIntelligencePage.jsx` | scored/risk counts | INCLUDE | intelligence summary surface |
| C23 | `src/components/exchange/investor/OutcomeMetricsPanel.jsx` | investor outcome metrics | INCLUDE | Exchange reporting surface |
| C24 | `src/components/exchange/investor/ProgramRankingsTable.jsx` | program rankings | INCLUDE | quantitative comparison surface |
| C25 | `src/components/exchange/investor/PoolPerformanceTable.jsx` | pool performance | INCLUDE | funding performance surface |
| C26 | `src/components/exchange/public/ImpactSummaryHero.jsx` | public impact summary | INCLUDE | public impact surface |
| C27 | `src/components/exchange/public/TransparencyStats.jsx` | public transparency counts | INCLUDE | public statistics surface |
| C28 | `src/pages/lordOutcomes/ProgramOutcomesPage.jsx` | program outcomes | INCLUDE | outcome report surface |
| C29 | `src/pages/lordOutcomes/StateOutcomesPage.jsx` | state outcomes | INCLUDE | outcome report surface |
| C30 | `src/pages/lordOutcomes/EmployerImpactPage.jsx` | employer impact | INCLUDE | outcome report surface |
| C31 | `src/pages/lordOutcomes/FundingImpactPage.jsx` | funding impact | INCLUDE | funder report surface |
| C32 | `src/pages/lordOutcomes/LordOutcomesHome.jsx` | outcome KPI strip | INCLUDE | outcome landing/report surface |
| C33 | `src/pages/iep/IEPDashboardPage.jsx` | IEP progress/status | INCLUDE | restricted quantitative case surface |
| C34 | `src/pages/iep-command-v2/IEPCommandCenterV2.jsx` | county/IEP metrics | INCLUDE | restricted quantitative command surface |
| C35 | `services/shf-agent-fabric/fabric/reports/institutional` | KPI/trend/outcome PDF pages | INCLUDE | generated institutional report |
| C36 | `services/shf-agent-fabric/fabric/reports/funder_report.py` | funder report payload | INCLUDE | generated funder report |
| C37 | `src/pages/hub/HubReports 2.jsx` | duplicate Hub report mock | EXCLUDE | backup/duplicate file, not routed production surface |
| C38 | `src/_patchbak/**` | archived report pages | EXCLUDE | patch backup, not runtime reachable |

## Reconciliation

Included candidates C01-C14, C16-C36 reconcile to 30 confirmed surfaces in
`SHF_REPORTING_SURFACE_REGISTRY.v1.json`. C15 is a child component of C13; C37
and C38 are excluded backups. No candidate remains unresolved.
