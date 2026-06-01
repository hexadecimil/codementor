import axios from "axios";
import pool from "../db/pool.js";
import { OAuthApp } from "@octokit/oauth-app";
import { encrypt, decrypt } from "../utils/crypto.js";
import { AppError } from "../utils/AppError.js";

const githubOAuthApp = new OAuthApp({
  clientType: "oauth-app",
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUrl: "http://localhost:3000/codementor/api/auth/callback",
});

/**
 * Retourne l'URL d'autorisation OAuth GitHub.
 * @returns {string}
 */
export const getAuthorizationUrl = () => {
  const { url } = githubOAuthApp.getWebFlowAuthorizationUrl({
    scopes: ["read:user", "repo", "user"],
  });

  // prompt=select_account force GitHub à réafficher l'écran de connexion /
  // choix du compte, même si une session GitHub est déjà active. Sans ça, après
  // une déconnexion de l'app, GitHub renverrait silencieusement le compte courant.
  return `${url}&prompt=select_account`;
};

/**
 * Échange un code OAuth contre un access_token GitHub.
 * @param {string} code
 * @returns {Promise<string>}
 */
export const exchangeCode = async (code) => {
  const { authentication } = await githubOAuthApp.createToken({ code });

  return authentication.token;
};

/**
 * Récupère le profil GitHub de l'utilisateur via son token.
 * @param {string} token
 * @returns {Promise<object>}
 */
export const fetchGitHubUser = async (token) => {
  try {
    const { data } = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      timeout: 30000,
    });
    return data;
  } catch (error) {
    // Token invalide ou révoqué : le client doit relancer la connexion GitHub.
    if (error.response?.status === 401) {
      throw new AppError("Reconnexion GitHub requise", 401);
    }
    throw new Error(`GitHub API error: ${error.response?.status ?? error.code}`);
  }
};

/**
 * Crée ou met à jour l'utilisateur en BDD (upsert via INSERT ... ON DUPLICATE KEY UPDATE).
 * @param {object} user
 * @returns {Promise<object>}
 */
export const createOrUpdateUser = async (user) => {
  const { github_id, access_token } = user;

  // Le token est chiffré avant d'être persisté (jamais stocké en clair).
  const encryptedToken = encrypt(access_token);

  await pool.query(
    `INSERT INTO t_user (github_id, access_token)
     VALUES (?,?)
     ON DUPLICATE KEY UPDATE access_token = VALUES(access_token)`,
    [github_id, encryptedToken],
  );

  const [rows] = await pool.query(
    "SELECT pk_user AS id, github_id, access_token, created_at FROM t_user WHERE github_id = ?",
    [github_id],
  );

  return rows[0] ?? null;
};

/**
 * Recherche un utilisateur par son id interne (pk_user).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT pk_user AS id, github_id, access_token, created_at FROM t_user WHERE pk_user = ?`,
    [id]
  );

  return rows[0] ?? null;
};

/**
 * Retourne le token GitHub déchiffré d'un utilisateur (pour les appels à l'API GitHub).
 * @param {number} userId
 * @returns {Promise<string|null>}
 */
export const getUserToken = async (userId) => {
  const [rows] = await pool.query(
    `SELECT access_token FROM t_user WHERE pk_user = ?`,
    [userId]
  );

  if (!rows[0]) return null;

  try {
    return decrypt(rows[0].access_token);
  } catch {
    // Token illisible (clé de chiffrement changée / donnée corrompue) : reconnexion requise.
    throw new AppError("Reconnexion GitHub requise", 401);
  }
};
