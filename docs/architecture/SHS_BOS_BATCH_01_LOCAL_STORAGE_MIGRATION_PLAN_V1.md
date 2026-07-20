# SHS BOS Batch 01 - Local Storage Migration Plan

Generated: 2026-07-14T04:05:59+00:00

Business-critical browser state is identified and assigned to canonical repository owners before V1 runtime wiring.

Canonical owner: `admin.html#/ops/executive-command`.

API family: `/api/v1-command-center/contract-foundation/*`.

Runtime-wired status: no V1 contract is marked runtime-wired by Batch 01.

| State | Owner | Classification | Priority |
| --- | --- | --- | --- |
| browser.identity.demo_session_keys | SHS-LAYER-001 | identity_advisory_dev_state | P1 |
| browser.command_bus.event_storage | SHS-LAYER-007 | business_critical_runtime_state | P0 |
| browser.persistence.compatibility_state | SHS-LAYER-007 | business_critical_compatibility_state | P0 |
| browser.direct_source_proof | SHS-LAYER-013 | business_critical_source_evidence | P0 |
| browser.agent_task_queue | SHS-LAYER-025 | business_critical_agent_work_queue | P0 |
| browser.agent_approval_ledger | SHS-LAYER-025 | business_critical_approval_ledger | P0 |
| browser.reporting_bridge_workflow | SHS-LAYER-028 | business_critical_report_workflow_state | P0 |
| browser.export_audit_trail | SHS-LAYER-027 | business_critical_audit_state | P0 |
| browser.launch_ledger | SHS-LAYER-029 | business_critical_release_state | P0 |
| browser.executive_command_snapshots | SHS-LAYER-041 | operator_review_snapshot | P2 |
| browser.locale_and_reading_preferences | SHS-LAYER-003 | ui_preference | none |
