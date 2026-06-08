import pool from "../db/pool.js";
import { AppError } from "../utils/AppError.js";
import { parseRepoUrl } from "./githubService.js";

// Dérive le nom du dépôt ("repo") depuis l'URL ; retourne l'URL si le parsing échoue.
const safeRepoName = (repoUrl) => {
  try {
    return parseRepoUrl(repoUrl).repo;
  } catch {
    return repoUrl;
  }
};

/**
 * Liste les projets d'un utilisateur, avec le nom du dépôt et le nombre d'analyses.
 * @param {number} userId
 * @returns {Promise<object[]>}
 */
export const listProjects = async (userId) => {
  const [rows] = await pool.query(
    `SELECT pk_project AS id, fk_user AS user_id, github_repo_url, created_at,
                (SELECT COUNT(*) FROM t_analysis WHERE fk_project = pk_project) AS analysis_count
         FROM t_project
         WHERE fk_user = ?
         ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({ ...row, name: safeRepoName(row.github_repo_url) }));
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
    [id, userId],
  );
  if (!rows[0]) return null;
  return { ...rows[0], name: safeRepoName(rows[0].github_repo_url) };
};

/**
 * Crée un projet pour un utilisateur à partir d'une URL de dépôt GitHub.
 * @param {object} projectData
 * @param {number} userId
 * @returns {Promise<object>}
 */
export const createProject = async (projectData, userId) => {
  const { github_repo_url } = projectData;

  try {
    const [result] = await pool.query(`INSERT INTO t_project (fk_user, github_repo_url) VALUES (?, ?)`, [
      userId,
      github_repo_url,
    ]);

    // Un projet neuf a 0 analyse : on complète analysis_count pour que la réponse
    // corresponde au schéma Project (comme les éléments de listProjects).
    const project = await findProjectById(result.insertId, userId);
    return { ...project, analysis_count: 0 };
  } catch (err) {
    // Violation de la contrainte uk_user_repo : le projet existe déjà.
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError("Projet déjà enregistré", 409);
    }
    throw err;
  }
};

/**
 * Indique si un projet a une analyse en cours (queued ou running).
 * @param {number} projectId
 * @returns {Promise<boolean>}
 */
export const hasActiveAnalysis = async (projectId) => {
  const [rows] = await pool.query(
    `SELECT 1 FROM t_analysis
         WHERE fk_project = ? AND status IN ('queued', 'running')
         LIMIT 1`,
    [projectId],
  );
  return rows.length > 0;
};

/**
 * Supprime un projet appartenant à un utilisateur.
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<number>} Nombre de lignes supprimées (0 si rien)
 */
export const deleteProject = async (id, userId) => {
  const [result] = await pool.query(`DELETE FROM t_project WHERE pk_project = ? AND fk_user = ?`, [id, userId]);
  return result.affectedRows;
};
