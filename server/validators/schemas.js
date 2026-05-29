import Joi from "joi";

// ─── PROJECT ──────────────────────────────────────────────────────────────────

export const createProjectSchema = Joi.object({
    github_repo_url: Joi.string()
        .uri({ scheme: ["http", "https"] })
        .pattern(/github\.com/)
        .max(255)
        .required(),
});

export const projectIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

// ─── ANALYSIS ─────────────────────────────────────────────────────────────────

export const startAnalysisSchema = Joi.object({
    project_id: Joi.number().integer().positive().required(),
});
