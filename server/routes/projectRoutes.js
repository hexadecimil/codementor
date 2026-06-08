import { Router } from "express";
import * as projectController from "../controllers/projectController.js";
import * as analysisController from "../controllers/analysisController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validator } from "../middlewares/validateMiddleware.js";
import { createProjectSchema, idParamSchema } from "../validators/schemas.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /projects:
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
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Récupère un projet, ses métadonnées GitHub et son historique d'analyses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Le projet demandé avec ses métadonnées GitHub et ses analyses.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectDetail'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", validator.params(idParamSchema), projectController.getById);

/**
 * @openapi
 * /projects:
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
 *         description: Accès au dépôt refusé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dépôt introuvable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Le projet existe déjà pour cet utilisateur.
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
 * /projects/{id}:
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
 *       409:
 *         description: Une analyse est en cours sur ce projet.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id", validator.params(idParamSchema), projectController.remove);

/**
 * @openapi
 * /projects/{id}/analyses:
 *   post:
 *     tags: [Projects]
 *     summary: Démarre une analyse pour un projet
 *     description: Crée une analyse en statut "queued", la place dans la file d'attente et répond immédiatement (202). Le traitement tourne en arrière-plan.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       202:
 *         description: Analyse acceptée et mise en file.
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
router.post("/:id/analyses", validator.params(idParamSchema), analysisController.start);

export default router;
