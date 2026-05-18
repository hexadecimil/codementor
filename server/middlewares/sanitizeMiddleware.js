import xss from "xss";

/**
 * Sanitise récursivement toutes les chaînes d'un objet contre les injections XSS.
 */
const sanitizeValue = (value) => {
    if (typeof value === "string") return xss(value.trim());
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (value && typeof value === "object") return sanitizeObject(value);
    return value;
};

const sanitizeObject = (obj) => {
    const result = {};
    for (const key of Object.keys(obj)) {
        result[key] = sanitizeValue(obj[key]);
    }
    return result;
};

/**
 * Middleware Express : nettoie req.body de tout contenu HTML/JS malveillant.
 */
export const sanitize = (req, _res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body);
    }
    next();
};
