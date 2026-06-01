import {
    create,
    getProgress,
    listByProjectId,
    getFullResult,
} from "../services/analysisService.js";
import { findProjectById } from "../services/projectService.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

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
        return res.status(404).json({ error: "Projet introuvable" });
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
        return res.status(404).json({ error: "Analyse introuvable" });
    }

    // Vérifie que l'analyse appartient bien à un projet de l'utilisateur.
    const project = await findProjectById(progress.project_id, req.session.userId);
    if (!project) {
        return res.status(404).json({ error: "Analyse introuvable" });
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
        return res.status(404).json({ error: "Analyse introuvable" });
    }

    // Vérifie que l'analyse appartient bien à un projet de l'utilisateur.
    const project = await findProjectById(analysis.project_id, req.session.userId);
    if (!project) {
        return res.status(404).json({ error: "Analyse introuvable" });
    }

    res.json(analysis);
});

/**
 * Liste les analyses d'un projet (route imbriquée /projects/:id/analyses).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const list = asyncHandler(async (req, res) => {
    // L'id du projet vient de l'URL ; on vérifie qu'il appartient à l'utilisateur.
    const project = await findProjectById(req.params.id, req.session.userId);
    if (!project) {
        return res.status(404).json({ error: "Projet introuvable" });
    }

    const analyses = await listByProjectId(req.params.id);
    res.json(analyses);
});
