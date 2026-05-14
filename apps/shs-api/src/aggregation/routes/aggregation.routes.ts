import { Router } from "express";
import { getAggregationPipeline } from "../controllers/aggregation.controller";
import entitiesRoutes from "./entities.routes";
import verificationRoutes from "./verification.routes";
import reconciliationRoutes from "./reconciliation.routes";

const router = Router();

router.get("/pipeline/:entityId", getAggregationPipeline);

router.use(entitiesRoutes);
router.use(verificationRoutes);
router.use(reconciliationRoutes);

export default router;
