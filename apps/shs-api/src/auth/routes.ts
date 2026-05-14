import { Router } from "express";

const router = Router();

router.post("/login", async (_req, res) => {
  return res.status(501).json({ error: "Implement /auth/login" });
});

router.post("/logout", async (_req, res) => {
  return res.status(501).json({ error: "Implement /auth/logout" });
});

router.get("/me", async (_req, res) => {
  return res.status(501).json({
    error: "Implement /auth/me",
    user: null,
    memberships: [],
    permissions: [],
  });
});

router.post("/request-password-reset", async (_req, res) => {
  return res.status(501).json({ error: "Implement /auth/request-password-reset" });
});

router.post("/reset-password", async (_req, res) => {
  return res.status(501).json({ error: "Implement /auth/reset-password" });
});

export default router;
