import { pool } from "./client";
import { lifecycleCleanup, lifecyclePlan, lifecycleStatus, retentionPolicy } from "./lifecycle-manager";

const [command = "status", flag] = process.argv.slice(2);
if (!(["status", "plan", "cleanup"].includes(command))) throw new Error(`unknown lifecycle command: ${command}`);
if (command === "cleanup" && flag !== "--confirm") throw new Error("lifecycle cleanup requires --confirm");

const policy = retentionPolicy();
try {
  const result = command === "status"
    ? await lifecycleStatus(pool, policy)
    : command === "plan"
      ? await lifecyclePlan(pool, policy)
      : await lifecycleCleanup(pool, policy);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}

