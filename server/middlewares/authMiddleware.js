import { findProjectOwnerId } from "../services/projectService.js";

/**
 * Vérifie qu'une session utilisateur est active (OAuth GitHub).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireAuth = (req, res, next) => {
};

/**
 * Vérifie que l'utilisateur connecté est propriétaire du projet ciblé.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const requireOwnership = async (req, res, next) => {
};
