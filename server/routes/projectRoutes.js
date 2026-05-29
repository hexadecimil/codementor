import { Router } from "express";
import * as projectController from "../controllers/projectController.js";
import * as analysisController from "../controllers/analysisController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validator } from "../middlewares/validateMiddleware.js";
import {
    createProjectSchema,
    projectIdParamSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: Liste les projets de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Liste des projets.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", projectController.list);

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Récupère un projet par son id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Le projet demandé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", validator.params(projectIdParamSchema), projectController.getById);

/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Crée un projet à partir d'une URL de dépôt GitHub
 *     description: Vérifie d'abord que l'utilisateur a accès au dépôt sur GitHub avant de créer.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [github_repo_url]
 *             properties:
 *               github_repo_url:
 *                 type: string
 *                 example: https://github.com/user/repo
 *     responses:
 *       201:
 *         description: Projet créé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Dépôt inaccessible ou inexistant.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", validator.body(createProjectSchema), projectController.create);

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Supprime un projet de l'utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Projet supprimé (pas de contenu).
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id", validator.params(projectIdParamSchema), projectController.remove);

/**
 * @openapi
 * /api/projects/{id}/analyses:
 *   get:
 *     tags: [Projects]
 *     summary: Liste les analyses d'un projet (les plus récentes d'abord)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historique des analyses du projet.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AnalysisSummary'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/analyses", validator.params(projectIdParamSchema), analysisController.list);

export default router;
