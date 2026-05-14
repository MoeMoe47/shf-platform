import { Router } from "express";
import { getAggregatedEntity } from "../controllers/entities.controller";

const router = Router();

router.get("/entities/:entityId", getAggregatedEntity);

export default router;
