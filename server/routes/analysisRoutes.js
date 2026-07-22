import { Router } from "express";
import * as analysisController from "../controllers/analysisController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validator } from "../middlewares/validateMiddleware.js";
import { idParamSchema } from "../validators/schemas.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /analyses/{id}/status:
 *   get:
 *     tags: [Analyses]
 *     summary: Avancement d'une analyse (polling)
 *     description: Endpoint léger interrogé en boucle par le frontend pour la barre de progression.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Avancement de l'analyse.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisStatus'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/status", validator.params(idParamSchema), analysisController.getStatus);

/**
 * @openapi
 * /analyses/{id}:
 *   get:
 *     tags: [Analyses]
 *     summary: Résultat complet d'une analyse
 *     description: Retourne l'analyse avec ses fichiers, leurs erreurs/corrections et le diagramme Mermaid.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Résultat complet de l'analyse.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisFull'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", validator.params(idParamSchema), analysisController.getResult);

export default router;
