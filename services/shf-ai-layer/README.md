# SHF AI Layer

Separate AI interpretation service for Silicon Heartland.

## Purpose
This service analyzes structured state from the core system and returns:
- current state explanation
- what changed
- risk analysis
- recommended action
- reasoning
- confidence

## Important boundary
This service does not execute decisions or modify the ledger/core system.

## Run
cd services/shf-ai-layer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8010

## Test
GET  /health
POST /ai/analyze
