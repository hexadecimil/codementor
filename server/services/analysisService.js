import pool from "../db/pool.js";
import {
    fetchRepoTree,
    fetchFileContent,
    filterRelevantFiles,
} from "./githubService.js";
import {
    explainCode,
    detectErrors,
    suggestFix,
} from "./openRouterService.js";
import { buildStructure, render as renderMermaid } from "./mermaidService.js";
import { enqueue } from "./queueService.js";

/**
 * Crée une nouvelle analyse (statut "queued") et l'enregistre.
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<object>}
 */
export const createAnalysis = async (projectId, userId) => {
};

/**
 * Recherche une analyse par son id.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findAnalysisById = async (id) => {
};

/**
 * Liste les analyses d'un projet.
 * @param {number} projectId
 * @returns {Promise<object[]>}
 */
export const findAnalysesByProjectId = async (projectId) => {
};

/**
 * Liste les fichiers analysés d'une analyse.
 * @param {number} analysisId
 * @returns {Promise<object[]>}
 */
export const findFilesByAnalysisId = async (analysisId) => {
};

/**
 * Liste les erreurs détectées dans un fichier analysé.
 * @param {number} fileId
 * @returns {Promise<object[]>}
 */
export const findErrorsByFileId = async (fileId) => {
};

/**
 * Retourne la correction proposée pour une erreur.
 * @param {number} errorId
 * @returns {Promise<object|null>}
 */
export const findFixByErrorId = async (errorId) => {
};

/**
 * Persiste une analyse.
 * @param {object} analysis
 * @returns {Promise<object>}
 */
export const saveAnalysis = async (analysis) => {
};

/**
 * Persiste un fichier analysé.
 * @param {object} file
 * @returns {Promise<object>}
 */
export const saveAnalyzedFile = async (file) => {
};

/**
 * Persiste une erreur détectée.
 * @param {object} error
 * @returns {Promise<object>}
 */
export const saveDetectedError = async (error) => {
};

/**
 * Persiste une correction proposée.
 * @param {object} fix
 * @returns {Promise<object>}
 */
export const saveSuggestedFix = async (fix) => {
};

/**
 * Exécute l'analyse complète (orchestre GitHub, OpenRouter, Mermaid, persistance).
 * Mis à jour le statut et la progression au fil du traitement.
 * @param {number} analysisId
 * @returns {Promise<void>}
 */
export const runAnalysis = async (analysisId) => {
};

/**
 * Met à jour la progression (en %) d'une analyse en cours.
 * @param {number} analysisId
 * @param {number} progress
 * @returns {Promise<void>}
 */
export const updateProgress = async (analysisId, progress) => {
};

/**
 * Passe une analyse au statut "completed".
 * @param {number} analysisId
 * @returns {Promise<void>}
 */
export const markAsCompleted = async (analysisId) => {
};

/**
 * Passe une analyse au statut "failed" avec un message d'erreur.
 * @param {number} analysisId
 * @param {string} reason
 * @returns {Promise<void>}
 */
export const markAsFailed = async (analysisId, reason) => {
};
