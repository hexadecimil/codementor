import { Router } from "express";
import * as analysisController from "../controllers/analysisController.js";
import { requireAuth, requireOwnership } from "../middlewares/authMiddleware.js";
import { validator } from "../middlewares/validateMiddleware.js";
import { startAnalysisSchema } from "../validators/schemas.js";

const router = Router();

router.use(requireAuth);

router.post(
    "/",
    validator.body(startAnalysisSchema),
    requireOwnership,
    analysisController.start
);
router.get("/:id/status", analysisController.getStatus);
router.get("/:id", analysisController.getResult);

export default router;
