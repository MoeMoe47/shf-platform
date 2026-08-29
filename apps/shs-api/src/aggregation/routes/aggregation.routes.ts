import { Router } from "express";
import { requirePermission } from "../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions.js";
import { getAggregationPipeline } from "../controllers/aggregation.controller.js";
import entitiesRoutes from "./entities.routes.js";
import verificationRoutes from "./verification.routes.js";
import reconciliationRoutes from "./reconciliation.routes.js";

const router = Router();

router.use(requirePermission(SHS_SECURITY_PERMISSIONS.AGGREGATION_VIEW));

router.get("/pipeline/:entityId", getAggregationPipeline);

router.use(entitiesRoutes);
router.use(verificationRoutes);
router.use(reconciliationRoutes);

export default router;
