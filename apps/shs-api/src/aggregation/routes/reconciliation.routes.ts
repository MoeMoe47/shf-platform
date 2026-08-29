import { Router } from "express";
import { getReconciliationForEntity } from "../controllers/reconciliation.controller.js";

const router = Router();

router.get("/reconciliation/:entityId", getReconciliationForEntity);

export default router;
