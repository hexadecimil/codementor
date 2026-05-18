const tasks = [];
let isProcessing = false;

/**
 * Ajoute une tâche (analyse) à la file d'attente.
 * @param {object} task
 */
export const enqueue = (task) => {
};

/**
 * Retire et retourne la prochaine tâche.
 * @returns {object|undefined}
 */
export const dequeue = () => {
};

/**
 * Retourne le statut courant d'une analyse dans la file.
 * @param {number} analysisId
 * @returns {string}
 */
export const getStatus = (analysisId) => {
};

/**
 * Démarre le worker s'il n'est pas déjà en cours et traite la prochaine tâche.
 * @returns {Promise<void>}
 */
export const processNext = async () => {
};

/**
 * Boucle interne : enchaîne le traitement des tâches en file.
 * @returns {Promise<void>}
 */
const worker = async () => {
};
