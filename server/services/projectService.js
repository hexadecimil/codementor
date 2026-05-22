import pool from "../db/pool.js";

/**
 * Liste les projets d'un utilisateur.
 * @param {number} userId
 * @returns {Promise<object[]>}
 */
export const listProjects = async (userId) => {
    const [rows] = await pool.query(
        `SELECT pk_project AS id, fk_user AS user_id, github_repo_url, created_at
         FROM t_project
         WHERE fk_user = ?
         ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
};

/**
 * Recherche un projet par son id (scopé à l'utilisateur).
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
export const findProjectById = async (id, userId) => {
    const [rows] = await pool.query(
        `SELECT pk_project AS id, fk_user AS user_id, github_repo_url, created_at
         FROM t_project
         WHERE pk_project = ? AND fk_user = ?`,
        [id, userId]
    );
    return rows[0] ?? null;
};

/**
 * Crée un projet pour un utilisateur à partir d'une URL de dépôt GitHub.
 * @param {object} projectData
 * @param {number} userId
 * @returns {Promise<object>}
 */
export const createProject = async (projectData, userId) => {
    const { github_repo_url } = projectData;

    const [result] = await pool.query(
        `INSERT INTO t_project (fk_user, github_repo_url) VALUES (?, ?)`,
        [userId, github_repo_url]
    );

    return findProjectById(result.insertId, userId);
};

/**
 * Supprime un projet appartenant à un utilisateur.
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<number>} Nombre de lignes supprimées (0 si rien)
 */
export const deleteProject = async (id, userId) => {
    const [result] = await pool.query(
        `DELETE FROM t_project WHERE pk_project = ? AND fk_user = ?`,
        [id, userId]
    );
    return result.affectedRows;
};
