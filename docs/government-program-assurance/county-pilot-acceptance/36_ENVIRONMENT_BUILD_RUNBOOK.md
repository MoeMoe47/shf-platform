# Environment Build Runbook

Execute only after external prerequisites are approved:

1. Create a traceable county delta branch from the frozen tag.
2. Verify frozen tag and migration `105`.
3. Configure isolated development environment.
4. Configure canonical county Organization/Tenant.
5. Enable GPA entitlement through existing authority.
6. Configure approved users and roles.
7. Verify authentication and MFA.
8. Configure isolated UAT environment.
9. Load only synthetic validation fixture.
10. Run security and least-privilege acceptance.
11. Approve the environment for source connector onboarding.

Each step requires evidence and an owner. Do not execute real-input steps during Phase 1 preparation.
