import { Router } from "express";
import { getVerificationForEntity } from "../controllers/verification.controller";

const router = Router();

router.get("/verification/:entityId", getVerificationForEntity);

export default router;
