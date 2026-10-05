# Importer Operating Procedure

## Build and inspect

From the repository root, regenerate the static manifest and matrix from the audit inventory and frozen Design-2 mapping:

```sh
npx tsx apps/shs-api/scripts/build-commercial-product-onboarding-manifest.mjs
```

Review the JSON and matrix, then run the default dry-run against the explicitly configured disposable database and an audit actor with organization context:

```sh
DATABASE_URL="$DISPOSABLE_DATABASE_URL" \
CPR_ONBOARDING_ORGANIZATION_ID="$TEST_ORGANIZATION_ID" \
CPR_ONBOARDING_USER_ID="$TEST_USER_ID" \
npx tsx apps/shs-api/scripts/commercial-product-registry-onboard.mjs
```

Dry-run validates every candidate and reports existing identity conflicts. It performs reads only. Candidates are passed to create only when `registration_allowed` is true. A REVIEW_REQUIRED candidate may be registered in lifecycle REVIEW with all review gates unresolved; registration is not approval.

## Apply

Apply requires the explicit `--apply` switch and `SHS_ONBOARDING_TARGET=disposable`. The CLI refuses any other target in this phase. It uses a service actor with the Product Registry capabilities needed for the explicit onboarding operator operation. Production execution is neither enabled nor performed.

```sh
SHS_ONBOARDING_TARGET=disposable \
DATABASE_URL="$DISPOSABLE_DATABASE_URL" \
CPR_ONBOARDING_ORGANIZATION_ID="$TEST_ORGANIZATION_ID" \
CPR_ONBOARDING_USER_ID="$TEST_USER_ID" \
npx tsx apps/shs-api/scripts/commercial-product-registry-onboard.mjs --apply
```

## Idempotency and recovery

The importer compares existing core identity and governed state. Different existing values stop that candidate with CONFLICT. Matching partial records are reconciled by adding only missing source, buyer, form, gate, funding, and metadata rows through service methods. An interrupted run can be rerun against the same manifest. It never updates a materially different product.

Each service mutation writes to canonical `audit_events`. Review-gate `reviewed_at` stays null unless the input contains an actual review time. No competing onboarding audit table is created.

Rollback in acceptance is disposal of the isolated database. No production rollback or delete path is provided by the onboarding CLI. Production execution would require a separate authorization and reviewed rollback procedure.
