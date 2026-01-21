#!/usr/bin/env bash
set -euo pipefail

# Guardrail 1: Solutions must never import MapHero/MapLibre map stack
if rg -n --hidden --follow -S "MapHero\\b|MapHeroLazy\\b|maplibre-gl\\b|MapLibre\\b" src/pages/solutions src/layouts/SolutionsLayout.jsx src/router/SolutionsRoutes.jsx >/dev/null; then
  echo "❌ Guardrail failed: Solutions contains MapHero/MapLibre references."
  rg -n --hidden --follow -S "MapHero\\b|MapHeroLazy\\b|maplibre-gl\\b|MapLibre\\b" src/pages/solutions src/layouts/SolutionsLayout.jsx src/router/SolutionsRoutes.jsx || true
  exit 1
fi

# Guardrail 2: AI map must exist somewhere expected (helps catch accidental deletion)
if ! rg -n --hidden --follow -S "components/ai-compass/MapHero\\.jsx|MapHero\\b" src/pages/ai src/router/AIRoutes.jsx >/dev/null; then
  echo "❌ Guardrail failed: AI map usage not found where expected."
  exit 1
fi

echo "✅ Guardrails OK"
