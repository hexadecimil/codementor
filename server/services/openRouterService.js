import axios from "axios";

const httpClient = axios.create({ baseURL: "https://openrouter.ai/api/v1" });

/**
 * Envoie le contenu d'un fichier au LLM et retourne l'analyse complète :
 * résumé du fichier, erreurs détectées et correction suggérée (0..1 par erreur).
 *
 * @param {object} file
 * @param {string} file.path
 * @param {string} file.content
 * @param {string} file.language
 * @returns {Promise<{
 *   file_summary: string,
 *   errors: Array<{
 *     line_number: number,
 *     error_type: string,
 *     severity: string,
 *     description: string,
 *     code_snippet: string,
 *     suggested_fix: { description: string, suggested_code: string } | null
 *   }>
 * }>}
 */
export const analyzeFile = async (file) => {
};

/**
 * Demande au LLM un diagramme Mermaid à partir de la structure du projet.
 * @param {object} structure
 * @returns {Promise<string>}
 */
export const generateMermaid = async (structure) => {
};
