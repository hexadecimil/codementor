import xss from "xss";

/**
 * Sanitise récursivement une valeur (chaîne, tableau ou objet) contre les
 * injections XSS. Les chaînes sont nettoyées via xss() après suppression des
 * espaces de début/fin.
 * @param {*} value Valeur à nettoyer.
 * @returns {*} La valeur nettoyée, de même forme que l'entrée.
 */
const sanitizeValue = (value) => {
  if (typeof value === "string") return xss(value.trim());
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeObject(value);
  return value;
};

/**
 * Sanitise récursivement chaque valeur d'un objet.
 * @param {object} obj Objet dont les valeurs sont à nettoyer.
 * @returns {object} Un nouvel objet aux valeurs nettoyées.
 */
const sanitizeObject = (obj) => {
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = sanitizeValue(obj[key]);
  }
  return result;
};

/**
 * Middleware Express : nettoie req.body de tout contenu HTML/JS malveillant.
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export const sanitize = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};
