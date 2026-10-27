# R0–R4 semantic review

Source: OASRiskClassificationPage.jsx LEVELS, EXPLAIN, MATRIX_ROWS/MATRIX_COLUMNS; baseline 35d2bdf. Canonical source retains risk_levels with IDs R0–R4. The page explicitly calls it a five-level risk classification used to scale governance, oversight and controls. It considers capabilities, autonomy, context and potential consequences of failure/misuse. It is contextual risk guidance, not a compliance score, maturity scale, certification level or requirement identifier. Risk of harm is one input; the source does not define a standalone numerical severity metric.

| Level | Existing name | Existing description/control label |
| --- | --- | --- |
| R0 | Minimal / Informational | No material risk of harm; information, assistance or productivity; Baseline Controls |
| R1 | Low | Limited harm, well-defined scope/constrained capabilities; Standard Controls |
| R2 | Moderate | Meaningful harm in specific contexts; additional controls/oversight; Enhanced Controls |
| R3 | High | Significant harm, higher autonomy or broader impact; strong controls/human oversight; Strict Controls |
| R4 | Critical | Severe safety/rights/societal harm; typically restricted/prohibited without exceptional justification; Highest Controls |

The source says to reassess after capabilities, permissions, context or intended-use changes. It does not define measurable thresholds, classification procedure, assessor authority, treatment of multiple contexts, evidence sufficiency, exceptional-justification approval or how matrix guidance overrides domain duties. “Formal verification”, “continuous” human oversight and “typically prohibited” deployment are undefined control bands, not independently testable rules. R0 “Not required” human oversight cannot establish an exemption from every Human Authority obligation.

Decision: preserve the existing informative concept and vocabulary unchanged; do not use R-levels to determine normative applicability in the first candidate set. All candidate risk_levels arrays are empty, explicitly meaning no risk-based applicability rule assigned, not universal R0 compliance. Q02 must resolve these ambiguities before risk-dependent normative requirements can be authored/adopted. The objective change-review trigger informs candidate 0005; it does not introduce an automatic classifier or reassessment score.
