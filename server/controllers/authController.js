import {
    getAuthorizationUrl,
    exchangeCode,
    fetchGitHubUser,
    createOrUpdateUser,
    findUserById,
} from "../services/authService.js";

/**
 * Redirige l'utilisateur vers la page d'autorisation GitHub OAuth.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const login = (req, res) => {
};

/**
 * Callback OAuth : échange le code contre un token, récupère le profil GitHub
 * et crée/met à jour l'utilisateur, puis ouvre la session.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const callback = async (req, res) => {
};

/**
 * Détruit la session courante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const logout = (req, res) => {
};

/**
 * Retourne l'utilisateur de la session courante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getCurrentUser = async (req, res) => {
};
