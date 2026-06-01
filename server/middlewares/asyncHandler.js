/**
 * Enveloppe un controller asynchrone : achemine toute erreur vers le
 * gestionnaire d'erreurs global via next(err), évitant les promesses
 * rejetées non gérées et les 500 silencieux.
 * @param {Function} handler
 * @returns {Function}
 */
export const asyncHandler = (handler) => (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
