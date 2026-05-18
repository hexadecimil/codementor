import axios from "axios";

const httpClient = axios.create({ baseURL: "https://api.github.com" });

/**
 * Récupère l'arbre des fichiers d'un dépôt GitHub.
 * @param {string} repoUrl
 * @param {string} token
 * @returns {Promise<object[]>}
 */
export const fetchRepoTree = async (repoUrl, token) => {
};

/**
 * Récupère le contenu (texte) d'un fichier d'un dépôt.
 * @param {string} repoUrl
 * @param {string} path
 * @param {string} token
 * @returns {Promise<string>}
 */
export const fetchFileContent = async (repoUrl, path, token) => {
};

/**
 * Vérifie que l'utilisateur a accès au dépôt avec son token.
 * @param {string} repoUrl
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const checkRepoAccess = async (repoUrl, token) => {
};

/**
 * Filtre l'arbre pour ne retourner que les fichiers pertinents à analyser.
 * @param {object[]} tree
 * @returns {object[]}
 */
export const filterRelevantFiles = (tree) => {
};
