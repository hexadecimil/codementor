import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   get:
 *     tags: [Auth]
 *     summary: Démarre la connexion OAuth GitHub
 *     description: Redirige (302) vers la page d'autorisation GitHub. À ouvrir dans le navigateur, pas via fetch.
 *     security: []
 *     responses:
 *       302:
 *         description: Redirection vers GitHub.
 */
router.get("/login", authController.login);

/**
 * @openapi
 * /api/auth/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback OAuth GitHub
 *     description: Échange le code contre un token, crée/met à jour l'utilisateur, ouvre la session, puis redirige vers le frontend.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code d'autorisation renvoyé par GitHub.
 *     responses:
 *       302:
 *         description: Redirection vers le frontend après ouverture de session.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/callback", authController.callback);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Déconnexion
 *     description: Détruit la session courante et supprime le cookie.
 *     security: []
 *     responses:
 *       200:
 *         description: Session détruite.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Utilisateur courant
 *     description: Retourne l'utilisateur de la session (le token GitHub est exclu de la réponse).
 *     responses:
 *       200:
 *         description: L'utilisateur connecté.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/me", requireAuth, authController.getCurrentUser);

export default router;
