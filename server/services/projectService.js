import pool from "../db/pool.js";

/**
 * Liste les projets d'un utilisateur.
 * @param {number} userId
 * @returns {Promise<object[]>}
 */
export const listProjects = async (userId) => {
};

/**
 * Recherche un projet par son id.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findProjectById = async (id) => {
};

/**
 * Retourne l'id du propriétaire d'un projet (utilisé par requireOwnership).
 * @param {number} projectId
 * @returns {Promise<number|null>}
 */
export const findProjectOwnerId = async (projectId) => {
};

/**
 * Crée un projet pour un utilisateur à partir d'une URL de dépôt GitHub.
 * @param {object} projectData
 * @param {number} userId
 * @returns {Promise<object>}
 */
export const createProject = async (projectData, userId) => {
};

/**
 * Supprime un projet appartenant à un utilisateur.
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<number>}
 */
export const deleteProject = async (id, userId) => {
};
