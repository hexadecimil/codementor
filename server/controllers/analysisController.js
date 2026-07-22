import { create, getProgress, getFullResult } from "../services/analysisService.js";
import { findProjectById } from "../services/projectService.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Démarre une nouvelle analyse pour un projet (route imbriquée /projects/:id/analyses)
 * et la place en file d'attente. Répond immédiatement (202), le traitement est asynchrone.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const start = asyncHandler(async (req, res) => {
  const analysis = await create(req.params.id, req.session.userId);

  // create renvoie null si le projet n'appartient pas à l'utilisateur.
  if (!analysis) {
    throw new AppError("Projet introuvable", 404);
  }

  res.status(202).json(analysis);
});

/**
 * Retourne l'avancement léger d'une analyse (polling du frontend).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getStatus = asyncHandler(async (req, res) => {
  const progress = await getProgress(req.params.id);

  if (!progress) {
    throw new AppError("Analyse introuvable", 404);
  }

  // Vérifie que l'analyse appartient bien à un projet de l'utilisateur.
  const project = await findProjectById(progress.project_id, req.session.userId);
  if (!project) {
    throw new AppError("Analyse introuvable", 404);
  }

  res.json(progress);
});

/**
 * Retourne le résultat complet d'une analyse (fichiers, erreurs/fixes, mermaid).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getResult = asyncHandler(async (req, res) => {
  const analysis = await getFullResult(req.params.id);

  if (!analysis) {
    throw new AppError("Analyse introuvable", 404);
  }

  // Vérifie que l'analyse appartient bien à un projet de l'utilisateur.
  const project = await findProjectById(analysis.project_id, req.session.userId);
  if (!project) {
    throw new AppError("Analyse introuvable", 404);
  }

  res.json(analysis);
});
