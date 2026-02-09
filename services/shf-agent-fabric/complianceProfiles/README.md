# Compliance Profiles (Gate G Safe)

Downstream policies may ONLY RESTRICT. They may never loosen rules.

EffectiveCompliance = intersection(Global, Business, App)
Any downgrade attempt hard-fails CI/startup.

## Safe workflow
1) Start from Global.
2) Remove permissions you do not need (restrict allowlists).
3) Add restrictions if needed (expand restricted/prohibited/neverExecute).
4) Keep audit + consent protections enabled.
5) Regenerate the manifest and run CI.
