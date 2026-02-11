"""
Canonical Registry Authority

- Single source of truth for business/program registry
- Hash-stable, audit-safe
- Append-only event logging
- Enforced at startup via compliance gate

DO NOT bypass or duplicate registry logic elsewhere.
"""

from __future__ import annotations
