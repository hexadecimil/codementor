import Joi from "joi";

// Validation de l'URL d'un dépôt GitHub à la création d'un projet.
export const createProjectSchema = Joi.object({
  github_repo_url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .pattern(/github\.com/)
    .max(255)
    .required(),
});

// Validation d'un identifiant numérique en paramètre d'URL (projet ou analyse).
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
