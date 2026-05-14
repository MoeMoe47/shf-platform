import { Router } from "express";

const router = Router();

router.post("/", async (_req, res) => {
  return res.status(501).json({ error: "Implement uploads POST /uploads" });
});

export default router;
