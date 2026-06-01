/**
 * Erreur applicative portant un code HTTP, pour une réponse client maîtrisée
 * (ex. 403, 404, 409) au lieu d'un 500 générique.
 */
export class AppError extends Error {
    /**
     * @param {string} message
     * @param {number} statusCode
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
