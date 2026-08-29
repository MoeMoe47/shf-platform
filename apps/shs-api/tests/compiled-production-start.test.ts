import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import test from "node:test";

const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("free_port_unavailable")));
        return;
      }
      const port = address.port;
      server.close(() => resolve(port));
    });
  });
}

function waitForExit(child: ReturnType<typeof spawn>, timeoutMs: number): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("process_exit_timeout")), timeoutMs);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });
}

async function waitForHealth(baseUrl: string, child: ReturnType<typeof spawn>, stderr: () => string): Promise<Response> {
  const deadline = Date.now() + 10_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`compiled_api_exited_early:${child.exitCode}:${stderr()}`);
    }

    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return response;
      lastError = new Error(`health_status_${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`health_timeout:${String(lastError)}:${stderr()}`);
}

test("compiled production artifact starts with npm start and serves health", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for compiled production start verification",
  timeout: 30_000,
}, async (t) => {
  const build = spawn("npm", ["run", "build"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buildOutput = "";
  build.stdout?.on("data", (chunk) => { buildOutput += String(chunk); });
  build.stderr?.on("data", (chunk) => { buildOutput += String(chunk); });
  const buildCode = await waitForExit(build, 20_000);
  assert.equal(buildCode, 0, buildOutput);

  const port = await freePort();
  assert.notEqual(port, 8091);

  const child = spawn("npm", ["start"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      AUTH0_AUDIENCE: "shs-api",
      AUTH0_ISSUER: "https://auth.example.test/",
      AUTH_ALLOWED_ORIGINS: `http://127.0.0.1:${port}`,
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: "production",
      PORT: String(port),
      SHS_AUTH_ENV: "production",
      SHS_IDENTITY_PROVIDER: "auth0",
      SHS_IDENTITY_PROVIDER_AUDIENCE: "shs-api",
      SHS_MONITOR_BACKLOG_MAX_OLDEST_AGE_SECONDS: "3600",
      SHS_MONITOR_BACKLOG_MAX_PENDING: "1000",
      SHS_MONITOR_BACKLOG_NO_SUCCESS_AGE_SECONDS: "3600",
      SHS_MONITOR_QUARANTINE_DELTA_THRESHOLD: "100",
      SHS_RATE_LIMIT_AUTHENTICATED_USER_MAX: "300",
      SHS_RATE_LIMIT_AUTHENTICATED_USER_WINDOW_SECONDS: "60",
      SHS_RATE_LIMIT_AUTH_LOGIN_MAX: "300",
      SHS_RATE_LIMIT_AUTH_LOGIN_WINDOW_SECONDS: "60",
      SHS_RATE_LIMIT_EXPENSIVE_OPERATION_MAX: "300",
      SHS_RATE_LIMIT_EXPENSIVE_OPERATION_WINDOW_SECONDS: "60",
      SHS_RATE_LIMIT_GOVERNANCE_MUTATION_MAX: "300",
      SHS_RATE_LIMIT_GOVERNANCE_MUTATION_WINDOW_SECONDS: "60",
      SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX: "300",
      SHS_RATE_LIMIT_INTERNAL_INGESTION_WINDOW_SECONDS: "60",
      SHS_RATE_LIMIT_PUBLIC_READ_MAX: "300",
      SHS_RATE_LIMIT_PUBLIC_READ_WINDOW_SECONDS: "60",
      SHS_SESSION_SECRET_REF: "secret://compiled-start-test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
  child.stdout?.resume();
  const getStderr = () => stderr.slice(-4_000);

  t.after(async () => {
    if (child.exitCode === null && !child.killed) {
      child.kill("SIGTERM");
      await waitForExit(child, 5_000).catch(() => {
        child.kill("SIGKILL");
      });
    }
  });

  const response = await waitForHealth(`http://127.0.0.1:${port}`, child, getStderr);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "shs-api");

  child.kill("SIGTERM");
  const exitCode = await waitForExit(child, 5_000);
  assert.ok(exitCode === 0 || exitCode === null, `unexpected exit code ${exitCode}: ${getStderr()}`);
});
