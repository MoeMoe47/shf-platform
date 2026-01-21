# How SHF Protects You (Plain English)

## What SHF is
SHF is a system that runs programs and produces reports, but it has safety controls so it cannot do harmful or unauthorized actions.

## Two safety layers: L25 and L26
### L25 (Policy)
L25 decides what an app is allowed to ask for.
It can allow, block, or allow with limits.
Limits can include safe-only capabilities.

### L26 (Containment)
L26 is the emergency brake.
If something looks risky, L26 can force the system into a safer state (LIMITED or OFF).
It can also block specific agent types and specific capabilities.

## Plan execution control
Sensitive actions are not executed automatically.
They run as “plans” that must pass validation.
Execution can require explicit approval.

## Admin protections
Admin actions are protected by an admin key.
Irreversible actions require a typed confirmation phrase before execution.

## Audit trail
Important decisions record an audit reference so actions can be reviewed later.

## Why this matters
These controls reduce risk, prevent accidents, and create funder-ready governance.
