import axios from "axios";
import { getExtension } from "../utils/files.js";
import { AppError } from "../utils/AppError.js";

const httpClient = axios.create({
  baseURL: "https://api.github.com",
  timeout: 30000,
});

// Mappe les erreurs de l'API GitHub vers des codes HTTP clients.
// 401 = token invalide/révoqué : le client doit relancer la connexion GitHub.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) throw new AppError("Reconnexion GitHub requise", 401);
    if (status === 403) throw new AppError("Accès au dépôt refusé", 403);
    if (status === 404) throw new AppError("Dépôt introuvable", 404);
    throw error;
  },
);

// Taille maximale d'un fichier récupérable via l'API contents de GitHub (1 Mo).
const MAX_FILE_SIZE = 1_000_000;

export const parseRepoUrl = (repoUrl) => {
  // Capture owner/repo ; le nom du dépôt peut contenir des points (ex. my.repo).
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/#?]+)/);
  if (!match) throw new Error(`URL de dépôt invalide : ${repoUrl}`);
  const repo = match[2].replace(/\.git$/, "");
  return { owner: match[1], repo };
};

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  },
});

/**
 * Récupère l'arbre des fichiers d'un dépôt GitHub et le SHA du dernier commit.
 * @param {string} repoUrl
 * @param {string} token
 * @returns {Promise<{tree: object[], commitSha: string}>}
 */
export const fetchRepoTree = async (repoUrl, token) => {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const { data: repoInfo } = await httpClient.get(`/repos/${owner}/${repo}`, authHeader(token));

  const { data: branch } = await httpClient.get(
    `/repos/${owner}/${repo}/branches/${repoInfo.default_branch}`,
    authHeader(token),
  );

  const { data: treeData } = await httpClient.get(
    `/repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`,
    authHeader(token),
  );

  // GitHub tronque l'arborescence des très gros dépôts (limite ~100 000 entrées
  // ou 7 Mo de réponse). L'analyse serait alors partielle : on échoue explicitement
  // avec un message clair plutôt que de rendre un résultat incomplet présenté à 100 %.
  if (treeData.truncated) {
    throw new AppError(
      "Dépôt trop volumineux : l'arborescence GitHub a été tronquée, l'analyse complète est impossible.",
      413,
    );
  }

  return { tree: treeData.tree, commitSha: branch.commit.sha };
};

/**
 * Récupère le contenu texte d'un fichier d'un dépôt.
 * @param {string} repoUrl
 * @param {string} path
 * @param {string} token
 * @returns {Promise<string>}
 */
export const fetchFileContent = async (repoUrl, path, token) => {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const { data } = await httpClient.get(`/repos/${owner}/${repo}/contents/${path}`, authHeader(token));

  // L'API ne renvoie pas le contenu pour un binaire ou un fichier trop gros.
  if (data.encoding !== "base64" || !data.content) {
    throw new Error(`Contenu indisponible (binaire ou trop volumineux) : ${path}`);
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
};

/**
 * Vérifie que l'utilisateur a accès au dépôt ; lève une erreur sinon.
 * @param {string} repoUrl
 * @param {string} token
 * @returns {Promise<void>}
 * @throws {AppError} 401 reconnexion requise, 403 accès refusé, 404 introuvable (via l'intercepteur).
 */
export const ensureRepoAccess = async (repoUrl, token) => {
  const { owner, repo } = parseRepoUrl(repoUrl);
  await httpClient.get(`/repos/${owner}/${repo}`, authHeader(token));
};

/**
 * Récupère les métadonnées d'un dépôt GitHub (nom, langage, visibilité, étoiles...).
 * @param {string} repoUrl
 * @param {string} token
 * @returns {Promise<object>}
 */
export const fetchRepoMetadata = async (repoUrl, token) => {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const { data } = await httpClient.get(`/repos/${owner}/${repo}`, authHeader(token));

  return {
    html_url: data.html_url,
    visibility: data.visibility,
    stars: data.stargazers_count,
    language: data.language,
    created_at: data.created_at,
  };
};

const RELEVANT_EXTENSIONS = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "py",
  "java",
  "kt",
  "rb",
  "php",
  "go",
  "rs",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "html",
  "css",
  "scss",
  "vue",
  "svelte",
  "json",
  "yml",
  "yaml",
  "sql",
];

const EXCLUDED_PATHS = [
  "node_modules/",
  "dist/",
  "build/",
  ".git/",
  "vendor/",
  "target/",
  "__pycache__/",
  ".next/",
  ".nuxt/",
  "coverage/",
];

/**
 * Filtre l'arbre pour ne garder que les fichiers de code pertinents à analyser.
 * @param {object[]} tree
 * @returns {object[]}
 */
export const filterRelevantFiles = (tree) => {
  return tree.filter((entry) => {
    if (entry.type !== "blob") return false;
    if (entry.size > MAX_FILE_SIZE) return false;
    if (EXCLUDED_PATHS.some((excluded) => entry.path.includes(excluded))) return false;

    return RELEVANT_EXTENSIONS.includes(getExtension(entry.path));
  });
};
