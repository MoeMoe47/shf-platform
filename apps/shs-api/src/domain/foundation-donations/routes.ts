import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { consumeRateLimit } from "../../security/rate-limit.js";
import { emitOperationalTelemetry } from "../../observability/operational-telemetry.js";
import { DonationError } from "./model.js";
import { PostgresDonationRepository } from "./repo.js";
import { DonationService } from "./service.js";
import {
  donationStripeConfig,
  StripeDonationProvider,
} from "./stripe-provider.js";

const base = "/foundation/donations";
type Handler = (req: Request, res: Response) => Promise<unknown>;
function handle(action: Handler) {
  return async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    try {
      await action(req, res);
    } catch (error) {
      const status = error instanceof DonationError ? error.statusCode : 503;
      const code =
        error instanceof DonationError
          ? error.code
          : "donation_service_unavailable";
      emitOperationalTelemetry({
        event_name: "foundation_donation_request_failed",
        severity: status >= 500 ? "ERROR" : "WARNING",
        component: "shs_api",
        category: "PUBLIC_READ",
        outcome: status >= 500 ? "SYSTEM_FAILURE" : "EXPECTED_DOMAIN_REJECTION",
        metadata: { status_code: status, reason: code },
      });
      res.status(status).json({ error: code });
    }
  };
}
/** Register BEFORE global JSON/auth middleware; exact routes only. No auth bypass for other APIs. */
export function registerDonationRoutes(
  app: Express,
  supplied?: DonationService,
  suppliedLimiter?: Handler,
) {
  const config = donationStripeConfig();
  const service =
    supplied ||
    new DonationService(
      new PostgresDonationRepository(),
      config ? new StripeDonationProvider(config) : null,
    );
  const limited = (action: Handler) =>
    handle(async (req, res) => {
      if (suppliedLimiter) {
        await suppliedLimiter(req, res);
        if (res.headersSent) return;
      } else {
        const decision = await consumeRateLimit(
          "PUBLIC_READ_LIMIT",
          `shf-donation:${req.ip || req.socket.remoteAddress || "unknown"}`,
        );
        if (!decision.allowed) {
          res.setHeader("Retry-After", String(decision.retryAfterSeconds));
          res.status(429).json({ error: "rate_limited" });
          return;
        }
      }
      return action(req, res);
    });
  // Stripe retries on 5xx. It uses signature authentication, not donor sessions
  // or the public initiation rate bucket shared by anonymous visitors.
  app.post(
    `${base}/webhook`,
    express.raw({ type: "application/json", limit: "256kb" }),
    handle(async (req, res) => {
      res.json(
        await service.webhook(req.body, req.get("stripe-signature") || ""),
      );
    }),
  );
  app.post(
    `${base}/checkout`,
    express.json({ limit: "2kb" }),
    limited(async (req, res) => {
      res
        .status(200)
        .json(
          await service.checkout(req.body, req.get("Idempotency-Key") || ""),
        );
    }),
  );
  app.get(
    `${base}/:reference/status`,
    limited(async (req, res) => {
      res.json(await service.status(String(req.params.reference)));
    }),
  );
  app.use(
    base,
    (error: any, _req: Request, res: Response, next: NextFunction) => {
      if (!error) return next();
      res
        .status(error.type === "entity.too.large" ? 413 : 400)
        .json({ error: "invalid_donation_request" });
    },
  );
}
