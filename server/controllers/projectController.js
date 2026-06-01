import {
    listProjects,
    findProjectById,
    createProject,
    deleteProject,
    hasActiveAnalysis,
} from "../services/projectService.js";
import { listByProjectId } from "../services/analysisService.js";
import { ensureRepoAccess, fetchRepoMetadata } from "../services/githubService.js";
import { getUserToken } from "../services/authService.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

/**
 * Retourne tous les projets de l'utilisateur connecté.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const list = asyncHandler(async (req, res) => {
    const projects = await listProjects(req.session.userId);
    res.json(projects);
});

/**
 * Retourne un projet avec ses métadonnées GitHub et son historique d'analyses.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getById = asyncHandler(async (req, res) => {
    const project = await findProjectById(req.params.id, req.session.userId);

    if (!project) {
        return res.status(404).json({ error: "Projet introuvable" });
    }

    const token = await getUserToken(req.session.userId);

    // Métadonnées GitHub en direct. Un token invalide (401) est propagé pour
    // forcer la reconnexion ; les autres erreurs (dépôt supprimé...) -> null.
    const github = await fetchRepoMetadata(project.github_repo_url, token).catch((err) => {
        if (err.statusCode === 401) throw err;
        return null;
    });
    const analyses = await listByProjectId(project.id);

    res.json({ ...project, github, analyses });
});

/**
 * Crée un projet pour l'utilisateur connecté à partir d'une URL de dépôt GitHub.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const create = asyncHandler(async (req, res) => {
    const token = await getUserToken(req.session.userId);

    // Lève 404 si le dépôt est introuvable, 403 si l'accès est refusé.
    await ensureRepoAccess(req.body.github_repo_url, token);

    // createProject lève une erreur 409 si le dépôt est déjà enregistré (uk_user_repo).
    const project = await createProject(req.body, req.session.userId);
    res.status(201).json(project);
});

/**
 * Supprime un projet appartenant à l'utilisateur (refusé si une analyse est en cours).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const remove = asyncHandler(async (req, res) => {
    const project = await findProjectById(req.params.id, req.session.userId);

    if (!project) {
        return res.status(404).json({ error: "Projet introuvable" });
    }

    if (await hasActiveAnalysis(project.id)) {
        return res.status(409).json({ error: "Une analyse est en cours sur ce projet" });
    }

    await deleteProject(project.id, req.session.userId);
    res.status(204).end();
});
