import { Router } from "express";
import * as projectController from "../controllers/projectController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validator } from "../middlewares/validateMiddleware.js";
import {
    createProjectSchema,
    projectIdParamSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(requireAuth);

router.get("/", projectController.list);
router.get("/:id", validator.params(projectIdParamSchema), projectController.getById);
router.post("/", validator.body(createProjectSchema), projectController.create);
router.delete("/:id", validator.params(projectIdParamSchema), projectController.remove);

export default router;
