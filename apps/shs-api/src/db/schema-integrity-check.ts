import { pool } from "./client.js";
import { checkCriticalSchemaIntegrity } from "./schema-integrity.js";
import { checkExhaustiveSchemaIntegrity } from "./exhaustive-schema-integrity.js";

const strict = process.argv.includes("--strict");

try {
  if (strict) {
    const result = await checkExhaustiveSchemaIntegrity(pool);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } else {
    const failures = await checkCriticalSchemaIntegrity(pool);
    if (failures.length) {
      console.error(JSON.stringify({ ok: false, failures }, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ ok: true, failures: [] }, null, 2));
    }
  }
} finally {
  await pool.end();
}
