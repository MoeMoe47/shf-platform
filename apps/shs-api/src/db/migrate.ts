import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client.js";
import { baselineMigrations, checkSchemaReadiness, discoverMigrations, inspectMigrations, runMigrations } from "./migration-runner.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(root, "../../migrations");

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for migration commands");
}

function printStatus(status: Awaited<ReturnType<typeof inspectMigrations>>) {
  console.log(JSON.stringify({
    applied: status.applied.map(({ id, filename }) => ({ id, filename })),
    pending: status.pending.map(({ id, filename }) => ({ id, filename })),
    drift: status.drift,
    unknownApplied: status.unknownApplied,
  }, null, 2));
}

const [command = "status", ...args] = process.argv.slice(2);
requireDatabaseUrl();
const migrations = await discoverMigrations(migrationsDir);

try {
  if (command === "status" || command === "plan") {
    const status = await inspectMigrations(pool, migrations);
    printStatus(status);
  } else if (command === "up") {
    const client = await pool.connect();
    try {
      printStatus(await runMigrations(client, migrations));
    } finally {
      client.release();
    }
  } else if (command === "baseline") {
    if (args[0] !== "--confirm") throw new Error("baseline requires --confirm and explicit migration IDs");
    const ids = args.slice(1).filter((arg) => /^\d{3,}$/.test(arg));
    const force = args.includes("--force");
    const client = await pool.connect();
    try {
      printStatus(await baselineMigrations(client, migrations, ids, { force }));
    } finally {
      client.release();
    }
  } else {
    throw new Error(`unknown migration command: ${command}`);
  }
} finally {
  await pool.end();
}
