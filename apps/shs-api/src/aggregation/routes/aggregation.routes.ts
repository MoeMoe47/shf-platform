import { Router } from "express";
import { requirePermission } from "../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../auth/security-permissions";
import { getAggregationPipeline } from "../controllers/aggregation.controller";
import entitiesRoutes from "./entities.routes";
import verificationRoutes from "./verification.routes";
import reconciliationRoutes from "./reconciliation.routes";

const router = Router();

router.use(requirePermission(SHS_SECURITY_PERMISSIONS.AGGREGATION_VIEW));

router.get("/pipeline/:entityId", getAggregationPipeline);

router.use(entitiesRoutes);
router.use(verificationRoutes);
router.use(reconciliationRoutes);

export default router;
