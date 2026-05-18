import axios from "axios";

const httpClient = axios.create({ baseURL: "https://openrouter.ai/api/v1" });

/**
 * Demande au LLM une explication du rôle d'un fichier de code.
 * @param {string} content
 * @returns {Promise<string>}
 */
export const explainCode = async (content) => {
};

/**
 * Demande au LLM la détection d'erreurs dans un fichier de code.
 * @param {string} content
 * @returns {Promise<object[]>}
 */
export const detectErrors = async (content) => {
};

/**
 * Demande au LLM une correction pour une erreur détectée.
 * @param {object} error
 * @returns {Promise<object>}
 */
export const suggestFix = async (error) => {
};

/**
 * Demande au LLM un diagramme Mermaid à partir de la structure du projet.
 * @param {object} structure
 * @returns {Promise<string>}
 */
export const generateMermaid = async (structure) => {
};
