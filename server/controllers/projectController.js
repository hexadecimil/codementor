import {
    listProjects,
    findProjectById,
    createProject,
    deleteProject,
} from "../services/projectService.js";
import { checkRepoAccess } from "../services/githubService.js";

/**
 * Retourne tous les projets de l'utilisateur connecté.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const list = async (req, res) => {
    const projects = await listProjects(req.session.userId);
    res.json(projects);
};

/**
 * Retourne un projet par son id (si appartenant à l'utilisateur).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getById = async (req, res) => {
    const project = await findProjectById(req.params.id, req.session.userId);

    if (!project) {
        return res.status(404).json({ error: "Projet introuvable" });
    }

    res.json(project);
};

/**
 * Crée un projet pour l'utilisateur connecté à partir d'une URL de dépôt GitHub.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const create = async (req, res) => {
    const hasAccess = await checkRepoAccess(req.body.github_repo_url, req.session.githubToken);

    if (!hasAccess) {
        return res.status(403).json({ error: "Dépôt inaccessible ou inexistant" });
    }

    const project = await createProject(req.body, req.session.userId);
    res.status(201).json(project);
};

/**
 * Supprime un projet appartenant à l'utilisateur.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const remove = async (req, res) => {
    const affectedRows = await deleteProject(req.params.id, req.session.userId);

    if (affectedRows === 0) {
        return res.status(404).json({ error: "Projet introuvable" });
    }

    res.status(204).end();
};