import {
    listProjects,
    findProjectById,
    createProject,
    deleteProject,
} from "../services/projectService.js";

/**
 * Retourne tous les projets de l'utilisateur connecté.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const list = async (req, res) => {
};

/**
 * Retourne un projet par son id (si appartenant à l'utilisateur).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getById = async (req, res) => {
};

/**
 * Crée un projet pour l'utilisateur connecté à partir d'une URL de dépôt GitHub.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const create = async (req, res) => {
};

/**
 * Supprime un projet appartenant à l'utilisateur.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const remove = async (req, res) => {
};
