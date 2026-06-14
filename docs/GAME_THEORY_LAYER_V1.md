# Game Theory Layer V1

Game Theory Layer V1 is the SHS strategic prediction and incentive-analysis layer.

## Existing Assets Reused

V1 reuses the existing deterministic strategy primitive at:

- `services/shf-agent-fabric/services/ai_layer/game_theory.py`

That existing helper already models strategic pressure, gaming risk, scenario comparison, and recommended strategy. V1 wraps it in a governed service/router instead of creating a duplicate strategy engine.

Related but not owned by Game Theory:

- `services/shf-agent-fabric/fabric/watchtower/risk_engine.py` remains Watchtower observability/risk classification.
- `services/shf-agent-fabric/app/core/growth_game.py` remains a prediction-market style helper, not the governed SHS Game Theory route family.

## Role

Truth Spine verifies what is true. Oracle decides what verified evidence supports. Game Theory predicts stakeholder behavior, incentives, strategic risk, cooperation/conflict, and likely outcome effects.

Game Theory predictions are strategic analysis. They are not verified facts, public approvals, Oracle rulings, LOO rankings, Alignment approvals, or report publications.

## Layer Boundaries

- Truth Spine owns claims, sources, verification, public approval, and report readiness.
- Oracle owns evidence-support rulings over Truth Packages.
- Game Theory owns incentive modeling, adversarial pressure analysis, and scenario strategy.
- Watchtower observes coverage, risk, anomalies, and drift.
- LOO ranks outcomes and exposes trust metadata.
- Alignment controls allowed actions and containment.
- Reports communicate only Truth Spine-approved and governance-safe information.

## Scenario Model

Scenario fields:

- `scenario_id`
- `scenario_type`
- `title`
- `description`
- `app_id`
- `program_id`
- `client_id`
- `stakeholder_ids`
- `claim_ids`
- `oracle_case_ids`
- `severity`
- `time_horizon`
- `status`
- `created_at`
- `updated_at`

Allowed scenario types:

- `funding_loss`
- `funding_gain`
- `partner_gain`
- `partner_loss`
- `staff_loss`
- `staff_growth`
- `data_quality_drop`
- `public_trust_drop`
- `public_trust_gain`
- `policy_change`
- `technology_failure`
- `adoption_growth`
- `adoption_resistance`
- `client_churn_risk`
- `upsell_opportunity`
- `program_expansion`
- `program_pause`
- `custom`

Allowed severity values:

- `low`
- `medium`
- `high`
- `critical`

Allowed time horizons:

- `immediate`
- `short_term`
- `medium_term`
- `long_term`

## Analysis Model

ScenarioAnalysis fields:

- `analysis_id`
- `scenario_id`
- `strategic_risk_score`
- `cooperation_score`
- `conflict_score`
- `incentive_alignment_score`
- `expected_outcome_delta`
- `trust_delta`
- `adoption_delta`
- `funding_delta`
- `operational_risk_delta`
- `recommended_strategy`
- `confidence`
- `reasoning_summary`
- `evidence_summary`
- `oracle_summary`
- `warnings`
- `created_at`

## Scoring Logic

V1 scoring is deterministic:

- Start all core scores at 50.
- Severity adjusts strategic risk: low +5, medium +15, high +30, critical +45.
- Funding loss, partner loss, staff loss, technology failure, data quality drop, client churn risk, public trust drop, adoption resistance, and program pause increase strategic risk and conflict.
- Funding gain, partner gain, staff growth, public trust gain, adoption growth, upsell opportunity, and program expansion increase cooperation, incentive alignment, adoption, funding, and expected outcome deltas.
- More verified or public-approved Truth Packages increase confidence and trust deltas.
- Missing, draft, or low trace coverage Truth Packages create warnings and lower confidence.
- Oracle supportable rulings increase confidence and cooperation.
- Oracle disputed, unsupported, or insufficient-evidence rulings increase risk and lower confidence.
- Immediate scenarios produce Alignment warnings rather than execution.

## Confidence Logic

Confidence is an integer from 0 to 100. It is based on:

- Scenario completeness
- Truth Package count and quality
- Truth Package trace coverage
- Oracle ruling quality
- Missing claim/case warnings
- Other warning count

## Backend Endpoints

- `GET /game-theory/health`
- `GET /game-theory/scenarios`
- `POST /game-theory/scenarios`
- `GET /game-theory/scenarios/{scenario_id}`
- `POST /game-theory/scenarios/{scenario_id}/analyze`
- `GET /game-theory/analyses`
- `GET /game-theory/analyses/{analysis_id}`
- `GET /game-theory/scenarios/{scenario_id}/analysis`
- `GET /game-theory/strategy-playbook`
- `GET /game-theory/audit-feed`

## Persistence

V1 uses local JSON files before any database migration:

- `services/shf-agent-fabric/db/game_theory/scenarios.json`
- `services/shf-agent-fabric/db/game_theory/analyses.json`
- `services/shf-agent-fabric/logs/game_theory.audit.log`

## Admin UI

The admin page lives at:

`/admin.html#/game-theory`

It shows:

- Game Theory health
- Strategy playbook cards
- Scenario creation form
- Scenarios table
- Analyze action
- Analysis result panel
- Scores and outcome deltas
- Warnings panel
- Truth Spine + Oracle + Alignment-Aware badge

## What Game Theory Must Not Own

Game Theory must not:

- Verify claims
- Public-approve claims
- Mark reports ready
- Issue Oracle rulings
- Execute actions
- Replace LOO rankings
- Publish reports directly
- Label predictions as verified outcomes

## Future Integrations

Future Funding Intelligence, ClientOps, and AI/Swarm work may consume Game Theory strategic analysis as one governed input. They must preserve Truth Spine, Oracle, Alignment, Watchtower, LOO, and Reports boundaries.

