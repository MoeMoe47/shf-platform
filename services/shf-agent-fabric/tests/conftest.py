from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure service package root is importable so tests can do:
#   from fabric... import ...
SERVICE_ROOT = Path(__file__).resolve().parents[1]  # .../services/shf-agent-fabric
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

# Also help subprocess-based tests / tools that read PYTHONPATH
os.environ.setdefault("PYTHONPATH", str(SERVICE_ROOT))
