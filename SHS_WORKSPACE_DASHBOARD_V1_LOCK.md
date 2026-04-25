# SHS Workspace Dashboard V1 Lock

## Routes
Workspace Dashboard:
capital.html#/exchange/dashboard

Command Surface:
capital.html#/exchange/command

## Locked working behavior
- Overview loads normally.
- Profile photo appears.
- Upload/change photo works.
- Profile photo persists after refresh.
- Calendar left-nav opens Calendar panel.
- Conference left-nav opens Conference panel.
- Journal left-nav opens Journal panel.
- Apps panel opens.
- Command Surface tile opens /exchange/command.
- Returning to /exchange/dashboard preserves the profile photo.

## Product separation
SHS Workspace Dashboard:
User home base for profile, identity, workspace access, apps, files, tasks, reports, organization, billing, calendar, conference, journal, settings, and help.

SHS Command Surface:
Live operational truth surface for Oracle, verification, reconciliation, analyst reasoning, decisions, reporting readiness, audit, and command operations.

## Clean rules
- Dashboard edits identity.
- Command Surface displays identity.
- Dashboard manages files, calendar, conference, journal, and workspace tools.
- Command Surface consumes certified outputs only when they become evidence, action logs, analyst memos, audit records, or decision context.

## Current componentized dashboard structure
src/pages/exchange/workspace-dashboard/
- SHSWorkspaceDashboard.jsx
- shs-workspace-dashboard.css
- dashboardUtils.js
- data/dashboardData.js
- components/DashboardRail.jsx
- components/DashboardHeader.jsx
- components/KpiStrip.jsx
- components/ProfileUploadCard.jsx
- components/WorkspaceLauncher.jsx
- components/RightStack.jsx
- components/PanelView.jsx
- components/BottomDock.jsx

## Next build priority
1. Add Edit Profile modal.
2. Add Journal entry creation.
3. Add Calendar agenda actions.
4. Add Conference panel actions.
5. Add Files upload panel.
6. Add Reports panel actions.
7. Add notification deep-links into Command Surface.
