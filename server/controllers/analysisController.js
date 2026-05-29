import {
    create,
    findById,
    listByProjectId,
    getFullResult,
} from "../services/analysisService.js";
import { findProjectById } from "../services/projectService.js";

/**
 * Démarre une nouvelle analyse pour un projet et la place en file d'attente.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const start = async (req, res) => {
    const analysis = await create(req.body.project_id, req.session.userId);

    // create renvoie null si le projet n'appartient pas à l'utilisateur.
    if (!analysis) {
        return res.status(404).json({ error: "Projet introuvable" });
    }

    res.status(201).json(analysis);
};

/**
 * Retourne le statut courant d'une analyse (polling).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getStatus = async (req, res) => {
    const analysis = await findById(req.params.id);

    if (!analysis) {
        return res.status(404).json({ error: "Analyse introuvable" });
    }

    // Vérifie que l'analyse appartient bien à un projet de l'utilisateur.
    const project = await findProjectById(analysis.project_id, req.session.userId);
    if (!project) {
        return res.status(404).json({ error: "Analyse introuvable" });
    }

    res.json(analysis);
};

/**
 * Retourne le résultat complet d'une analyse (fichiers, erreurs/fixes, mermaid).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getResult = async (req, res) => {
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
};

/**
 * Liste les analyses d'un projet (route imbriquée /projects/:id/analyses).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const list = async (req, res) => {
    // L'id du projet vient de l'URL ; on vérifie qu'il appartient à l'utilisateur.
    const project = await findProjectById(req.params.id, req.session.userId);
    if (!project) {
        return res.status(404).json({ error: "Projet introuvable" });
    }

    const analyses = await listByProjectId(req.params.id);
    res.json(analyses);
};
