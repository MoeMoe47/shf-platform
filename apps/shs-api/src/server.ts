import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { buildRouter } from "./api/router.js";
import { authMiddleware } from "./auth/auth-middleware.js";
import { errorHandler } from "./api/error-handler.js";
import { assertProductionIdentityProviderConfigured } from "./auth/production-identity.js";
import { assertProductionRateLimitConfigured, rateLimitMiddleware } from "./security/rate-limit.js";
import { assertPr1ProductionSecurityConfigured } from "./security/pr1-production-security-readiness.js";
import { operationalMonitoringThresholds } from "./observability/operational-telemetry.js";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 8091);

// Fail before binding a production port while the only SHS identity source
// is the development fixture repository.
assertProductionIdentityProviderConfigured();
assertProductionRateLimitConfigured();
assertPr1ProductionSecurityConfigured();
operationalMonitoringThresholds();

const runtimeEnvironment = String(process.env.SHS_AUTH_ENV || process.env.NODE_ENV || "development")
  .trim()
  .toLowerCase();
const allowedOrigins = String(process.env.AUTH_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (runtimeEnvironment === "production" && allowedOrigins.length === 0) {
  throw new Error("AUTH_ALLOWED_ORIGINS is required in production");
}

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Development remains permissive for local tooling; production requires
    // an explicit origin allowlist and never reflects arbitrary origins.
    if (runtimeEnvironment !== "production" || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("cors_origin_not_allowed"));
  },
}));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(express.json());
app.use((req: any, res: any, next: any) => {
  const requestId = String(req.headers["x-request-id"] || randomUUID()).trim();
  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
});
app.use(authMiddleware);
app.use(rateLimitMiddleware());

buildRouter(app);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SHS API running on http://localhost:${PORT}`);
});
