import pkg from "pg";

const { Pool } = pkg;

const runtimeEnvironment = String(process.env.SHS_AUTH_ENV || process.env.NODE_ENV || "development")
  .trim()
  .toLowerCase();
const connectionString = process.env.DATABASE_URL ||
  (runtimeEnvironment === "production" ? "" : "postgres://localhost:5432/shs_dev");

if (runtimeEnvironment === "production" && !connectionString) {
  throw new Error("DATABASE_URL is required in production");
}

export const pool = new Pool({
  connectionString,
});

export async function query(sql: string, params: unknown[] = []) {
  return pool.query(sql, params);
}
