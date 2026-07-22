import { AppError } from "../utils/AppError.js";

/**
 * Vérifie qu'une session utilisateur est active (OAuth GitHub).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    throw new AppError("Non connecté", 401);
  }

  next();
};
