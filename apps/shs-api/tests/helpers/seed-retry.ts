// Test-only helper. Several security/integration test files independently
// seed the same small set of well-known, cross-file-shared fixture users
// (user_admin_001, user_instructor_001, etc.) via
// `INSERT ... ON CONFLICT (user_id) DO NOTHING`. That arbiter only
// protects against a user_id collision; the `users` table also has a
// UNIQUE(organization_id, email) constraint. On a brand-new, never-before
// -seeded database, two test files' before() hooks racing to insert the
// identical row for the first time can — in a rare Postgres interleaving —
// raise a real 23505 unique_violation on that second constraint before
// either transaction commits, even though both are inserting the exact
// same values. A retry is correct here: by the second attempt, whichever
// transaction won has committed, so the retried INSERT's own
// ON CONFLICT (user_id) DO NOTHING sees the row and is a clean no-op.
export async function withSeedRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.code !== "23505" || attempt >= attempts) throw error;
    }
  }
}
