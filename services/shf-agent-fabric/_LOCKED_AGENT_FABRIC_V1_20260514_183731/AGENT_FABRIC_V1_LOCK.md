# SHF Agent Fabric V1 Lock

## Status

Agent Fabric V1 is locked as a working checkpoint.

## Confirmed Working

- Canonical agent registry route
- Admin key protection
- 11 official SHS agents registered
- Individual agent lookup
- Agent registry verification
- Append-only agent ledger verification
- Agent Health Summary V1
- Agent Execution Readiness V1
- Controlled Agent Dry-Run V1
- Page Context Dry-Run V1
- AI Analyst Agent map/drawer/dashboard context contract

## Current Agent Count

- Total agents: 11
- Ready agents: 11
- Warning agents: 0
- Auto-ready agents: 7
- Human approval required: 4
- Blocked agents: 0
- User-visible agents: 3
- Internal agents: 8

## Official Agents

1. AI Analyst Agent
2. Oracle Truth Agent
3. Verification Agent
4. Reconciliation Agent
5. Watchtower Agent
6. Impact Measurement Agent
7. Impact Comparison Agent
8. Hub Guide Agent
9. Hub Matching Agent
10. Report Narrator Agent
11. Adaptive Experience Agent

## Important Architecture Decision

Do not create a separate visible map agent yet.

The AI Analyst Agent receives page, map, drawer, selected entity, Oracle truth, and verification context through the page context adapter.

Frontend should wire the Impact Command Center to:

POST /admin/agents/ai_analyst_agent/page-context-dry-run

## Protected Behavior

- Dry-run does not execute real tools.
- Dry-run does not modify official records.
- Dry-run does not bypass human approval.
- Approval-gated agents remain protected.
