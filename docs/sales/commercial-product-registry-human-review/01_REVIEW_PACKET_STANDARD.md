# Review Packet Standard

Each packet is deterministic for a fixed 4B manifest, onboarding manifest, and `generated_at`. It contains candidate/product identity, family, current lifecycle/readiness/sellability, source status and references, entities, regulated metadata, every canonical gate and its current status, required capability/authority, evidence references, blockers, notes, decision-history references, eligibility projection, packet version, and generation timestamp.

Packets reference sources and evidence; they do not copy source payloads. 4B design references explain prior gate states but are explicitly not approvals. The packet generator fails closed if the 4B manifest does not contain exactly 32 entries or if candidate/product identity diverges from 4A.

The markdown packet's decision section is intentionally blank. The generated `review-packets.json` is a packet snapshot, not a decision ledger. Decision history belongs in the 4C append-only tables.
