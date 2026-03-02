# Franklin County Allocation Intelligence — Methodology v1.0
Silicon Heartland Foundation (SHF) — Allocation Intelligence System

## 1. Purpose
The Franklin County Allocation Intelligence System supports evidence-based workforce and reentry funding decisions through transparent, data-driven allocation modeling.

The system evaluates how adjustments in funding distribution between program categories may impact:
- Employment outcomes
- Retention stability
- Earnings impact
- Recidivism exposure (modeled proxy)
- Cost efficiency per retained placement

The system does not replace policy authority. It provides analytical modeling to inform allocation strategy.

## 2. Geographic Scope
Primary focus: Franklin County, Ohio.

Where county-specific data is unavailable, Ohio statewide baselines are applied and clearly labeled as such.

## 3. Data Sources
The system utilizes publicly available performance benchmarks:

### 3.1 Workforce Outcomes
Source: Ohio WIOA Annual Performance Report (Program Year 2024), Ohio Department of Job and Family Services (ODJFS)

Key indicators:
- Employment Rate (2nd Quarter After Exit)
- Employment Rate (4th Quarter After Exit)
- Median Earnings (2nd Quarter After Exit)
- Credential Attainment Rate
- Participant Counts

### 3.2 Recidivism Baseline
Source: Ohio Department of Rehabilitation & Correction (ODRC) Recidivism Report (2022 or most recent)

Key indicators:
- Statewide Recidivism Rate
- Employment–Recidivism Differential (if available)
- Estimated Annual Incarceration Cost per Individual

Where correlation data is limited, conservative proxy modeling is applied and clearly identified as such.

### 3.3 Wage and Labor Market Benchmarks
Source: U.S. Bureau of Labor Statistics (BLS), Columbus, OH Metropolitan Statistical Area (MSA)

Key indicators:
- Median Hourly Wage
- Sector-Specific Median Wages (where applicable)
- Employment Growth Rate

## 4. Core Modeling Structure
The Allocation Intelligence engine evaluates funding reallocation between program categories (e.g., rapid placement vs certification-integrated recovery pathways). All calculations are transparent and formula-based.

### 4.1 Retained Placement Calculation
Retained Placements =
Participants × Employment Rate (Q2) × Retention Proxy (Q4 or 90-Day Equivalent)

### 4.2 Cost Per Retained Placement
Cost per Retained Placement =
Total Allocated Funding ÷ Retained Placements

### 4.3 12-Month Wage Impact (Modeled)
Annual Wage Impact =
Retained Placements × Median Hourly Wage × 40 Hours × 52 Weeks

### 4.4 Recidivism Reduction Proxy (Modeled)
Where available:
Modeled Recidivism Reduction =
Retained Employment Impact × Employment–Recidivism Differential

Where not available, conservative proportional modeling is applied. All recidivism modeling is labeled as projection, not guaranteed outcome.

## 5. Efficiency Index
The Efficiency Index (0–100) is a weighted composite based on:
- Cost Efficiency (Cost per Retained Placement)
- Wage Impact
- Retention Stability
- Recidivism Exposure Reduction (Modeled)

Weighting is fixed and documented in system configuration. The index is a comparative allocation optimization tool, not an absolute measure of program quality.

## 6. Allocation Simulation Logic
Reallocate X% of total funding from Program A to Program B.

The engine recalculates:
- Adjusted Retained Placements
- Adjusted Cost per Retained Placement
- Adjusted Wage Impact
- Adjusted Recidivism Exposure
- Adjusted Efficiency Index

Results are presented as deltas relative to baseline.

## 7. Transparency & Limitations
This system:
- Relies on publicly reported benchmark data
- Does not access individual-level participant records
- Does not make deterministic outcome guarantees
- Uses conservative assumptions where necessary
- Distinguishes actual data from projected impact

All source years and citations are displayed within the interface and report outputs.

## 8. Intended Use
Designed to:
- Inform budget allocation discussions
- Support evidence-based workforce strategy
- Assist policy evaluation conversations
- Enhance transparency in funding decision processes

Not intended to replace statutory authority, board governance, or fiscal oversight procedures.

## 9. Version Control & Governance
Methodology Version: 1.0  
Scope: Franklin County Pilot

Governance rule: Any change to modeling logic requires:
1) version increment
2) documented change log
3) updated report metadata
