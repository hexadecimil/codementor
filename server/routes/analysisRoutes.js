import { Router } from "express";
import * as analysisController from "../controllers/analysisController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validator } from "../middlewares/validateMiddleware.js";
import { startAnalysisSchema, projectIdParamSchema } from "../validators/schemas.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/analyses:
 *   post:
 *     tags: [Analyses]
 *     summary: Démarre une analyse pour un projet
 *     description: Crée une analyse en statut "queued" et la place dans la file d'attente. Répond immédiatement, l'analyse tourne en arrière-plan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project_id]
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Analyse créée et mise en file.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analysis'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", validator.body(startAnalysisSchema), analysisController.start);

/**
 * @openapi
 * /api/analyses/{id}/status:
 *   get:
 *     tags: [Analyses]
 *     summary: Statut courant d'une analyse (polling)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statut de l'analyse.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analysis'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/status", validator.params(projectIdParamSchema), analysisController.getStatus);

/**
 * @openapi
 * /api/analyses/{id}:
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
router.get("/:id", validator.params(projectIdParamSchema), analysisController.getResult);

export default router;
