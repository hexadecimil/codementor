import pool from "../db/pool.js";
import { OAuthApp } from "@octokit/oauth-app";

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

  return url;
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
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Crée ou met à jour l'utilisateur en BDD (upsert via INSERT ... ON DUPLICATE KEY UPDATE).
 * @param {object} user
 * @returns {Promise<object>}
 */
export const createOrUpdateUser = async (user) => {
  const { github_id, access_token } = user;

  await pool.query(
    `INSERT INTO t_user (github_id, access_token)
     VALUES (?,?)
     ON DUPLICATE KEY UPDATE access_token = VALUES(access_token)`,
    [github_id, access_token],
  );

  const [rows] = await pool.query(
    "SELECT pk_user AS id, github_id, access_token, created_at FROM t_user WHERE github_id = ?",
    [github_id],
  );

  return rows[0];
};

/**
 * Recherche un utilisateur par son id interne (pk_user).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findUserById = async (id) => {
  const rows = await pool.query(
    `SELECT pk_user AS id, github_id, access_token, created_at FROM t_user WHERE pk_user = ?`,
    [id]
  )

  return rows[0];
};
