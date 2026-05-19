import {
    create,
    findById,
    listByProjectId,
    getFullResult,
} from "../services/analysisService.js";

/**
 * Démarre une nouvelle analyse pour un projet et la place en file d'attente.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const start = async (req, res) => {
};

/**
 * Retourne le statut courant d'une analyse (polling).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getStatus = async (req, res) => {
};

/**
 * Retourne le résultat complet d'une analyse (fichiers, erreurs/fixes, mermaid).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getResult = async (req, res) => {
};

/**
 * Liste les analyses d'un projet.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const list = async (req, res) => {
};
