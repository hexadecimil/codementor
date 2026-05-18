import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/login", authController.login);
router.get("/callback", authController.callback);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getCurrentUser);

export default router;
