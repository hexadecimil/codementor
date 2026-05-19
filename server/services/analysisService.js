import pool from "../db/pool.js";
import { fetchRepoTree, fetchFileContent, filterRelevantFiles } from "./githubService.js";
import { analyzeFile, generateMermaid } from "./openRouterService.js";
import { enqueue } from "./queueService.js";

/**
 * Crée une nouvelle analyse (statut "queued") pour un projet et l'ajoute à la file.
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<object>}
 */
export const create = async (projectId, userId) => {
};

/**
 * Exécute l'analyse complète : fetch repo, analyse chaque fichier via le LLM,
 * persiste les résultats, génère le diagramme Mermaid, met à jour le statut.
 * @param {number} analysisId
 * @returns {Promise<void>}
 */
export const run = async (analysisId) => {
};

/**
 * Recherche une analyse par son id.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findById = async (id) => {
};

/**
 * Liste les analyses d'un projet.
 * @param {number} projectId
 * @returns {Promise<object[]>}
 */
export const listByProjectId = async (projectId) => {
};

/**
 * Retourne l'analyse complète avec ses fichiers et erreurs/fixes via jointures.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getFullResult = async (id) => {
};

/**
 * Met à jour le statut d'une analyse (queued/running/completed/failed) et
 * éventuellement des champs additionnels (error_message, mermaid_diagram...).
 * @param {number} id
 * @param {string} status
 * @param {object} [extras]
 * @returns {Promise<void>}
 */
export const updateStatus = async (id, status, extras = {}) => {
};
