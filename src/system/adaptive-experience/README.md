# SHS Adaptive Experience Layer

Official moat role:
The SHS Adaptive Experience Layer is the user-behavior and product-learning layer for SHS/SHF dashboards, command centers, reports, and workflow surfaces.

## Clean separation

- Oracle Layer answers: What is true?
- Analyst Layer answers: What should happen next?
- Adaptive Experience Layer answers: What user experience works best?

## First outputs

- Dashboard Experience Score
- Feature Usage Map
- Friction Signals
- Role-Based UX Recommendations
- Next-Version Upgrade Memo
- Workflow Bottleneck Report
- Command Center Decision Behavior Report

## Privacy-safe rule

Do not track sensitive raw data. This layer tracks interaction events, not private content.

Allowed event examples:
- page_viewed
- card_clicked
- button_clicked
- form_started
- form_submitted
- form_abandoned
- report_exported
- file_uploaded
- recommendation_accepted
- recommendation_ignored
- alert_dismissed

Blocked data examples:
- passwords
- SSNs
- bank information
- credit card information
- medical record numbers
- raw case notes
- private message bodies

## Current phase

Phase 1 complete:
- event types
- tracker
- local event storage
- scoring
- recommendations
- React hook

Next phase:
- integrate into Hub Workspace Dashboard
- add Adaptive Experience insight panel
- connect intake/referral/import/report pages
- later persist events to backend
