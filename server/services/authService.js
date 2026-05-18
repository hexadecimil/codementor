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
 * Recherche un utilisateur par son identifiant GitHub.
 * @param {string|number} githubId
 * @returns {Promise<object|null>}
 */
export const findUserByGithubId = async (githubId) => {
};

/**
 * Recherche un utilisateur par son id interne (pk_user).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findUserById = async (id) => {
};

/**
 * Persiste un nouvel utilisateur en BDD.
 * @param {object} user
 * @returns {Promise<object>}
 */
export const saveUser = async (user) => {
};

/**
 * Crée ou met à jour l'utilisateur à partir d'un profil GitHub.
 * @param {object} githubUser
 * @returns {Promise<object>}
 */
export const createOrUpdateUser = async (githubUser) => {
};
