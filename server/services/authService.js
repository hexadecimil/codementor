import pool from "../db/pool.js";

/**
 * Retourne l'URL d'autorisation OAuth GitHub.
 * @returns {string}
 */
export const getAuthorizationUrl = () => {
};

/**
 * Échange un code OAuth contre un access_token GitHub.
 * @param {string} code
 * @returns {Promise<string>}
 */
export const exchangeCode = async (code) => {
};

/**
 * Récupère le profil GitHub de l'utilisateur via son token.
 * @param {string} token
 * @returns {Promise<object>}
 */
export const fetchGitHubUser = async (token) => {
};

/**
 * Crée ou met à jour l'utilisateur en BDD (upsert via INSERT ... ON DUPLICATE KEY UPDATE).
 * @param {object} githubUser
 * @returns {Promise<object>}
 */
export const createOrUpdateUser = async (githubUser) => {
};

/**
 * Recherche un utilisateur par son id interne (pk_user).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findById = async (id) => {
};
