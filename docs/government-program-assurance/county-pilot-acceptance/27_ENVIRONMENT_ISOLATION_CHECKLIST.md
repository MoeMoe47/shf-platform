# Environment Isolation Checklist

| Control | Required evidence | Status |
|---|---|---|
| Separate database boundary | Environment database references | NOT_STARTED |
| Separate secret references | Secret-store inventory | NOT_STARTED |
| Separate configuration | Environment config review | NOT_STARTED |
| Fixture contamination prevented | Fixture/data-boundary test | READY_INTERNAL |
| UAT credentials not reused in production | Credential review | NOT_STARTED |
| Production data absent from development | Data scan | READY_INTERNAL |
| Logging separated and attributable | Log destination review | NOT_STARTED |
| Report/export classification enforced | Artifact review | READY_INTERNAL |
| Public endpoint disabled until approved | Route/config test | READY_INTERNAL |
| AI context environment-scoped | AI security test | READY_INTERNAL |
| Rollback path | Runbook and owner | NOT_STARTED |
